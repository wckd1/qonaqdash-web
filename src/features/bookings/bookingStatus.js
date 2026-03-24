/**
 * Booking lifecycle on GET /api/bookings/{id}: `data.booking.status` (FormResponse).
 * Fallbacks: legacy `data.status`, top-level `status` on the response.
 *
 * @param {Record<string, unknown> | null | undefined} bookingResponse
 * @returns {string | undefined}
 */
export function getBookingStatusFromResponse(bookingResponse) {
  if (!bookingResponse || typeof bookingResponse !== 'object') return undefined
  const data = bookingResponse.data
  const booking = data && typeof data === 'object' ? data.booking : undefined
  if (booking && typeof booking === 'object' && booking.status != null && booking.status !== '') {
    return String(booking.status)
  }
  if (data && typeof data === 'object' && data.status != null && data.status !== '') {
    return String(data.status)
  }
  if (bookingResponse.status != null && bookingResponse.status !== '') {
    return String(bookingResponse.status)
  }
  return undefined
}

/**
 * UI may offer edit when PUT is allowed (confirmed or checked_in per API).
 *
 * @param {string | undefined} status
 * @returns {boolean}
 */
export function bookingStatusAllowsEdit(status) {
  return status === 'confirmed' || status === 'checked_in'
}

/**
 * Normalize API / UI status strings for comparisons (snake_case, US spelling for canceled).
 *
 * @param {string | undefined | null} status
 * @returns {string | undefined}
 */
export function normalizeBookingStatus(status) {
  if (status == null || status === '') return undefined
  let s = String(status).trim().toLowerCase().replace(/-/g, '_')
  if (s === 'cancelled') s = 'canceled'
  return s
}

/**
 * @param {string | undefined} status
 * @returns {boolean}
 */
export function bookingStatusAllowsCheckIn(status) {
  return normalizeBookingStatus(status) === 'confirmed'
}

/**
 * @param {string | undefined} status
 * @returns {boolean}
 */
export function bookingStatusAllowsCheckOut(status) {
  return normalizeBookingStatus(status) === 'checked_in'
}

/**
 * @param {string | undefined} status
 * @returns {boolean}
 */
export function bookingStatusAllowsCancel(status) {
  return normalizeBookingStatus(status) === 'confirmed'
}
