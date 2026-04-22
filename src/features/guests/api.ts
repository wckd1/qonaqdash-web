import api from '@/shared/api/client'
import { clearFormDefinitionsFor, normalizeFormRef } from '@/shared/forms/formDefinitionCache'
import {
  loadRuntimeFormDefinition,
  type LoadRuntimeFormOptions,
} from '@/shared/forms/loadRuntimeFormDefinition'
import type { FormRef, FormNode } from '@/shared/types/forms'

export type {
  Guest,
  GuestDetailData,
  GuestFormDefinitionResponse,
  GuestFormData,
  GuestFormDataPartial,
  GuestFormFields,
} from '@/shared/types/guests'

export type { FormRef }

export interface GuestDetailPayload {
  data: import('@/shared/types/guests').GuestDetailData
  formRef: FormRef | null
}

/**
 * @param raw - GET/PUT/POST guest JSON (may include `_form`).
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

export function fetchGuests(params: { q?: string } = {}) {
  const config = params.q?.trim() ? { params: { q: params.q.trim() } } : {}
  return api.get('/api/guests', config).then(({ data }) => data.guests ?? data ?? [])
}

export function fetchGuest(id: string): Promise<GuestDetailPayload> {
  return api.get(`/api/guests/${id}`).then(({ data }) => parseGuestDetailPayload(data))
}

/**
 * Cached runtime guest form (`GET /api/guests/form?target=`).
 */
export function loadGuestRuntimeForm(
  mode: 'edit' | 'view',
  definitionHash: string | null | undefined,
  options: LoadRuntimeFormOptions = {},
) {
  return loadRuntimeFormDefinition('guest', '/api/guests/form', mode, definitionHash, options)
}

/**
 * Runtime guest FormDSL definition.
 */
export async function fetchGuestForm(
  options: {
    target?: 'edit' | 'view'
    force?: boolean
    definitionHash?: string | null
    revalidate?: boolean
    ifNoneMatch?: string | null
  } = {},
): Promise<import('@/shared/types/guests').GuestFormDefinitionResponse> {
  const target = options.target ?? 'edit'
  const loaded = await loadGuestRuntimeForm(target, options.definitionHash ?? null, {
    force: options.force,
    revalidate: options.revalidate,
    ifNoneMatch: options.ifNoneMatch,
  })
  return {
    definition: loaded.definition,
    hash: loaded.hash,
    data: loaded.data,
  }
}

/** Clear guest runtime form cache (call after org form definition changes). */
export function invalidateGuestRuntimeFormCache(): void {
  clearFormDefinitionsFor('guest')
}

/**
 * Persisted editor definition for form builder (manage). GET /api/guests/form/definition
 */
export function fetchGuestFormDefinition(): Promise<{
  definition: FormNode
  hash: string
}> {
  return api.get('/api/guests/form/definition').then(({ data }) => ({
    definition: (data.definition ?? {}) as FormNode,
    hash: String(data.hash ?? ''),
  }))
}

/**
 * Save guest form definition from builder. PUT /api/guests/form/definition
 */
export function updateGuestFormDefinition(body: {
  definition: FormNode
}): Promise<{ definition: FormNode; hash: string }> {
  return api.put('/api/guests/form/definition', body).then(({ data }) => ({
    definition: (data.definition ?? {}) as FormNode,
    hash: String(data.hash ?? ''),
  }))
}

export function createGuest(data: Record<string, unknown>) {
  return api.post('/api/guests', data).then(({ data: res }) => parseGuestDetailPayload(res).data)
}

export function updateGuest(
  id: string,
  data: Record<string, unknown>,
): Promise<GuestDetailPayload> {
  return api.put(`/api/guests/${id}`, data).then(({ data: res }) => parseGuestDetailPayload(res))
}

export function blockGuest(id: string) {
  return api.delete(`/api/guests/${id}`).then(() => undefined)
}

export function fetchGuestBookings(guestId: string) {
  return api.get(`/api/guests/${guestId}/bookings`).then(({ data }) => data ?? [])
}
