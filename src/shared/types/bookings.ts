import type { FormNode } from './forms'
import type { GuestFormFields } from './guests'

/** List row from GET /api/bookings (guest display snake_case). */
export interface BookingListItem {
  id: string
  guest_id: string
  check_in: string
  check_out: string
  status: string
  guest_name?: string
  guest?: { first_name?: string; last_name?: string; email?: string }
}

/**
 * GET /api/bookings/:id — `{ guest, booking }` data only (no definition).
 * Merge with `GET /api/bookings/form?target=view|edit` on the client.
 */
export interface BookingDetailData {
  guest: Record<string, unknown>
  booking: Record<string, unknown>
}

/** Runtime `GET …/form?target=` — FormDSL definition + canonical `hash` (optional empty `data`). */
export interface BookingFormDefinitionResponse {
  definition?: FormNode
  hash?: string
  data?: Record<string, unknown>
}

/** Merged shape for FormView / FormEdit after combining detail data + runtime form definition. */
export interface BookingFormResponse {
  definition?: FormNode
  data?: Record<string, unknown>
  guest?: Record<string, unknown>
}

/** Row from GET /api/bookings/grid (one row per booking × room). */
export interface BookingGridEntry {
  booking_id: string
  room_type_id: string
  room_id: string | null
  guest_id: string | null
  guest_first_name?: string
  guest_last_name?: string
  check_in: string
  check_out: string
  status: string
}

/** Typical flat booking payload returned by lifecycle PUTs (check-in, cancel, …). */
export interface BookingFlat {
  id: string
  guest_id: string
  check_in: string
  check_out: string
  status: string
  version?: number
}

/** One element of `booking.rooms`. */
export interface BookingFormRoomRowFields {
  roomType: string | null
  roomID: string | null
}

export type BookingFormRoomRow = BookingFormRoomRowFields & { [key: string]: unknown }

/** `booking` branch: check-in/out and room rows; API may add `status` and other keys. */
export interface BookingFormBookingBranchFields {
  checkIn: string
  checkOut: string
  rooms: BookingFormRoomRow[]
  status?: string
}

export type BookingFormBookingBranch = BookingFormBookingBranchFields & {
  [key: string]: unknown
}

/**
 * `data.guest` on the booking form: same core fields as the standalone guest form,
 * plus `id` (existing guest UUID or `null` on create).
 */
export type BookingFormGuestData = GuestFormFields & {
  id: string | null
} & { [key: string]: unknown }

export interface BookingFormRootFields {
  guest: BookingFormGuestData
  booking: BookingFormBookingBranch
}

export type BookingFormRootData = BookingFormRootFields & { [key: string]: unknown }

export type BookingFormRootDataPartial = Partial<BookingFormRootFields> & {
  [key: string]: unknown
}

/** Deep-cloned booking `data` during edit; validate before API. */
export interface BookingFormDataDraft {
  guest?: Record<string, unknown>
  booking?: Record<string, unknown>
  [key: string]: unknown
}

/** Create / update booking body: `{ guest, booking }` only (no top-level `id`). */
export type CreateBookingPayload = {
  guest: BookingFormGuestData
  booking: BookingFormBookingBranch
}
