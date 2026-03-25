import api from '@/shared/api/client'
import { clearFormDefinitionsFor, normalizeFormRef } from '@/shared/forms/formDefinitionCache'
import {
  loadRuntimeFormDefinition,
  type LoadRuntimeFormOptions,
} from '@/shared/forms/loadRuntimeFormDefinition'
import type { FormRef } from '@/shared/types/forms'
import type {
  BookingDetailData,
  BookingFlat,
  BookingFormResponse,
  BookingFormSchemaResponse,
  CreateBookingPayload,
} from '@/shared/types/bookings'

export type {
  BookingDetailData,
  BookingFlat,
  BookingFormDataDraft,
  BookingFormGuestData,
  BookingFormResponse,
  BookingFormSchemaResponse,
  BookingGridEntry,
  BookingJsonFormBookingBranch,
  BookingJsonFormBookingBranchFields,
  BookingJsonFormRootData,
  BookingJsonFormRootDataPartial,
  BookingJsonFormRootFields,
  BookingJsonFormRoomRow,
  BookingJsonFormRoomRowFields,
  BookingListItem,
  CreateBookingPayload,
} from '@/shared/types/bookings'

export type { FormRef }

export interface BookingDetailPayload {
  detail: BookingDetailData
  formRef: FormRef | null
}

/**
 * @param {unknown} raw - GET booking detail JSON (guest + booking + optional `_form`).
 */
export function parseBookingDetailPayload(raw: unknown): BookingDetailPayload {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const formRef = normalizeFormRef(o._form)
  const guest = (o.guest && typeof o.guest === 'object' ? o.guest : {}) as Record<string, unknown>
  const booking = (o.booking && typeof o.booking === 'object' ? o.booking : {}) as Record<string, unknown>
  return {
    detail: { guest, booking },
    formRef,
  }
}

/**
 * @param {{ from: string, to: string }} params - Inclusive range, YYYY-MM-DD.
 * @returns {Promise<import('@/shared/types/bookings').BookingGridEntry[]>}
 */
export function fetchBookingGrid(params: { from: string; to: string }) {
  return api
    .get('/api/bookings/grid', { params: { from: params.from, to: params.to } })
    .then(({ data }) => (Array.isArray(data) ? data : data?.entries ?? data?.grid ?? []))
}

export function createBooking(body: CreateBookingPayload): Promise<BookingFlat> {
  return api.post('/api/bookings', body).then(({ data }) => data)
}

/**
 * @param {{ q?: string, from?: string, to?: string }} [params] - Optional search (guest name), date filter (YYYY-MM-DD).
 * @returns {Promise<import('@/shared/types/bookings').BookingListItem[]>}
 */
export function fetchBookings(params: { q?: string; from?: string; to?: string } = {}) {
  const config: { params: Record<string, string> } = { params: {} }
  if (params.q?.trim()) config.params.q = params.q.trim()
  if (params.from) config.params.from = params.from
  if (params.to) config.params.to = params.to
  return api.get('/api/bookings', config).then(({ data }) => data.bookings ?? data ?? [])
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
 * Runtime booking JSONForm definition.
 */
export async function fetchBookingForm(
  options: {
    target?: 'edit' | 'view'
    force?: boolean
    definitionHash?: string | null
    revalidate?: boolean
    ifNoneMatch?: string | null
  } = {},
): Promise<BookingFormSchemaResponse> {
  const target = options.target ?? 'edit'
  const loaded = await loadBookingRuntimeForm(target, options.definitionHash ?? null, {
    force: options.force,
    revalidate: options.revalidate,
    ifNoneMatch: options.ifNoneMatch,
  })
  return {
    schema: loaded.schema,
    uischema: loaded.uischema,
    hash: loaded.hash,
    data: loaded.data,
  }
}

/** Clear booking runtime form cache (after org form definition changes). */
export function invalidateBookingRuntimeFormCache(): void {
  clearFormDefinitionsFor('booking')
}

/**
 * Merge `GET /api/bookings/:id` data with runtime form schema (client-side JSONForms envelope).
 */
export function mergeBookingDetailWithRuntimeForm(
  detail: BookingDetailData,
  form: Pick<BookingFormSchemaResponse, 'schema' | 'uischema'>,
): BookingFormResponse {
  return {
    schema: form.schema,
    uischema: form.uischema,
    data: {
      guest: detail.guest ?? {},
      booking: detail.booking ?? {},
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

export function fetchBookingFormSchema(): Promise<BookingFormResponse> {
  return api.get('/api/bookings/form/schema').then(({ data }) => data as BookingFormResponse)
}

export function updateBookingFormSchema(body: {
  schema: object
  uischema: object
  data?: object
}): Promise<BookingFormResponse> {
  return api.put('/api/bookings/form/schema', body).then(({ data }) => data)
}

/** Booking JSONForms data + `_form` meta. */
export function fetchBooking(id: string): Promise<BookingDetailPayload> {
  return api.get(`/api/bookings/${id}`).then(({ data }) => parseBookingDetailPayload(data))
}

export function updateBooking(id: string, body: CreateBookingPayload): Promise<BookingFlat> {
  return api.put(`/api/bookings/${id}`, body).then(({ data }) => data)
}

export function checkIn(id: string): Promise<BookingFlat> {
  return api.put(`/api/bookings/${id}/check-in`).then(({ data }) => data)
}

export function checkOut(id: string): Promise<BookingFlat> {
  return api.put(`/api/bookings/${id}/check-out`).then(({ data }) => data)
}

export function cancel(id: string): Promise<BookingFlat> {
  return api.put(`/api/bookings/${id}/cancel`).then(({ data }) => data)
}
