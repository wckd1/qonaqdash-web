import api from '@/shared/api/client'

export type {
  Guest,
  GuestDetailData,
  GuestFormSchemaResponse,
  GuestJsonFormData,
  GuestJsonFormDataPartial,
  GuestJsonFormFields,
} from '@/shared/types/guests'

/**
 * @param {{ q?: string }} [params] - Optional search query; backend filters by name, email, phone.
 * @returns {Promise<import('@/shared/types/guests').Guest[]>}
 */
export function fetchGuests(params: { q?: string } = {}) {
  const config = params.q?.trim()
    ? { params: { q: params.q.trim() } }
    : {}
  return api.get('/api/guests', config).then(({ data }) => data.guests ?? data ?? [])
}

/**
 * Guest profile data only (GET /api/guests/:id).
 * @param {string} id
 * @returns {Promise<import('@/shared/types/guests').GuestDetailData>}
 */
export function fetchGuest(id: string) {
  return api.get(`/api/guests/${id}`).then(({ data }) => data)
}

/**
 * Runtime guest JSONForm definition (schema + uischema; optional empty `data`).
 * GET /api/guests/form?target=edit|view — omit query → edit.
 * @param {{ target?: 'edit' | 'view' }} [options]
 */
export function fetchGuestForm(options: { target?: 'edit' | 'view' } = {}) {
  const target = options.target ?? 'edit'
  return api
    .get('/api/guests/form', { params: { target } })
    .then(({ data }) => ({
      schema: data.schema ?? {},
      uischema: data.uischema ?? {},
      data: data.data ?? {},
    }))
}

/**
 * Stored definition for JSONForm builder (manage). GET /api/guests/form/schema
 * @returns {Promise<{ schema: object, uischema: object, data: object }>}
 */
export function fetchGuestFormSchema() {
  return api.get('/api/guests/form/schema').then(({ data }) => ({
    schema: data.schema ?? {},
    uischema: data.uischema ?? {},
    data: data.data ?? {},
  }))
}

/**
 * Save guest form definition from builder. PUT /api/guests/form/schema
 * @param {{ schema: object, uischema: object, data?: object }} body
 * @returns {Promise<{ schema?: object, uischema?: object, data?: object }>}
 */
export function updateGuestFormSchema(body: { schema: object; uischema: object; data?: object }) {
  return api.put('/api/guests/form/schema', body).then(({ data }) => data)
}

/**
 * Creates a new guest. Body is flat camelCase (firstName, lastName, email, phone).
 * @param {Record<string, unknown>} data - Form data from JsonFormEdit (camelCase)
 * @returns {Promise<import('@/shared/types/guests').GuestDetailData>}
 */
export function createGuest(data: Record<string, unknown>) {
  return api.post('/api/guests', data).then(({ data: res }) => res)
}

/**
 * Updates an existing guest. Body is flat camelCase (same shape as create).
 * @param {string} id
 * @param {Record<string, unknown>} data - Form data from JsonFormEdit (camelCase)
 * @returns {Promise<import('@/shared/types/guests').GuestDetailData>}
 */
export function updateGuest(id: string, data: Record<string, unknown>) {
  return api.put(`/api/guests/${id}`, data).then(({ data: res }) => res)
}

/**
 * Soft-deletes the guest. **Response:** `204 No Content`.
 * @param {string} id
 * @returns {Promise<void>}
 */
export function deleteGuest(id: string) {
  return api.delete(`/api/guests/${id}`).then(() => undefined)
}

/**
 * All bookings for the given guest (e.g. "Previous bookings" on guest detail).
 * @param {string} guestId
 * @returns {Promise<import('@/shared/types/bookings').BookingListItem[]>}
 */
export function fetchGuestBookings(guestId: string) {
  return api.get(`/api/guests/${guestId}/bookings`).then(({ data }) => data ?? [])
}
