/**
 * Booking lifecycle on GET /api/bookings/{id}: `data.status` (see requirements).
 * Fallbacks support rollout or alternate server shapes.
 *
 * @param {Record<string, unknown> | null | undefined} bookingResponse
 * @returns {string | undefined}
 */
export function getBookingStatusFromResponse(bookingResponse) {
  if (!bookingResponse || typeof bookingResponse !== 'object') return undefined
  const data = bookingResponse.data
  if (data && typeof data === 'object' && data.status != null && data.status !== '') {
    return String(data.status)
  }
  if (bookingResponse.status != null && bookingResponse.status !== '') {
    return String(bookingResponse.status)
  }
  const booking = data && typeof data === 'object' ? data.booking : undefined
  if (booking && typeof booking === 'object' && booking.status != null && booking.status !== '') {
    return String(booking.status)
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
