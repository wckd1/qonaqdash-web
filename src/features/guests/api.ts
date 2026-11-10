import type { RequestOptions } from '@/shared/api/client'
import { typedApi, type Schemas } from '@/shared/api/typed'
import { clearFormDefinitionsFor, normalizeFormRef } from '@/shared/forms/formDefinitionCache'
import {
  loadRuntimeFormDefinition,
  type LoadRuntimeFormOptions,
} from '@/shared/forms/loadRuntimeFormDefinition'
import type { FormRef, FormNode } from '@/shared/types/forms'

export type { FormRef }

/** Guest list row (`GET /api/guests`). */
export type Guest = Schemas['guesthttp.GuestListItem']
export type GuestDetailResponse = Schemas['guesthttp.GuestDetailWithFormMeta']
/** Guest profile as FormDSL data: contract fields plus the organization's custom fields. */
export type GuestDetailData = Omit<GuestDetailResponse, '_form'> & Record<string, unknown>
/** Body of create and update: contract fields plus the organization's custom fields. */
export type GuestDataRequest = Schemas['guesthttp.GuestDataRequest'] & Record<string, unknown>
/** Row of a guest's booking history (`GET /api/guests/{id}/bookings`). */
export type GuestBookingListItem = Schemas['guesthttp.GuestBookingListItem']

/** Core guest form `data` fields (FormDSL). */
export interface GuestFormFields {
  first_name: string
  last_name: string
  phone?: string
  email?: string
}

/** Runtime guest `data` may include extra keys from custom form definition. */
export type GuestFormData = GuestFormFields & { [key: string]: unknown }

/** Partial guest form `data` while loading or merging template. */
export type GuestFormDataPartial = Partial<GuestFormFields> & { [key: string]: unknown }

/** Runtime guest form (`GET /api/guests/form?target=`) as the form loader returns it. */
export interface GuestFormDefinitionResponse {
  definition?: FormNode
  hash?: string
  data?: GuestFormDataPartial
}

export interface GuestDetailPayload {
  data: GuestDetailData
  formRef: FormRef | null
}

/** Splits a guest response into FormDSL data and its `_form` reference. */
export function parseGuestDetailPayload(raw: GuestDetailResponse): GuestDetailPayload {
  const { _form, ...data } = raw
  return { data, formRef: normalizeFormRef(_form) }
}

/** The contract keeps `definition` free-form; the builder reads it as FormDSL. */
function formDefinition(data: Schemas['guesthttp.FormResponse']): {
  definition: FormNode
  hash: string
} {
  return { definition: data.definition as unknown as FormNode, hash: data.hash }
}

export function fetchGuests(
  params: { q?: string } = {},
  options: RequestOptions = {},
): Promise<Guest[]> {
  const q = params.q?.trim()
  return typedApi
    .get('/api/guests', { query: q ? { q } : {}, signal: options.signal })
    .then(({ data }) => data)
}

export function fetchGuest(id: string, options: RequestOptions = {}): Promise<GuestDetailPayload> {
  return typedApi
    .get('/api/guests/{id}', { path: { id }, signal: options.signal })
    .then(({ data }) => parseGuestDetailPayload(data))
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
): Promise<GuestFormDefinitionResponse> {
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

/** Persisted editor definition for form builder (manage). */
export function fetchGuestFormDefinition(options: RequestOptions = {}): Promise<{
  definition: FormNode
  hash: string
}> {
  return typedApi
    .get('/api/guests/form/definition', { signal: options.signal })
    .then(({ data }) => formDefinition(data))
}

/** Save guest form definition from builder. */
export function updateGuestFormDefinition(body: {
  definition: FormNode
}): Promise<{ definition: FormNode; hash: string }> {
  return typedApi
    .put('/api/guests/form/definition', {
      body: { definition: body.definition as unknown as Record<string, unknown> },
    })
    .then(({ data }) => formDefinition(data))
}

/** `data` is FormDSL data of the organization's guest form; its rules checked it. */
export function createGuest(data: Record<string, unknown>): Promise<GuestDetailData> {
  return typedApi
    .post('/api/guests', { body: data as GuestDataRequest })
    .then(({ data: res }) => parseGuestDetailPayload(res).data)
}

export function updateGuest(
  id: string,
  data: Record<string, unknown>,
): Promise<GuestDetailPayload> {
  return typedApi
    .put('/api/guests/{id}', { path: { id }, body: data as GuestDataRequest })
    .then(({ data: res }) => parseGuestDetailPayload(res))
}

/** Blocks the guest (soft delete in the API). */
export function blockGuest(id: string): Promise<void> {
  return typedApi.delete('/api/guests/{id}', { path: { id } }).then(() => undefined)
}

export function fetchGuestBookings(
  guestId: string,
  options: RequestOptions = {},
): Promise<GuestBookingListItem[]> {
  return typedApi
    .get('/api/guests/{id}/bookings', { path: { id: guestId }, signal: options.signal })
    .then(({ data }) => data)
}
