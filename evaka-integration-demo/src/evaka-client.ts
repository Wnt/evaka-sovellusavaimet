// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { evakaApiUrl } from './config.ts'

/**
 * A very small client for the eVaka citizen API, authenticated with a citizen API token.
 *
 * There is nothing eVaka-specific about it beyond the base URL: a token-authenticated request is
 * an ordinary HTTP request with an `Authorization: Bearer` header and no cookies. That is the
 * whole integration surface.
 */

export type EvakaFailure =
  /** The api-gw could not be reached at all — the dev stack is probably not running */
  | { kind: 'unreachable'; message: string }
  /** The token is unknown, expired or revoked. The api-gw answers before the service is involved */
  | { kind: 'unauthorized'; body: unknown }
  /** The token is valid, but this endpoint is outside the scopes it was granted */
  | { kind: 'forbidden'; requiredScope: string | undefined; body: unknown }
  /** Anything else: a 4xx or 5xx from the service behind the gateway */
  | { kind: 'error'; status: number; body: unknown }

export type EvakaResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; failure: EvakaFailure }

export interface EvakaRequest {
  method: 'GET' | 'PUT' | 'POST' | 'DELETE'
  /** Path under the citizen API, e.g. `/citizen/calendar-events` */
  path: string
  query?: Record<string, string | number | undefined>
}

/** The full URL a request goes to, shown in the UI so the demo is auditable by eye. */
export function requestUrl(request: EvakaRequest): string {
  const url = new URL(evakaApiUrl + request.path)
  for (const [key, value] of Object.entries(request.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }
  return url.toString()
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (text.length === 0) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

export async function evakaRequest<T>(
  token: string,
  request: EvakaRequest
): Promise<EvakaResult<T>> {
  let response: Response
  try {
    response = await fetch(requestUrl(request), {
      method: request.method,
      headers: {
        // The only thing that makes this an authenticated request
        authorization: `Bearer ${token}`,
        accept: 'application/json'
      },
      signal: AbortSignal.timeout(20_000)
    })
  } catch (err) {
    return {
      ok: false,
      failure: {
        kind: 'unreachable',
        message: err instanceof Error ? err.message : String(err)
      }
    }
  }

  const body = await parseBody(response)

  if (response.status === 401) {
    return { ok: false, failure: { kind: 'unauthorized', body } }
  }
  if (response.status === 403) {
    const requiredScope =
      typeof body === 'object' &&
      body !== null &&
      'requiredScope' in body &&
      typeof (body as { requiredScope: unknown }).requiredScope === 'string'
        ? (body as { requiredScope: string }).requiredScope
        : undefined
    return { ok: false, failure: { kind: 'forbidden', requiredScope, body } }
  }
  if (!response.ok) {
    return { ok: false, failure: { kind: 'error', status: response.status, body } }
  }

  return { ok: true, status: response.status, data: body as T }
}

/** Finnish, user-facing explanation of a failure. */
export function describeFailure(failure: EvakaFailure): string {
  switch (failure.kind) {
    case 'unreachable':
      return `eVakan api-gw:hen ei saada yhteyttä osoitteessa ${evakaApiUrl}. Käynnistä paikallinen kehitysympäristö ja yritä uudelleen. (${failure.message})`
    case 'unauthorized':
      return 'Avain ei kelpaa: se on vanhentunut, mitätöity tai kirjoitettu väärin.'
    case 'forbidden':
      return failure.requiredScope !== undefined
        ? `Avaimelle ei ole myönnetty oikeutta ${failure.requiredScope}.`
        : 'Tämä rajapinta ei ole avaimella käytettävissä lainkaan.'
    case 'error':
      return `eVaka vastasi virheellä (HTTP ${failure.status}).`
  }
}
