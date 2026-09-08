// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import type {
  CitizenCalendarEvent,
  IsoDate,
  IsoTime,
  ReservationsResponse
} from './api-types.ts'

/**
 * Builds an RFC 5545 calendar out of data the demo already fetched.
 *
 * This is the whole point of the calendar screen: eVaka needs no special-purpose iCal endpoint,
 * because a scoped token plus the ordinary `GET /citizen/calendar-events` and
 * `GET /citizen/reservations` endpoints let any client produce exactly the feed it wants — in the
 * format, timezone and level of detail *it* chooses, without eVaka having to maintain, version and
 * secure one more public API surface.
 */

const PRODID = '-//eVaka integration demo//FI'
const TZID = 'Europe/Helsinki'

/** Static Finnish timezone definition, so the file is correct without a timezone library. */
const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  `TZID:${TZID}`,
  'BEGIN:STANDARD',
  'DTSTART:19701025T040000',
  'TZOFFSETFROM:+0300',
  'TZOFFSETTO:+0200',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'TZNAME:EET',
  'END:STANDARD',
  'BEGIN:DAYLIGHT',
  'DTSTART:19700329T030000',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0300',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'TZNAME:EEST',
  'END:DAYLIGHT',
  'END:VTIMEZONE'
]

const escapeText = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')

const icsDate = (date: IsoDate): string => date.replace(/-/g, '')

const icsTime = (time: IsoTime): string => {
  const [h = '00', m = '00', s = '00'] = time.split(':')
  return `${h.padStart(2, '0')}${m.padStart(2, '0')}${s.padStart(2, '0')}`
}

/** Adds days to a plain ISO date without dragging the local timezone into it. */
export function addDays(date: IsoDate, days: number): IsoDate {
  const [y, m, d] = date.split('-').map(Number)
  const time = Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) + days * 86_400_000
  return new Date(time).toISOString().slice(0, 10)
}

const utcStamp = (now: Date): string =>
  `${now.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`

/** RFC 5545 requires lines of at most 75 octets, continued with a leading space. */
function foldLine(line: string): string[] {
  const bytes = Buffer.from(line, 'utf-8')
  if (bytes.length <= 75) return [line]
  const chunks: string[] = []
  let start = 0
  let limit = 75
  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length)
    // Never split a multi-byte character
    while (end > start && end < bytes.length && (bytes[end]! & 0xc0) === 0x80) end--
    chunks.push(bytes.subarray(start, end).toString('utf-8'))
    start = end
    limit = 74
  }
  return chunks.map((chunk, i) => (i === 0 ? chunk : ` ${chunk}`))
}

interface IcsEvent {
  uid: string
  summary: string
  description?: string
  location?: string
  /** Timed event, in Finnish local time */
  start?: { date: IsoDate; time: IsoTime }
  end?: { date: IsoDate; time: IsoTime }
  /** All-day event, inclusive start and end dates */
  allDay?: { start: IsoDate; end: IsoDate }
}

function renderEvent(event: IcsEvent, stamp: string): string[] {
  const lines = ['BEGIN:VEVENT', `UID:${event.uid}`, `DTSTAMP:${stamp}`]
  if (event.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${icsDate(event.allDay.start)}`)
    // DTEND is exclusive for all-day events
    lines.push(`DTEND;VALUE=DATE:${icsDate(addDays(event.allDay.end, 1))}`)
  } else if (event.start && event.end) {
    lines.push(
      `DTSTART;TZID=${TZID}:${icsDate(event.start.date)}T${icsTime(event.start.time)}`
    )
    lines.push(
      `DTEND;TZID=${TZID}:${icsDate(event.end.date)}T${icsTime(event.end.time)}`
    )
  }
  lines.push(`SUMMARY:${escapeText(event.summary)}`)
  if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`)
  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`)
  lines.push('END:VEVENT')
  return lines
}

export interface IcsInput {
  events: CitizenCalendarEvent[]
  reservations: ReservationsResponse | undefined
  now?: Date
}

/** Human-readable child name, falling back to the id when the name is not available. */
export function childNames(
  reservations: ReservationsResponse | undefined
): Map<string, string> {
  const names = new Map<string, string>()
  for (const child of reservations?.children ?? []) {
    names.set(child.id, `${child.preferredName || child.firstName} ${child.lastName}`.trim())
  }
  return names
}

export function buildIcs({ events, reservations, now = new Date() }: IcsInput): string {
  const stamp = utcStamp(now)
  const names = childNames(reservations)
  const nameOf = (childId: string) => names.get(childId) ?? 'lapsi'

  const icsEvents: IcsEvent[] = []

  for (const event of events) {
    const attendingChildIds = Object.keys(event.attendingChildren)
    // Discussion times and similar reserved slots are real appointments with a clock time
    for (const [childId, times] of Object.entries(event.timesByChild)) {
      for (const time of times ?? []) {
        icsEvents.push({
          uid: `calendar-event-time-${time.id}@evaka-integration-demo`,
          summary: `${event.title} – ${nameOf(childId)}`,
          description: event.description,
          start: { date: time.date, time: time.startTime },
          end: { date: time.date, time: time.endTime }
        })
      }
    }
    // Everything else is an all-day event over the period it covers. A child that already has a
    // reserved time for this event is left out: the timed entry above is the useful one.
    const allDayChildIds = attendingChildIds.filter(
      (childId) => (event.timesByChild[childId] ?? []).length === 0
    )
    if (allDayChildIds.length === 0) continue
    const children = allDayChildIds.map(nameOf).join(', ')
    const units = allDayChildIds
      .flatMap((childId) => event.attendingChildren[childId] ?? [])
      .map((attending) =>
        [attending.unitName, attending.groupName].filter(Boolean).join(', ')
      )
      .filter((it) => it.length > 0)
    icsEvents.push({
      uid: `calendar-event-${event.id}@evaka-integration-demo`,
      summary: `${event.title} – ${children}`,
      description: event.description,
      location: units[0],
      allDay: { start: event.period.start, end: event.period.end }
    })
  }

  for (const day of reservations?.days ?? []) {
    for (const child of day.children) {
      for (const [index, reservation] of child.reservations.entries()) {
        if (reservation.type !== 'TIMES') continue
        icsEvents.push({
          uid: `reservation-${day.date}-${child.childId}-${index}@evaka-integration-demo`,
          summary: `Varhaiskasvatus – ${nameOf(child.childId)}`,
          description: reservation.staffCreated
            ? 'Henkilökunnan kirjaama varaus'
            : undefined,
          start: { date: day.date, time: reservation.range.start },
          end: { date: day.date, time: reservation.range.end }
        })
      }
      if (child.absence !== null) {
        icsEvents.push({
          uid: `absence-${day.date}-${child.childId}@evaka-integration-demo`,
          summary: `Poissaolo – ${nameOf(child.childId)}`,
          allDay: { start: day.date, end: day.date }
        })
      }
    }
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:eVaka',
    ...VTIMEZONE,
    ...icsEvents.flatMap((event) => renderEvent(event, stamp)),
    'END:VCALENDAR'
  ]

  return `${lines.flatMap(foldLine).join('\r\n')}\r\n`
}
