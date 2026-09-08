// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

/**
 * The parts of the eVaka citizen API this demo actually reads.
 *
 * These are hand-written mirrors of the JSON shapes in
 * `frontend/src/lib-common/generated/api-types/{calendarevent,reservations,messaging}.ts`, kept
 * deliberately narrow: an integration should depend on the fields it uses and nothing more. Dates
 * and times stay as ISO strings, exactly as they arrive over the wire.
 */

/** `YYYY-MM-DD` */
export type IsoDate = string
/** `HH:mm` or `HH:mm:ss` */
export type IsoTime = string

export interface FiniteDateRange {
  start: IsoDate
  end: IsoDate
}

// --- calendar events: GET /citizen/calendar-events ---

export interface AttendingChild {
  groupName: string | null
  periods: FiniteDateRange[]
  type: string
  unitName: string | null
}

export interface CitizenCalendarEventTime {
  childId: string | null
  date: IsoDate
  endTime: IsoTime
  id: string
  isEditable: boolean
  startTime: IsoTime
}

export interface CitizenCalendarEvent {
  attendingChildren: Partial<Record<string, AttendingChild[]>>
  description: string
  eventType: string
  id: string
  period: FiniteDateRange
  timesByChild: Partial<Record<string, CitizenCalendarEventTime[]>>
  title: string
}

// --- reservations: GET /citizen/reservations ---

export interface TimeRange {
  start: IsoTime
  end: IsoTime
}

export type ReservationResponse =
  | { type: 'NO_TIMES'; staffCreated: boolean }
  | { type: 'TIMES'; range: TimeRange; staffCreated: boolean }

export interface AbsenceInfo {
  editable: boolean
  type: string
}

export interface ReservationResponseDayChild {
  absence: AbsenceInfo | null
  attendances: { start: IsoTime; end: IsoTime | null }[]
  childId: string
  reservations: ReservationResponse[]
  scheduleType: string
  shiftCare: boolean
}

export interface ReservationResponseDay {
  children: ReservationResponseDayChild[]
  date: IsoDate
  holiday: boolean
}

export interface ReservationChild {
  firstName: string
  id: string
  lastName: string
  preferredName: string
}

export interface ReservationsResponse {
  children: ReservationChild[]
  days: ReservationResponseDay[]
  reservableRange: FiniteDateRange
}

// --- messages: GET /citizen/messages/received ---

export interface MessageAccount {
  id: string
  name: string
  personId: string | null
  type: string
}

export interface MessageChild {
  childId: string
  firstName: string
  lastName: string
  preferredName: string
}

export interface Message {
  content: string
  contentId: string
  id: string
  /** ISO date-time, or null when this message has not been read */
  readAt: string | null
  recipientNames: string[] | null
  recipients: MessageAccount[]
  sender: MessageAccount
  sentAt: string
  threadId: string
}

export type CitizenMessageThread =
  | {
      type: 'Redacted'
      hasUnreadMessages: boolean
      id: string
      lastMessageSentAt: string | null
      sender: MessageAccount | null
      urgent: boolean
    }
  | {
      type: 'Regular'
      children: MessageChild[]
      id: string
      isCopy: boolean
      messageType: string
      messages: Message[]
      sensitive: boolean
      title: string
      urgent: boolean
    }

export interface PagedCitizenMessageThreads {
  data: CitizenMessageThread[]
  pages: number
  total: number
}
