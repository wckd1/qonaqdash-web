import type { GuestJsonFormFields } from '@/shared/types/guests'

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
 * GET /api/bookings/:id — `{ guest, booking }` JSONForms data only (no schema/uischema).
 * Merge with `GET /api/bookings/form?target=view|edit` on the client.
 */
export interface BookingDetailData {
  guest: Record<string, unknown>
  booking: Record<string, unknown>
}

/** Runtime `GET …/form?target=` — schema + uischema only (optional empty `data`). */
export interface BookingFormSchemaResponse {
  schema?: unknown
  uischema?: unknown
  data?: Record<string, unknown>
}

/** Merged shape for JsonFormView / JsonFormEdit after combining detail data + runtime form. */
export interface BookingFormResponse {
  schema?: unknown
  uischema?: unknown
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
export interface BookingJsonFormRoomRowFields {
  roomType: string | null
  roomID: string | null
}

export type BookingJsonFormRoomRow = BookingJsonFormRoomRowFields & { [key: string]: unknown }

/** `booking` branch: check-in/out and room rows; API may add `status` and other keys. */
export interface BookingJsonFormBookingBranchFields {
  checkIn: string
  checkOut: string
  rooms: BookingJsonFormRoomRow[]
  status?: string
}

export type BookingJsonFormBookingBranch = BookingJsonFormBookingBranchFields & {
  [key: string]: unknown
}

/**
 * `data.guest` on the booking form: same core fields as the standalone guest form,
 * plus `id` (existing guest UUID or `null` on create).
 */
export type BookingFormGuestData = GuestJsonFormFields & {
  id: string | null
} & { [key: string]: unknown }

export interface BookingJsonFormRootFields {
  guest: BookingFormGuestData
  booking: BookingJsonFormBookingBranch
}

export type BookingJsonFormRootData = BookingJsonFormRootFields & { [key: string]: unknown }

export type BookingJsonFormRootDataPartial = Partial<BookingJsonFormRootFields> & {
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
  booking: BookingJsonFormBookingBranch
}
