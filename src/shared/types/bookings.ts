import type { FormNode, FormRef } from './forms'
import type { GuestFormFields } from './guests'
import type { AccommodationSnapshot, ManualAdjustmentInput } from './commercial'

/** Guest info nested in BookingItem (matches bookinghttp.BookingGuestInfo). */
export interface BookingGuestInfo {
  id?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
}

/** Room row nested in BookingItem.stay (matches bookinghttp.BookingRoomData). */
export interface BookingRoomData {
  room_type: string
  room_type_label?: string
  room_id?: string
  room_id_label?: string
}

/** Stay data nested in BookingItem (matches bookinghttp.BookingStayData). */
export interface BookingStayData {
  check_in: string
  check_out: string
  rooms: BookingRoomData[]
}

/** Unified booking shape returned by ALL booking endpoints (matches bookinghttp.BookingItem). */
export interface BookingItem {
  id: string
  status: string
  _form?: FormRef
  guest: BookingGuestInfo
  stay: BookingStayData
  /** Live billing balance; nullable (omitted when zero). */
  outstanding_balance?: number
}

/** Request body for POST/PUT /api/bookings (matches bookinghttp.BookingDataRequest). */
export interface BookingDataRequest {
  guest: BookingGuestInfo
  stay: BookingStayData
}

/**
 * GET /api/bookings/:id aggregate (guest + stay + status). Pricing lives under
 * GET /api/pricing/bookings/{id}/quote — merged into `BookingFormResponse` by the client.
 */
export interface BookingDetailData {
  guest: Record<string, unknown>
  stay: Record<string, unknown>
  status?: string
  id?: string
  /** Live billing balance from aggregate; omitted when zero. */
  outstanding_balance?: number
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
  accommodation?: AccommodationSnapshot
  adjustments?: ManualAdjustmentInput[]
  /** From booking aggregate; omitted when zero. Used for check-out force-unpaid gating. */
  outstanding_balance?: number
}

/** One element of `stay.rooms` in form data. */
export interface BookingFormRoomRowFields {
  room_type: string | null
  room_id: string | null
}

export type BookingFormRoomRow = BookingFormRoomRowFields & { [key: string]: unknown }

/** `stay` branch: check-in/out and room rows; API may add `status` and other keys. */
export interface BookingFormStayBranchFields {
  check_in: string
  check_out: string
  rooms: BookingFormRoomRow[]
  status?: string
}

export type BookingFormStayBranch = BookingFormStayBranchFields & {
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
  stay: BookingFormStayBranch
}

export type BookingFormRootData = BookingFormRootFields & { [key: string]: unknown }

export type BookingFormRootDataPartial = Partial<BookingFormRootFields> & {
  [key: string]: unknown
}

/** Deep-cloned booking `data` during edit; validate before API. */
export interface BookingFormDataDraft {
  guest?: Record<string, unknown>
  stay?: Record<string, unknown>
  [key: string]: unknown
}

/** Create / update booking body: `{ guest, stay, adjustments? }` (no top-level `id`). */
export type CreateBookingPayload = {
  guest: BookingFormGuestData
  stay: BookingFormStayBranch
  adjustments?: ManualAdjustmentInput[]
}

/** Guest booking list item from GET /api/guests/:id/bookings (matches guesthttp.GuestBookingListItem). */
export interface GuestBookingListItem {
  id: string
  status: string
  guest: { id?: string; first_name?: string; last_name?: string }
  stay: { check_in: string; check_out: string }
}
