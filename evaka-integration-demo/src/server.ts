// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import express from 'express'

import type {
  CitizenCalendarEvent,
  CitizenMessageThread,
  PagedCitizenMessageThreads,
  ReservationsResponse
} from './api-types.ts'
import {
  demoPort,
  evakaApiUrl,
  evakaCitizenUrl,
  publicDir,
  requiredScopes
} from './config.ts'
import type { EvakaFailure, EvakaRequest } from './evaka-client.ts'
import { describeFailure, evakaRequest, requestUrl } from './evaka-client.ts'
import { addDays, buildIcs, childNames } from './ics.ts'
import { forgetToken, looksLikeToken, readToken, tokenHint, writeToken } from './token-store.ts'

const app = express()
app.use(express.json({ limit: '16kb' }))
app.use(express.static(publicDir))

// --- scope probes -----------------------------------------------------------------------------

interface ScopeProbe {
  scope: string
  label: string
  why: string
  request: EvakaRequest
}

/**
 * A thread id that cannot exist, used to probe the write scope.
 *
 * Scope enforcement happens in the api-gw, *before* the request ever reaches the service, so a
 * request against a non-existent thread answers the only question we are asking — "would this be
 * allowed?" — with no side effect whatsoever. A 403 means the scope is missing; anything else
 * means it was granted.
 */
const PROBE_THREAD_ID = '00000000-0000-4000-8000-000000000000'

const probeRange = () => {
  const today = new Date().toISOString().slice(0, 10)
  return { from: today, to: addDays(today, 1) }
}

function scopeProbes(): ScopeProbe[] {
  const { from, to } = probeRange()
  return [
    {
      scope: 'calendar:read',
      label: 'Kalenteritapahtumien luku',
      why: 'Näyttää kalenterinäkymän tapahtumat ja keskusteluajat.',
      request: {
        method: 'GET',
        path: '/citizen/calendar-events',
        query: { start: from, end: to }
      }
    },
    {
      scope: 'reservations:read',
      label: 'Varausten luku',
      why: 'Näyttää hoitoajat ja poissaolot kalenterissa ja .ics-tiedostossa.',
      request: {
        method: 'GET',
        path: '/citizen/reservations',
        query: { from, to }
      }
    },
    {
      scope: 'messages:read',
      label: 'Viestien luku',
      why: 'Listaa saapuneet viestiketjut.',
      request: { method: 'GET', path: '/citizen/messages/unread-count' }
    },
    {
      scope: 'messages:mark-read',
      label: 'Viestien merkitseminen luetuksi',
      why: 'Merkitsee avatun viestiketjun luetuksi eVakassa.',
      request: {
        method: 'PUT',
        path: `/citizen/messages/threads/${PROBE_THREAD_ID}/read`
      }
    }
  ]
}

type ProbeStatus = 'granted' | 'denied' | 'unknown'

interface ProbeResult {
  scope: string
  label: string
  why: string
  method: string
  url: string
  status: ProbeStatus
  detail: string
}

interface ScopeReport {
  checkedAt: string
  tokenHint: string
  results: ProbeResult[]
  allGranted: boolean
}

/** The last scope check, kept in memory so a page load does not re-probe on every request. */
let scopeReport: ScopeReport | undefined

class TokenRejected extends Error {}

async function runScopeProbes(token: string): Promise<ScopeReport> {
  const results: ProbeResult[] = []
  for (const probe of scopeProbes()) {
    const result = await evakaRequest<unknown>(token, probe.request)
    let status: ProbeStatus
    let detail: string
    if (result.ok) {
      status = 'granted'
      detail = `HTTP ${result.status}`
    } else if (result.failure.kind === 'forbidden') {
      status = 'denied'
      detail = 'HTTP 403 INSUFFICIENT_SCOPE'
    } else if (result.failure.kind === 'unauthorized') {
      throw new TokenRejected(describeFailure(result.failure))
    } else if (result.failure.kind === 'unreachable') {
      throw new TokenRejected(describeFailure(result.failure))
    } else {
      // The scope check already passed in the api-gw; the error came from the service behind it
      status = 'granted'
      detail = `HTTP ${result.failure.status} (oikeus on myönnetty, mutta kutsu epäonnistui)`
    }
    results.push({
      scope: probe.scope,
      label: probe.label,
      why: probe.why,
      method: probe.request.method,
      url: requestUrl(probe.request),
      status,
      detail
    })
  }
  return {
    checkedAt: new Date().toISOString(),
    tokenHint: tokenHint(token),
    results,
    allGranted: results.every((it) => it.status === 'granted')
  }
}

// --- request helpers --------------------------------------------------------------------------

/**
 * Every failure that means "the token no longer works" ends the session: the token file is
 * removed and the browser is told to go back to onboarding.
 */
async function handleFailure(
  res: express.Response,
  failure: EvakaFailure
): Promise<void> {
  if (failure.kind === 'unauthorized') {
    await forgetToken()
    scopeReport = undefined
    res.status(401).json({
      error: 'TOKEN_INVALID',
      message:
        'eVaka hylkäsi avaimen (HTTP 401). Avain on todennäköisesti mitätöity tai vanhentunut. Luo uusi avain ja liitä se uudelleen.',
      body: failure.body
    })
    return
  }
  if (failure.kind === 'unreachable') {
    res.status(502).json({ error: 'EVAKA_UNREACHABLE', message: describeFailure(failure) })
    return
  }
  if (failure.kind === 'forbidden') {
    res.status(403).json({
      error: 'INSUFFICIENT_SCOPE',
      requiredScope: failure.requiredScope,
      message: describeFailure(failure),
      body: failure.body
    })
    return
  }
  res.status(502).json({
    error: 'EVAKA_ERROR',
    message: describeFailure(failure),
    body: failure.body
  })
}

async function requireToken(res: express.Response): Promise<string | undefined> {
  const token = await readToken()
  if (!token) {
    res.status(401).json({
      error: 'NO_TOKEN',
      message: 'Sovellusavainta ei ole liitetty. Palaa käyttöönottoon.'
    })
    return undefined
  }
  return token
}

const asyncRoute =
  (handler: (req: express.Request, res: express.Response) => Promise<void>): express.RequestHandler =>
  (req, res, next) => {
    handler(req, res).catch(next)
  }

// --- onboarding -------------------------------------------------------------------------------

app.get(
  '/api/config',
  asyncRoute(async (_req, res) => {
    res.json({
      evakaApiUrl,
      evakaCitizenUrl,
      requiredScopes,
      // The scopes this demo asks for, with the Finnish explanation shown during onboarding
      scopes: scopeProbes().map(({ scope, label, why }) => ({ scope, label, why })),
      probeThreadId: PROBE_THREAD_ID
    })
  })
)

app.get(
  '/api/status',
  asyncRoute(async (_req, res) => {
    const token = await readToken()
    if (!token) {
      res.json({ connected: false })
      return
    }
    if (!scopeReport) {
      try {
        scopeReport = await runScopeProbes(token)
      } catch (err) {
        if (err instanceof TokenRejected) {
          res.json({ connected: true, tokenHint: tokenHint(token), problem: err.message })
          return
        }
        throw err
      }
    }
    res.json({ connected: true, tokenHint: tokenHint(token), scopeReport })
  })
)

app.post(
  '/api/status/recheck',
  asyncRoute(async (_req, res) => {
    const token = await requireToken(res)
    if (!token) return
    try {
      scopeReport = await runScopeProbes(token)
    } catch (err) {
      if (err instanceof TokenRejected) {
        res.status(400).json({ error: 'TOKEN_REJECTED', message: err.message })
        return
      }
      throw err
    }
    res.json({ connected: true, tokenHint: tokenHint(token), scopeReport })
  })
)

app.post(
  '/api/token',
  asyncRoute(async (req, res) => {
    const raw = (req.body as { token?: unknown }).token
    const token = typeof raw === 'string' ? raw.trim() : ''
    if (!looksLikeToken(token)) {
      res.status(400).json({
        error: 'MALFORMED_TOKEN',
        message:
          'Avain ei ole oikean muotoinen. eVakan sovellusavain alkaa evaka_pat_ ja on 53 merkkiä pitkä.'
      })
      return
    }
    let report: ScopeReport
    try {
      report = await runScopeProbes(token)
    } catch (err) {
      if (err instanceof TokenRejected) {
        res.status(400).json({ error: 'TOKEN_REJECTED', message: err.message })
        return
      }
      throw err
    }
    // Only a token that actually works is written to disk
    await writeToken(token)
    scopeReport = report
    res.json({ connected: true, tokenHint: tokenHint(token), scopeReport: report })
  })
)

app.delete(
  '/api/token',
  asyncRoute(async (_req, res) => {
    await forgetToken()
    scopeReport = undefined
    res.json({ connected: false })
  })
)

// --- calendar ---------------------------------------------------------------------------------

const monthRange = (month: string): { from: string; to: string } => {
  const match = /^(\d{4})-(\d{2})$/.exec(month)
  const now = new Date()
  const year = match ? Number(match[1]) : now.getUTCFullYear()
  const monthIndex = match ? Number(match[2]) - 1 : now.getUTCMonth()
  const first = new Date(Date.UTC(year, monthIndex, 1))
  const last = new Date(Date.UTC(year, monthIndex + 1, 0))
  return { from: first.toISOString().slice(0, 10), to: last.toISOString().slice(0, 10) }
}

interface CalendarData {
  events: CitizenCalendarEvent[]
  reservations: ReservationsResponse | undefined
  warnings: string[]
}

/**
 * Fetches a month of calendar data. A missing scope degrades the view instead of breaking it,
 * which is what a well-behaved integration should do with a partially granted token.
 */
async function fetchCalendar(
  token: string,
  from: string,
  to: string,
  res: express.Response
): Promise<CalendarData | undefined> {
  const warnings: string[] = []

  const eventsResult = await evakaRequest<CitizenCalendarEvent[]>(token, {
    method: 'GET',
    path: '/citizen/calendar-events',
    query: { start: from, end: to }
  })
  if (!eventsResult.ok && eventsResult.failure.kind !== 'forbidden') {
    await handleFailure(res, eventsResult.failure)
    return undefined
  }
  if (!eventsResult.ok) warnings.push(describeFailure(eventsResult.failure))

  const reservationsResult = await evakaRequest<ReservationsResponse>(token, {
    method: 'GET',
    path: '/citizen/reservations',
    query: { from, to }
  })
  if (!reservationsResult.ok && reservationsResult.failure.kind !== 'forbidden') {
    await handleFailure(res, reservationsResult.failure)
    return undefined
  }
  if (!reservationsResult.ok) warnings.push(describeFailure(reservationsResult.failure))

  return {
    events: eventsResult.ok ? eventsResult.data : [],
    reservations: reservationsResult.ok ? reservationsResult.data : undefined,
    warnings
  }
}

app.get(
  '/api/calendar',
  asyncRoute(async (req, res) => {
    const token = await requireToken(res)
    if (!token) return
    const { from, to } = monthRange(String(req.query.month ?? ''))
    const data = await fetchCalendar(token, from, to, res)
    if (!data) return

    const names = childNames(data.reservations)
    res.json({
      from,
      to,
      requests: [
        requestUrl({ method: 'GET', path: '/citizen/calendar-events', query: { start: from, end: to } }),
        requestUrl({ method: 'GET', path: '/citizen/reservations', query: { from, to } })
      ],
      children: [...names.entries()].map(([id, name]) => ({ id, name })),
      days: (data.reservations?.days ?? []).map((day) => ({
        date: day.date,
        holiday: day.holiday,
        children: day.children.map((child) => ({
          childId: child.childId,
          name: names.get(child.childId) ?? child.childId,
          absence: child.absence?.type ?? null,
          reservations: child.reservations.map((reservation) =>
            reservation.type === 'TIMES'
              ? { start: reservation.range.start, end: reservation.range.end }
              : null
          )
        }))
      })),
      events: data.events.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        period: event.period,
        childNames: Object.keys(event.attendingChildren).map(
          (childId) => names.get(childId) ?? childId
        ),
        times: Object.entries(event.timesByChild).flatMap(([childId, times]) =>
          (times ?? []).map((time) => ({
            childName: names.get(childId) ?? childId,
            date: time.date,
            startTime: time.startTime,
            endTime: time.endTime
          }))
        )
      })),
      warnings: data.warnings
    })
  })
)

app.get(
  '/api/calendar.ics',
  asyncRoute(async (req, res) => {
    const token = await requireToken(res)
    if (!token) return
    const { from, to } = monthRange(String(req.query.month ?? ''))
    const data = await fetchCalendar(token, from, to, res)
    if (!data) return
    const ics = buildIcs({ events: data.events, reservations: data.reservations })
    res.setHeader('content-type', 'text/calendar; charset=utf-8')
    res.setHeader('content-disposition', `attachment; filename="evaka-${from.slice(0, 7)}.ics"`)
    res.send(ics)
  })
)

// --- messages ---------------------------------------------------------------------------------

const threadSummary = (thread: CitizenMessageThread) =>
  thread.type === 'Redacted'
    ? {
        id: thread.id,
        redacted: true,
        title: null,
        senderName: thread.sender?.name ?? null,
        urgent: thread.urgent,
        unread: thread.hasUnreadMessages,
        lastMessageSentAt: thread.lastMessageSentAt,
        messageCount: null,
        children: [] as string[]
      }
    : {
        id: thread.id,
        redacted: false,
        title: thread.title,
        senderName: thread.messages[0]?.sender.name ?? null,
        urgent: thread.urgent,
        unread: thread.messages.some((message) => message.readAt === null),
        lastMessageSentAt: thread.messages[thread.messages.length - 1]?.sentAt ?? null,
        messageCount: thread.messages.length,
        children: thread.children.map((child) =>
          `${child.preferredName || child.firstName} ${child.lastName}`.trim()
        )
      }

app.get(
  '/api/messages',
  asyncRoute(async (req, res) => {
    const token = await requireToken(res)
    if (!token) return
    const page = Math.max(1, Number(req.query.page ?? 1) || 1)
    const request: EvakaRequest = {
      method: 'GET',
      path: '/citizen/messages/received',
      query: { page }
    }
    const result = await evakaRequest<PagedCitizenMessageThreads>(token, request)
    if (!result.ok) {
      await handleFailure(res, result.failure)
      return
    }
    res.json({
      page,
      pages: result.data.pages,
      total: result.data.total,
      request: requestUrl(request),
      threads: result.data.data.map(threadSummary)
    })
  })
)

/** There is no single-thread endpoint in the citizen API, so the thread is picked from the list. */
async function findThread(
  token: string,
  threadId: string
): Promise<{ thread: CitizenMessageThread | undefined; failure?: EvakaFailure }> {
  for (let page = 1; page <= 10; page++) {
    const result = await evakaRequest<PagedCitizenMessageThreads>(token, {
      method: 'GET',
      path: '/citizen/messages/received',
      query: { page }
    })
    if (!result.ok) return { thread: undefined, failure: result.failure }
    const thread = result.data.data.find((it) => it.id === threadId)
    if (thread) return { thread }
    if (page >= result.data.pages) break
  }
  return { thread: undefined }
}

app.get(
  '/api/messages/:threadId',
  asyncRoute(async (req, res) => {
    const token = await requireToken(res)
    if (!token) return
    const { thread, failure } = await findThread(token, String(req.params.threadId))
    if (failure) {
      await handleFailure(res, failure)
      return
    }
    if (!thread) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Viestiketjua ei löytynyt.' })
      return
    }
    if (thread.type === 'Redacted') {
      res.json({
        id: thread.id,
        redacted: true,
        title: null,
        urgent: thread.urgent,
        messages: [],
        note: 'Ketju on arkaluonteinen. Sovellusavain tunnistautuu heikosti tunnistautuneena kansalaisena, joten eVaka ei luovuta sen sisältöä.'
      })
      return
    }
    res.json({
      id: thread.id,
      redacted: false,
      title: thread.title,
      urgent: thread.urgent,
      sensitive: thread.sensitive,
      children: thread.children.map((child) =>
        `${child.preferredName || child.firstName} ${child.lastName}`.trim()
      ),
      messages: thread.messages.map((message) => ({
        id: message.id,
        senderName: message.sender.name,
        sentAt: message.sentAt,
        readAt: message.readAt,
        content: message.content
      }))
    })
  })
)

app.post(
  '/api/messages/:threadId/read',
  asyncRoute(async (req, res) => {
    const token = await requireToken(res)
    if (!token) return
    const request: EvakaRequest = {
      method: 'PUT',
      path: `/citizen/messages/threads/${String(req.params.threadId)}/read`
    }
    const result = await evakaRequest<void>(token, request)
    if (!result.ok) {
      await handleFailure(res, result.failure)
      return
    }
    res.json({
      ok: true,
      request: `PUT ${requestUrl(request)}`,
      status: result.status,
      message: 'Ketju merkittiin luetuksi eVakassa oikeudella messages:mark-read.'
    })
  })
)

// --- the missing-scope demonstration ------------------------------------------------------------

/**
 * Calls an endpoint this demo deliberately did not ask for. `GET /citizen/children` is on the
 * citizen API's allowlist — it is guarded by `children:read` — but this demo only ever requested
 * `calendar:read`, `reservations:read`, `messages:read` and `messages:mark-read`, so the token it
 * holds does not carry `children:read`. The api-gw rejects the request before the service ever
 * sees it, which is a genuine scope refusal: the endpoint exists and is reachable with the right
 * token, just not with this one.
 */
const FORBIDDEN_PROBE: EvakaRequest = {
  method: 'GET',
  path: '/citizen/children'
}

app.get(
  '/api/scope-test',
  asyncRoute(async (_req, res) => {
    const token = await requireToken(res)
    if (!token) return
    const result = await evakaRequest<unknown>(token, FORBIDDEN_PROBE)
    if (
      !result.ok &&
      (result.failure.kind === 'unreachable' || result.failure.kind === 'unauthorized')
    ) {
      // A failure that says nothing about scopes: report it as such instead of pretending
      await handleFailure(res, result.failure)
      return
    }
    let denied = false
    let status: number
    let body: unknown
    if (result.ok) {
      status = result.status
      body = result.data
    } else if (result.failure.kind === 'forbidden') {
      denied = true
      status = 403
      body = result.failure.body
    } else if (result.failure.kind === 'error') {
      status = result.failure.status
      body = result.failure.body
    } else {
      status = 500
      body = null
    }
    res.json({
      request: `${FORBIDDEN_PROBE.method} ${requestUrl(FORBIDDEN_PROBE)}`,
      requiredScope: 'children:read',
      denied,
      status,
      body,
      explanation: denied
        ? 'api-gw hylkäsi kutsun ennen kuin se ehti eVakan palveluun asti. Avaimelle ei ole myönnetty oikeutta children:read.'
        : 'Kutsu meni läpi. Avaimelle on ilmeisesti myönnetty laajemmat oikeudet kuin tämä demo pyytää.'
    })
  })
)

// --- error handling ---------------------------------------------------------------------------

app.use(((err, _req, res, _next) => {
  console.error('Unhandled error', err)
  if (res.headersSent) return
  res.status(500).json({
    error: 'DEMO_ERROR',
    message: 'Demosovelluksessa tapahtui odottamaton virhe. Katso palvelimen loki.'
  })
}) as express.ErrorRequestHandler)

app.listen(demoPort, () => {
  console.log(
    `eVaka-integraatiodemo: http://localhost:${demoPort}\n` +
      `  eVaka api-gw: ${evakaApiUrl}\n` +
      `  Tarvittavat oikeudet: ${requiredScopes.join(', ')}`
  )
})
