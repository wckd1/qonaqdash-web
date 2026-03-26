import api from '@/shared/api/client'
import { clearFormDefinitionsFor, normalizeFormRef } from '@/shared/forms/formDefinitionCache'
import {
  loadRuntimeFormDefinition,
  type LoadRuntimeFormOptions,
} from '@/shared/forms/loadRuntimeFormDefinition'
import type { FormRef, FormNode } from '@/shared/types/forms'
import type {
  BookingDetailData,
  BookingItem,
  BookingFormResponse,
  BookingFormDefinitionResponse,
  CreateBookingPayload,
} from '@/shared/types/bookings'

export type {
  BookingDetailData,
  BookingItem,
  BookingFormDataDraft,
  BookingFormGuestData,
  BookingFormResponse,
  BookingFormDefinitionResponse,
  BookingFormStayBranch,
  BookingFormStayBranchFields,
  BookingFormRootData,
  BookingFormRootDataPartial,
  BookingFormRootFields,
  BookingFormRoomRow,
  BookingFormRoomRowFields,
  BookingGuestInfo,
  BookingStayData,
  BookingRoomData,
  GuestBookingListItem,
  CreateBookingPayload,
} from '@/shared/types/bookings'

export type { FormRef }

export interface BookingDetailPayload {
  detail: BookingDetailData
  formRef: FormRef | null
}

export function parseBookingDetailPayload(raw: unknown): BookingDetailPayload {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const formRef = normalizeFormRef(o._form)
  const guest = (o.guest && typeof o.guest === 'object' ? o.guest : {}) as Record<string, unknown>
  const stay = (o.stay && typeof o.stay === 'object' ? o.stay : {}) as Record<string, unknown>
  return {
    detail: {
      guest,
      stay,
      status: typeof o.status === 'string' ? o.status : undefined,
      id: typeof o.id === 'string' ? o.id : undefined,
    },
    formRef,
  }
}

export function fetchBookingGrid(params: { from: string; to: string }): Promise<BookingItem[]> {
  return api
    .get('/api/bookings/grid', { params: { from: params.from, to: params.to } })
    .then(({ data }) => (Array.isArray(data) ? data : (data?.entries ?? data?.grid ?? [])))
}

export function createBooking(body: CreateBookingPayload): Promise<BookingItem> {
  return api.post('/api/bookings', body).then(({ data }) => data)
}

export function fetchBookings(
  params: { q?: string; from?: string; to?: string } = {},
): Promise<BookingItem[]> {
  const config: { params: Record<string, string> } = { params: {} }
  if (params.q?.trim()) config.params.q = params.q.trim()
  if (params.from) config.params.from = params.from
  if (params.to) config.params.to = params.to
  return api
    .get('/api/bookings', config)
    .then(({ data }) => (Array.isArray(data) ? data : (data.bookings ?? data ?? [])))
}

/**
 * Cached runtime booking form (`GET /api/bookings/form?target=`).
 */
export function loadBookingRuntimeForm(
  mode: 'edit' | 'view',
  definitionHash: string | null | undefined,
  options: LoadRuntimeFormOptions = {},
) {
  return loadRuntimeFormDefinition('booking', '/api/bookings/form', mode, definitionHash, options)
}

/**
 * Runtime booking FormDSL definition.
 */
export async function fetchBookingForm(
  options: {
    target?: 'edit' | 'view'
    force?: boolean
    definitionHash?: string | null
    revalidate?: boolean
    ifNoneMatch?: string | null
  } = {},
): Promise<BookingFormDefinitionResponse> {
  const target = options.target ?? 'edit'
  const loaded = await loadBookingRuntimeForm(target, options.definitionHash ?? null, {
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

/** Clear booking runtime form cache (after org form definition changes). */
export function invalidateBookingRuntimeFormCache(): void {
  clearFormDefinitionsFor('booking')
}

/**
 * Merge `GET /api/bookings/:id` data with runtime form definition.
 */
export function mergeBookingDetailWithRuntimeForm(
  detail: BookingDetailData,
  form: Pick<BookingFormDefinitionResponse, 'definition'>,
): BookingFormResponse {
  return {
    definition: form.definition,
    data: {
      guest: detail.guest ?? {},
      stay: detail.stay ?? {},
      status: detail.status,
      id: detail.id,
    },
  }
}

/**
 * Booking detail + optional `_form` meta, then runtime form (hash-keyed cache).
 */
export async function fetchBookingWithRuntimeForm(
  id: string,
  target: 'edit' | 'view' = 'view',
): Promise<BookingFormResponse> {
  const { detail, formRef } = await fetchBooking(id)
  const form = await loadBookingRuntimeForm(target, formRef?.hash, { force: false })
  return mergeBookingDetailWithRuntimeForm(detail, form)
}

export function fetchBookingFormSchema(): Promise<{
  definition: FormNode
  data: Record<string, unknown>
}> {
  return api.get('/api/bookings/form/schema').then(({ data }) => ({
    definition: (data.definition ?? {}) as FormNode,
    data: (data.data ?? {}) as Record<string, unknown>,
  }))
}

export function updateBookingFormSchema(body: {
  definition: FormNode
  data?: Record<string, unknown>
}): Promise<{ definition?: FormNode; data?: Record<string, unknown> }> {
  return api.put('/api/bookings/form/schema', body).then(({ data }) => data)
}

export function fetchBooking(id: string): Promise<BookingDetailPayload> {
  return api.get(`/api/bookings/${id}`).then(({ data }) => parseBookingDetailPayload(data))
}

export function updateBooking(id: string, body: CreateBookingPayload): Promise<BookingItem> {
  return api.put(`/api/bookings/${id}`, body).then(({ data }) => data)
}

export function checkIn(id: string): Promise<BookingItem> {
  return api.put(`/api/bookings/${id}/check-in`).then(({ data }) => data)
}

export function checkOut(id: string): Promise<BookingItem> {
  return api.put(`/api/bookings/${id}/check-out`).then(({ data }) => data)
}

export function cancel(id: string): Promise<BookingItem> {
  return api.put(`/api/bookings/${id}/cancel`).then(({ data }) => data)
}
