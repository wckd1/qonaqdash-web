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
