import api from '@/shared/api/client'

/**
 * @typedef {{ id: string, guest_id: string, check_in: string, check_out: string, status: string, version?: number, guest?: { first_name?: string, last_name?: string, email?: string, phone?: string }, rooms?: Array<{ room_type_id: string, room_type_name?: string, room_id?: string, room_number?: string }> }} Booking
 * @typedef {{ guest?: { id?: string, firstName?: string, lastName?: string, email?: string, phone?: string }, booking: { checkIn: string, checkOut: string, rooms: Array<{ roomType: string, roomID?: string }> } }} CreateBookingPayload
 */

/**
 * @param {CreateBookingPayload} body
 * @returns {Promise<{ id: string, guest_id: string, check_in: string, check_out: string, status: string, version?: number }>}
 */
export function createBooking(body) {
  return api.post('/api/bookings', body).then(({ data }) => data)
}

/**
 * @param {{ q?: string, from?: string, to?: string }} [params] - Optional search and date filter.
 * @returns {Promise<Booking[]>}
 */
export function fetchBookings(params = {}) {
  const config = { params: {} }
  if (params.q?.trim()) config.params.q = params.q.trim()
  if (params.from) config.params.from = params.from
  if (params.to) config.params.to = params.to
  return api.get('/api/bookings', config).then(({ data }) => data.bookings ?? data ?? [])
}

/**
 * @param {string} id
 * @returns {Promise<Booking>}
 */
export function fetchBooking(id) {
  return api.get(`/api/bookings/${id}`).then(({ data }) => data)
}

/**
 * @param {string} id
 * @param {CreateBookingPayload} body
 * @returns {Promise<Booking>}
 */
export function updateBooking(id, body) {
  return api.put(`/api/bookings/${id}`, body).then(({ data }) => data)
}

/**
 * @param {string} id
 * @returns {Promise<Booking>}
 */
export function checkIn(id) {
  return api.put(`/api/bookings/${id}/check-in`).then(({ data }) => data)
}

/**
 * @param {string} id
 * @returns {Promise<Booking>}
 */
export function checkOut(id) {
  return api.put(`/api/bookings/${id}/check-out`).then(({ data }) => data)
}

/**
 * @param {string} id
 * @returns {Promise<Booking>}
 */
export function cancel(id) {
  return api.put(`/api/bookings/${id}/cancel`).then(({ data }) => data)
}
