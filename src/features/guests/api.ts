import api from '@/shared/api/client'
import { clearFormDefinitionsFor, normalizeFormRef } from '@/shared/forms/formDefinitionCache'
import {
  loadRuntimeFormDefinition,
  type LoadRuntimeFormOptions,
} from '@/shared/forms/loadRuntimeFormDefinition'
import type { FormRef } from '@/shared/types/forms'

export type {
  Guest,
  GuestDetailData,
  GuestFormSchemaResponse,
  GuestJsonFormData,
  GuestJsonFormDataPartial,
  GuestJsonFormFields,
} from '@/shared/types/guests'

export type { FormRef }

export interface GuestDetailPayload {
  data: import('@/shared/types/guests').GuestDetailData
  formRef: FormRef | null
}

/**
 * @param {unknown} raw - GET/PUT/POST guest JSON (may include `_form`).
 */
export function parseGuestDetailPayload(raw: unknown): GuestDetailPayload {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const formRef = normalizeFormRef(o._form)
  const { _form: _f, ...rest } = o
  return {
    data: rest as import('@/shared/types/guests').GuestDetailData,
    formRef,
  }
}

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
 * Guest profile + optional `_form` meta (GET /api/guests/:id).
 * @param {string} id
 */
export function fetchGuest(id: string): Promise<GuestDetailPayload> {
  return api.get(`/api/guests/${id}`).then(({ data }) => parseGuestDetailPayload(data))
}

/**
 * Cached runtime guest form (`GET /api/guests/form?target=`).
 * @param {'edit' | 'view'} mode
 * @param {string | null | undefined} definitionHash - from `_form.hash` on detail; omit on create.
 */
export function loadGuestRuntimeForm(
  mode: 'edit' | 'view',
  definitionHash: string | null | undefined,
  options: LoadRuntimeFormOptions = {},
) {
  return loadRuntimeFormDefinition('guest', '/api/guests/form', mode, definitionHash, options)
}

/**
 * Runtime guest JSONForm definition.
 * @param {{ target?: 'edit' | 'view', force?: boolean, definitionHash?: string | null, revalidate?: boolean, ifNoneMatch?: string | null }} [options]
 */
export async function fetchGuestForm(
  options: {
    target?: 'edit' | 'view'
    force?: boolean
    definitionHash?: string | null
    revalidate?: boolean
    ifNoneMatch?: string | null
  } = {},
): Promise<import('@/shared/types/guests').GuestFormSchemaResponse> {
  const target = options.target ?? 'edit'
  const loaded = await loadGuestRuntimeForm(target, options.definitionHash ?? null, {
    force: options.force,
    revalidate: options.revalidate,
    ifNoneMatch: options.ifNoneMatch,
  })
  return {
    schema: loaded.schema ?? {},
    uischema: loaded.uischema ?? {},
    hash: loaded.hash,
    data: loaded.data,
  }
}

/** Clear guest runtime form cache (call after org form definition changes). */
export function invalidateGuestRuntimeFormCache(): void {
  clearFormDefinitionsFor('guest')
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
 */
export function createGuest(data: Record<string, unknown>) {
  return api.post('/api/guests', data).then(({ data: res }) => parseGuestDetailPayload(res).data)
}

/**
 * Updates an existing guest. Body is flat camelCase (same shape as create).
 * @returns {Promise<GuestDetailPayload>}
 */
export function updateGuest(id: string, data: Record<string, unknown>): Promise<GuestDetailPayload> {
  return api.put(`/api/guests/${id}`, data).then(({ data: res }) => parseGuestDetailPayload(res))
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
