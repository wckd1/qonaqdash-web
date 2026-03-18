import api from '@/shared/api/client'

/**
 * List item from GET /api/bookings. Guest display info is denormalized (snake_case).
 * @typedef {{ id: string, guest_id: string, check_in: string, check_out: string, status: string, guest?: { first_name?: string, last_name?: string } }} BookingListItem
 */
/**
 * Single booking detail from state transitions (PUT check-in/check-out/cancel/update) or legacy shape.
 * @typedef {{ id?: string, guest_id?: string, check_in: string, check_out: string, status: string, version?: number, guest?: { first_name?: string, last_name?: string, email?: string, phone?: string }, rooms?: Array<{ room_type_id?: string, room_type_name?: string, room_id?: string, room_number?: string }> }} BookingFlat
 */
/**
 * GET /api/bookings/{id} returns FormResponse: schema, uischema, data (camelCase form data).
 * Backend may include status at root for display. Use for detail view and 409 re-fetch.
 * @typedef {{ schema?: unknown, uischema?: unknown, data?: { guest?: { id?: string, firstName?: string, lastName?: string, email?: string, phone?: string }, booking?: { checkIn?: string, checkOut?: string, rooms?: Array<{ roomType?: string, roomID?: string }> } }, status?: string }} BookingFormResponse
 */
/**
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
 * @param {{ q?: string, from?: string, to?: string, guest_id?: string }} [params] - Optional search, date filter, or guest_id (see backend-change-requests).
 * @returns {Promise<BookingListItem[]>}
 */
export function fetchBookings(params = {}) {
  const config = { params: {} }
  if (params.q?.trim()) config.params.q = params.q.trim()
  if (params.from) config.params.from = params.from
  if (params.to) config.params.to = params.to
  if (params.guest_id) config.params.guest_id = params.guest_id
  return api.get('/api/bookings', config).then(({ data }) => data.bookings ?? data ?? [])
}

/**
 * Blank booking form for create. Returns schema, uischema, and empty or default data.
 * @returns {Promise<BookingFormResponse>}
 */
export function fetchBookingForm() {
  return api.get('/api/bookings/form').then(({ data }) => data)
}

/**
 * Single booking as FormResponse (schema, uischema, data). Use for detail view and 409 re-fetch.
 * @param {string} id
 * @returns {Promise<BookingFormResponse>}
 */
export function fetchBooking(id) {
  return api.get(`/api/bookings/${id}`).then(({ data }) => data)
}

/**
 * @param {string} id
 * @param {CreateBookingPayload} body
 * @returns {Promise<BookingFlat>}
 */
export function updateBooking(id, body) {
  return api.put(`/api/bookings/${id}`, body).then(({ data }) => data)
}

/**
 * @param {string} id
 * @returns {Promise<BookingFlat>}
 */
export function checkIn(id) {
  return api.put(`/api/bookings/${id}/check-in`).then(({ data }) => data)
}

/**
 * @param {string} id
 * @returns {Promise<BookingFlat>}
 */
export function checkOut(id) {
  return api.put(`/api/bookings/${id}/check-out`).then(({ data }) => data)
}

/**
 * @param {string} id
 * @returns {Promise<BookingFlat>}
 */
export function cancel(id) {
  return api.put(`/api/bookings/${id}/cancel`).then(({ data }) => data)
}
