// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

/**
 * Browser side of the eVaka integration demo.
 *
 * It talks only to this demo's own backend. The eVaka API token stays on the server: nothing here
 * ever sees it, sends it or stores it.
 */

'use strict'

const state = {
  config: null,
  connected: false,
  month: new Date().toISOString().slice(0, 7),
  messagePage: 1,
  threadPage: null,
  selectedThreadId: null
}

// --- tiny DOM helpers (no innerHTML, so API content can never become markup) --------------------

function h(tag, props, ...children) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(props || {})) {
    if (key === 'class') node.className = value
    else if (key === 'onclick') node.addEventListener('click', value)
    else if (key === 'onkeydown') node.addEventListener('keydown', value)
    else if (value !== null && value !== undefined) node.setAttribute(key, value)
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child)
  }
  return node
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild)
}

const $ = (id) => document.getElementById(id)

// --- error handling ----------------------------------------------------------------------------

class ApiError extends Error {
  constructor(status, payload) {
    super((payload && payload.message) || `HTTP ${status}`)
    this.status = status
    this.payload = payload || {}
  }
}

function showBanner(message, kind) {
  const banner = $('banner')
  banner.textContent = message
  banner.className = kind === 'info' ? 'banner info' : 'banner'
  banner.hidden = false
}

function hideBanner() {
  $('banner').hidden = true
}

/**
 * A 401 means the token was revoked or has expired. eVaka answers before the request reaches the
 * service, and the demo backend has already forgotten the token, so the only thing left to do is
 * take the user back to onboarding and say why.
 */
function handleError(err) {
  if (err instanceof ApiError && (err.payload.error === 'TOKEN_INVALID' || err.payload.error === 'NO_TOKEN')) {
    state.connected = false
    refreshStatus().catch(() => undefined)
    location.hash = '#/kayttoonotto'
    showBanner(err.message)
    return
  }
  showBanner(err instanceof Error ? err.message : String(err))
}

async function api(path, options) {
  let response
  try {
    response = await fetch(path, options)
  } catch (err) {
    throw new ApiError(0, {
      message: `Demopalvelimeen ei saada yhteyttä (${err.message}).`
    })
  }
  const text = await response.text()
  let payload = null
  if (text.length > 0) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { message: text }
    }
  }
  if (!response.ok) throw new ApiError(response.status, payload)
  return payload
}

// --- formatting --------------------------------------------------------------------------------

const MONTH_NAMES = [
  'tammikuu', 'helmikuu', 'maaliskuu', 'huhtikuu', 'toukokuu', 'kesäkuu',
  'heinäkuu', 'elokuu', 'syyskuu', 'lokakuu', 'marraskuu', 'joulukuu'
]

const formatMonth = (month) => {
  const [year, m] = month.split('-')
  return `${MONTH_NAMES[Number(m) - 1]} ${year}`
}

const formatDate = (isoDate) => {
  const [year, month, day] = isoDate.split('-')
  return `${Number(day)}.${Number(month)}.${year}`
}

const formatDateTime = (iso) => {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} ${String(
    date.getHours()
  ).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}`
}

const shortTime = (time) => (time || '').slice(0, 5)

const shiftMonth = (month, delta) => {
  const [year, m] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year, m - 1 + delta, 1))
  return date.toISOString().slice(0, 7)
}

const addDays = (isoDate, days) => {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d) + days * 86400000).toISOString().slice(0, 10)
}

/** Monday = 0, matching the Finnish week. */
const weekdayIndex = (isoDate) => {
  const [y, m, d] = isoDate.split('-').map(Number)
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7
}

// --- onboarding --------------------------------------------------------------------------------

function renderScopeRequest() {
  const list = $('scope-request')
  clear(list)
  for (const scope of state.config.scopes) {
    list.appendChild(
      h('li', {}, h('code', {}, scope.scope), ' — ', h('strong', {}, scope.label), h('div', { class: 'hint' }, scope.why))
    )
  }
  $('evaka-link').setAttribute('href', state.config.evakaCitizenUrl)
  $('evaka-link').textContent = state.config.evakaCitizenUrl
}

const STATUS_TEXT = {
  granted: 'Myönnetty',
  denied: 'EI myönnetty',
  unknown: 'Ei tiedossa'
}

function renderScopeReport(report) {
  const section = $('scope-report')
  const body = $('scope-report-body')
  clear(body)
  if (!report) {
    section.hidden = true
    return
  }
  section.hidden = false
  for (const result of report.results) {
    body.appendChild(
      h(
        'tr',
        {},
        h('td', {}, h('code', {}, result.scope), h('div', { class: 'hint' }, result.label)),
        h('td', {}, h('code', {}, `${result.method} ${result.url}`)),
        h(
          'td',
          {},
          h('span', { class: `status-${result.status}` }, STATUS_TEXT[result.status]),
          h('div', { class: 'hint' }, result.detail)
        )
      )
    )
  }
}

async function refreshStatus() {
  const status = await api('/api/status')
  state.connected = Boolean(status.connected)
  $('token-state').textContent = status.connected
    ? `Avain liitetty: ${status.tokenHint}`
    : 'Avainta ei ole liitetty'
  renderScopeReport(status.scopeReport)
  $('token-form').hidden = Boolean(status.connected)
  if (status.problem) showBanner(status.problem)
  return status
}

async function submitToken(event) {
  event.preventDefault()
  hideBanner()
  const input = $('token-input')
  const button = $('token-submit')
  button.disabled = true
  button.textContent = 'Tarkistetaan…'
  try {
    const result = await api('/api/token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: input.value })
    })
    input.value = ''
    state.connected = true
    $('token-state').textContent = `Avain liitetty: ${result.tokenHint}`
    $('token-form').hidden = true
    renderScopeReport(result.scopeReport)
    if (!result.scopeReport.allGranted) {
      showBanner(
        'Avain toimii, mutta kaikkia pyydettyjä oikeuksia ei ole myönnetty. Osa näkymistä jää vajaaksi.',
        'info'
      )
    } else {
      showBanner('Avain liitetty. Kaikki pyydetyt oikeudet ovat käytössä.', 'info')
    }
  } catch (err) {
    handleError(err)
  } finally {
    button.disabled = false
    button.textContent = 'Liitä avain'
  }
}

async function forgetToken() {
  hideBanner()
  try {
    await api('/api/token', { method: 'DELETE' })
    state.connected = false
    $('token-state').textContent = 'Avainta ei ole liitetty'
    $('token-form').hidden = false
    renderScopeReport(null)
    showBanner('Avain poistettiin demopalvelimelta. Muista mitätöidä se myös eVakassa.', 'info')
  } catch (err) {
    handleError(err)
  }
}

async function runScopeTest() {
  const output = $('scope-test-output')
  const button = $('scope-test')
  button.disabled = true
  try {
    const result = await api('/api/scope-test')
    output.hidden = false
    output.textContent = [
      result.request,
      '',
      `HTTP ${result.status}`,
      JSON.stringify(result.body, null, 2),
      '',
      result.explanation
    ].join('\n')
  } catch (err) {
    if (err instanceof ApiError && err.payload.error === 'INSUFFICIENT_SCOPE') {
      // Should not happen — the backend reports the 403 as data — but keep it visible anyway
      output.hidden = false
      output.textContent = JSON.stringify(err.payload, null, 2)
    } else {
      handleError(err)
    }
  } finally {
    button.disabled = false
  }
}

// --- calendar ----------------------------------------------------------------------------------

function renderCalendar(data) {
  $('month-label').textContent = formatMonth(state.month)
  $('calendar-requests').textContent = data.requests.join('  •  ')

  const warnings = $('calendar-warnings')
  clear(warnings)
  for (const warning of data.warnings) {
    warnings.appendChild(h('div', { class: 'banner info' }, warning))
  }

  const daysByDate = new Map(data.days.map((day) => [day.date, day]))
  const grid = $('calendar-grid')
  clear(grid)
  for (const name of ['ma', 'ti', 'ke', 'to', 'pe', 'la', 'su']) {
    grid.appendChild(h('div', { class: 'calendar-head' }, name))
  }
  for (let i = 0; i < weekdayIndex(data.from); i++) {
    grid.appendChild(h('div', { class: 'day empty' }))
  }

  for (let date = data.from; date <= data.to; date = addDays(date, 1)) {
    const day = daysByDate.get(date)
    const entries = []
    for (const child of day ? day.children : []) {
      for (const reservation of child.reservations) {
        entries.push(
          h(
            'div',
            { class: 'entry' },
            reservation
              ? `${shortTime(reservation.start)}–${shortTime(reservation.end)} ${child.name}`
              : `Läsnä (ei kellonaikaa) ${child.name}`
          )
        )
      }
      if (child.absence) {
        entries.push(h('div', { class: 'entry absence' }, `Poissa: ${child.name}`))
      }
    }
    for (const event of data.events) {
      if (date >= event.period.start && date <= event.period.end) {
        entries.push(h('div', { class: 'entry event' }, event.title))
      }
      for (const time of event.times) {
        if (time.date === date) {
          entries.push(
            h('div', { class: 'entry event' }, `${shortTime(time.startTime)} ${event.title}`)
          )
        }
      }
    }
    grid.appendChild(
      h(
        'div',
        { class: day && day.holiday ? 'day holiday' : 'day' },
        h('div', { class: 'date' }, String(Number(date.slice(8)))),
        entries
      )
    )
  }

  const eventList = $('calendar-events')
  clear(eventList)
  if (data.events.length > 0) {
    eventList.appendChild(h('h3', {}, 'Kalenteritapahtumat'))
    for (const event of data.events) {
      eventList.appendChild(
        h(
          'div',
          { class: 'card' },
          h('strong', {}, event.title),
          h(
            'div',
            { class: 'hint' },
            `${formatDate(event.period.start)}–${formatDate(event.period.end)}` +
              (event.childNames.length > 0 ? ` • ${event.childNames.join(', ')}` : '')
          ),
          event.description ? h('p', {}, event.description) : null,
          event.times.length > 0
            ? h(
                'ul',
                {},
                event.times.map((time) =>
                  h(
                    'li',
                    {},
                    `${formatDate(time.date)} ${shortTime(time.startTime)}–${shortTime(
                      time.endTime
                    )} • ${time.childName}`
                  )
                )
              )
            : null
        )
      )
    }
  }
  if (data.days.length === 0 && data.events.length === 0) {
    eventList.appendChild(
      h('p', { class: 'hint' }, 'Tälle kuukaudelle ei löytynyt kalenteritietoja.')
    )
  }
}

async function loadCalendar() {
  hideBanner()
  try {
    renderCalendar(await api(`/api/calendar?month=${encodeURIComponent(state.month)}`))
  } catch (err) {
    handleError(err)
  }
}

async function downloadIcs() {
  hideBanner()
  const button = $('download-ics')
  button.disabled = true
  try {
    const response = await fetch(`/api/calendar.ics?month=${encodeURIComponent(state.month)}`)
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new ApiError(response.status, payload)
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = h('a', { href: url, download: `evaka-${state.month}.ics` })
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch (err) {
    handleError(err)
  } finally {
    button.disabled = false
  }
}

// --- messages ----------------------------------------------------------------------------------

function renderThreads(data) {
  $('messages-request').textContent = `GET ${data.request}`
  const list = $('thread-list')
  clear(list)
  if (data.threads.length === 0) {
    list.appendChild(h('li', { class: 'hint' }, 'Ei viestejä.'))
  }
  for (const thread of data.threads) {
    list.appendChild(
      h(
        'li',
        {
          class: thread.id === state.selectedThreadId ? 'selected' : '',
          role: 'button',
          tabindex: '0',
          onclick: () => openThread(thread.id),
          onkeydown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              openThread(thread.id)
            }
          }
        },
        h(
          'div',
          { class: 'title' },
          thread.unread ? h('span', { class: 'unread-dot' }) : null,
          thread.redacted ? 'Arkaluonteinen viesti' : thread.title || '(ei otsikkoa)',
          thread.urgent ? h('span', { class: 'tag urgent' }, 'Kiireellinen') : null,
          thread.redacted ? h('span', { class: 'tag redacted' }, 'Salattu') : null
        ),
        h(
          'div',
          { class: 'meta' },
          [thread.senderName, formatDateTime(thread.lastMessageSentAt)].filter(Boolean).join(' • ')
        ),
        thread.children.length > 0 ? h('div', { class: 'meta' }, thread.children.join(', ')) : null
      )
    )
  }

  const paging = $('thread-paging')
  clear(paging)
  if (data.pages > 1) {
    paging.appendChild(
      h(
        'button',
        {
          class: 'secondary',
          onclick: () => loadMessages(Math.max(1, state.messagePage - 1))
        },
        '‹ Edellinen'
      )
    )
    paging.appendChild(h('span', { class: 'hint' }, `Sivu ${data.page} / ${data.pages}`))
    paging.appendChild(
      h(
        'button',
        {
          class: 'secondary',
          onclick: () => loadMessages(Math.min(data.pages, state.messagePage + 1))
        },
        'Seuraava ›'
      )
    )
  }
}

async function loadMessages(page) {
  hideBanner()
  state.messagePage = page || state.messagePage
  try {
    const data = await api(`/api/messages?page=${state.messagePage}`)
    state.threadPage = data
    renderThreads(data)
  } catch (err) {
    handleError(err)
  }
}

function renderThread(thread, readResult) {
  const detail = $('thread-detail')
  clear(detail)
  detail.appendChild(
    h(
      'h3',
      {},
      thread.redacted ? 'Arkaluonteinen viesti' : thread.title || '(ei otsikkoa)',
      thread.urgent ? h('span', { class: 'tag urgent' }, 'Kiireellinen') : null
    )
  )
  if (thread.note) detail.appendChild(h('p', { class: 'hint' }, thread.note))
  if (thread.children && thread.children.length > 0) {
    detail.appendChild(h('p', { class: 'hint' }, thread.children.join(', ')))
  }
  for (const message of thread.messages) {
    detail.appendChild(
      h(
        'div',
        { class: 'message' },
        h(
          'div',
          { class: 'meta' },
          `${message.senderName} • ${formatDateTime(message.sentAt)}` +
            (message.readAt ? ` • luettu ${formatDateTime(message.readAt)}` : ' • lukematon')
        ),
        message.content
      )
    )
  }
  if (!thread.redacted) {
    detail.appendChild(
      h(
        'div',
        { class: 'row' },
        h('button', { onclick: () => markRead(thread.id) }, 'Merkitse luetuksi (MESSAGES_MARK_READ)')
      )
    )
    detail.appendChild(
      h(
        'p',
        { class: 'hint' },
        'Tämä on kirjoitusoikeus: sama avain, eri scope. Ilman oikeutta MESSAGES_MARK_READ api-gw vastaisi 403.'
      )
    )
  }
  if (readResult) {
    detail.appendChild(h('pre', {}, `${readResult.request}\nHTTP ${readResult.status}\n\n${readResult.message}`))
  }
}

async function openThread(threadId) {
  hideBanner()
  state.selectedThreadId = threadId
  if (state.threadPage) renderThreads(state.threadPage)
  try {
    renderThread(await api(`/api/messages/${encodeURIComponent(threadId)}`), null)
  } catch (err) {
    handleError(err)
  }
}

async function markRead(threadId) {
  hideBanner()
  try {
    const result = await api(`/api/messages/${encodeURIComponent(threadId)}/read`, {
      method: 'POST'
    })
    const thread = await api(`/api/messages/${encodeURIComponent(threadId)}`)
    renderThread(thread, result)
    await loadMessages(state.messagePage)
  } catch (err) {
    handleError(err)
  }
}

// --- routing -----------------------------------------------------------------------------------

const VIEWS = ['kayttoonotto', 'kalenteri', 'viestit']

function route() {
  let view = location.hash.replace('#/', '')
  if (!VIEWS.includes(view)) view = 'kayttoonotto'
  if (view !== 'kayttoonotto' && !state.connected) {
    showBanner('Liitä ensin sovellusavain.', 'info')
    view = 'kayttoonotto'
    location.hash = '#/kayttoonotto'
  }
  for (const name of VIEWS) {
    $(`view-${name}`).hidden = name !== view
  }
  for (const link of document.querySelectorAll('#nav a')) {
    link.classList.toggle('active', link.dataset.view === view)
  }
  if (view === 'kalenteri') loadCalendar()
  if (view === 'viestit') loadMessages(state.messagePage)
}

async function init() {
  $('token-form').addEventListener('submit', submitToken)
  $('token-reveal').addEventListener('change', (event) => {
    $('token-input').type = event.target.checked ? 'text' : 'password'
  })
  $('forget-token').addEventListener('click', forgetToken)
  $('recheck-scopes').addEventListener('click', async () => {
    hideBanner()
    try {
      const result = await api('/api/status/recheck', { method: 'POST' })
      renderScopeReport(result.scopeReport)
      showBanner('Oikeudet tarkistettiin uudelleen eVakasta.', 'info')
    } catch (err) {
      handleError(err)
    }
  })
  $('scope-test').addEventListener('click', runScopeTest)
  $('download-ics').addEventListener('click', downloadIcs)
  $('prev-month').addEventListener('click', () => {
    state.month = shiftMonth(state.month, -1)
    loadCalendar()
  })
  $('next-month').addEventListener('click', () => {
    state.month = shiftMonth(state.month, 1)
    loadCalendar()
  })
  window.addEventListener('hashchange', route)

  try {
    state.config = await api('/api/config')
    renderScopeRequest()
    await refreshStatus()
  } catch (err) {
    handleError(err)
  }
  route()
}

init()
