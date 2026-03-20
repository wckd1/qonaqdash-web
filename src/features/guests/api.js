import api from '@/shared/api/client'

/**
 * @typedef {{ id: string, first_name: string, last_name: string, email: string, phone?: string }} Guest
 * @typedef {{ schema?: unknown, uischema?: unknown, data?: { firstName?: string, lastName?: string, [key: string]: unknown } }} GuestDetailResponse
 */

/**
 * @param {{ q?: string }} [params] - Optional search query; backend filters by name, email, phone.
 * @returns {Promise<Guest[]>}
 */
export function fetchGuests(params = {}) {
  const config = params.q?.trim()
    ? { params: { q: params.q.trim() } }
    : {}
  return api.get('/api/guests', config).then(({ data }) => data.guests ?? data ?? [])
}

/**
 * Returns raw response so caller can handle both plain guest object and JSONForm-style { data }.
 * @param {string} id
 * @returns {Promise<Guest | GuestDetailResponse>}
 */
export function fetchGuest(id) {
  return api.get(`/api/guests/${id}`).then(({ data }) => data)
}

/**
 * Returns guest form schema for create (empty data). Use for new-guest page.
 * @returns {Promise<{ schema: object, uischema: object, data: object }>}
 */
export function fetchGuestForm() {
  return api.get('/api/guests/form').then(({ data }) => ({
    schema: data.schema ?? {},
    uischema: data.uischema ?? {},
    data: data.data ?? {},
  }))
}

/**
 * Creates a new guest. Body is flat camelCase (firstName, lastName, email, phone).
 * @param {Record<string, unknown>} data - Form data from JsonFormEdit (camelCase)
 * @returns {Promise<GuestDetailResponse>}
 */
export function createGuest(data) {
  return api.post('/api/guests', data).then(({ data: res }) => res)
}

/**
 * Updates an existing guest. Body is flat camelCase (same shape as create).
 * @param {string} id
 * @param {Record<string, unknown>} data - Form data from JsonFormEdit (camelCase)
 * @returns {Promise<GuestDetailResponse>}
 */
export function updateGuest(id, data) {
  return api.put(`/api/guests/${id}`, data).then(({ data: res }) => res)
}

/**
 * All bookings for the given guest (e.g. "Previous bookings" on guest detail). Same shape as GET /api/bookings list.
 * @param {string} guestId
 * @returns {Promise<Array<{ id: string, guest_id: string, check_in: string, check_out: string, status: string, guest?: { first_name?: string, last_name?: string } }>>}
 */
export function fetchGuestBookings(guestId) {
  return api.get(`/api/guests/${guestId}/bookings`).then(({ data }) => data ?? [])
}
