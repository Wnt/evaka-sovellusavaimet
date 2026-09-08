// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { readFile, rm, writeFile } from 'node:fs/promises'

import { tokenFile } from './config.ts'

/**
 * The token lives in a single gitignored file on the demo server and never leaves it.
 *
 * The browser talks to this demo's own endpoints, which do not echo the token back in any form.
 * That is how a real integration should be built: a token grants everything its scopes allow to
 * anyone holding it, so it belongs on a server, not in `localStorage` where any XSS can read it.
 */

/** `evaka_pat_` + 256 bits of base64url. Same shape the api-gw checks before it does anything. */
const TOKEN_PATTERN = /^evaka_pat_[A-Za-z0-9_-]{43}$/

export const looksLikeToken = (token: string): boolean =>
  TOKEN_PATTERN.test(token.trim())

export async function readToken(): Promise<string | undefined> {
  try {
    const contents = await readFile(tokenFile, 'utf-8')
    const token = contents.trim()
    return token.length > 0 ? token : undefined
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw err
  }
}

export async function writeToken(token: string): Promise<void> {
  // 0600: nobody but the user running the demo can read it
  await writeFile(tokenFile, `${token.trim()}\n`, { encoding: 'utf-8', mode: 0o600 })
}

export async function forgetToken(): Promise<void> {
  await rm(tokenFile, { force: true })
}

/**
 * A token's identity, for display only. Never show a whole token again after it has been stored:
 * the last few characters are enough to tell two tokens apart.
 */
export const tokenHint = (token: string): string =>
  `evaka_pat_…${token.slice(-6)}`
