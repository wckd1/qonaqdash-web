/**
 * Booking lifecycle: `data.status` on merged booking form envelope (detail data + runtime form).
 * Status is a root-level BookingItem field, not nested under `stay`.
 *
 * @param bookingResponse - merged envelope `{ data: { status, … } }`, or anything else
 */
export function getBookingStatusFromResponse(bookingResponse: unknown): string | undefined {
  if (!bookingResponse || typeof bookingResponse !== 'object') return undefined
  const data = (bookingResponse as { data?: unknown }).data
  if (!data || typeof data !== 'object') return undefined
  const status = (data as { status?: unknown }).status
  if (status != null && status !== '') return String(status)
  return undefined
}

/**
 * UI may offer edit when PUT is allowed (confirmed or checked_in per API).
 *
 */
export function bookingStatusAllowsEdit(status: string | undefined): boolean {
  return status === 'confirmed' || status === 'checked_in'
}

/**
 * Normalize API / UI status strings for comparisons (snake_case).
 *
 */
export function normalizeBookingStatus(status: string | undefined | null): string | undefined {
  if (status == null || status === '') return undefined
  return String(status).trim().toLowerCase().replace(/-/g, '_')
}

export function bookingStatusAllowsCheckIn(status: string | undefined): boolean {
  return normalizeBookingStatus(status) === 'confirmed'
}

export function bookingStatusAllowsCheckOut(status: string | undefined): boolean {
  return normalizeBookingStatus(status) === 'checked_in'
}

export function bookingStatusAllowsCancel(status: string | undefined): boolean {
  return normalizeBookingStatus(status) === 'confirmed'
}
