// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Where this demo listens. Deliberately not one of the ports the eVaka dev stack uses. */
export const demoPort = Number(process.env.PORT ?? 3100)

/**
 * Base URL of the eVaka api-gw. The gateway mounts the citizen API under `/api`, and in the local
 * dev stack it listens on port 3000 (see `compose/ecosystem.config.js`).
 */
export const evakaApiUrl = (
  process.env.EVAKA_API_URL ?? 'http://localhost:3000/api'
).replace(/\/$/, '')

/** Citizen frontend of the local dev stack, linked from the onboarding instructions. */
export const evakaCitizenUrl = (
  process.env.EVAKA_CITIZEN_URL ?? 'http://localhost:9099'
).replace(/\/$/, '')

/** The token file. Gitignored, and readable only by the user running the demo. */
export const tokenFile = resolve(rootDir, '.token')

export const publicDir = resolve(rootDir, 'public')

/**
 * The scopes this demo asks for. Nothing else is needed: the calendar view, the .ics export and
 * the message list are all built from endpoints that already exist in the citizen API.
 */
export const requiredScopes = [
  'calendar:read',
  'reservations:read',
  'messages:read',
  'messages:mark-read'
] as const
