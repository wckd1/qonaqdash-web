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
import type {
  AccommodationSnapshot,
  ManualAdjustmentInput,
  StayQuoteNight,
  StayQuoteAdjustment,
  PricingEffect,
} from '@/shared/types/commercial'

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

export type { AccommodationSnapshot, ManualAdjustmentInput } from '@/shared/types/commercial'

export type { FormRef }

export interface BookingDetailPayload {
  detail: BookingDetailData
  formRef: FormRef | null
}

function parseNight(raw: unknown): StayQuoteNight {
  const n = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    date: typeof n.date === 'string' ? n.date : '',
    room_type_id: typeof n.room_type_id === 'string' ? n.room_type_id : '',
    base_rate: typeof n.base_rate === 'number' ? n.base_rate : 0,
    adjustments: Array.isArray(n.adjustments) ? (n.adjustments as StayQuoteAdjustment[]) : [],
    subtotal: typeof n.subtotal === 'number' ? n.subtotal : 0,
  }
}

function parseAccommodationSnapshot(raw: unknown): AccommodationSnapshot | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const o = raw as Record<string, unknown>
  if (!Array.isArray(o.nights) || typeof o.grand_total !== 'number') return undefined
  return {
    calculated_at: typeof o.calculated_at === 'string' ? o.calculated_at : '',
    version: typeof o.version === 'number' ? o.version : 0,
    nights: o.nights.map(parseNight),
    nights_subtotal: typeof o.nights_subtotal === 'number' ? o.nights_subtotal : 0,
    total_adjustments: Array.isArray(o.total_adjustments)
      ? (o.total_adjustments as StayQuoteAdjustment[])
      : [],
    grand_total: o.grand_total,
  }
}

function parseManualAdjustments(raw: unknown): ManualAdjustmentInput[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined
  const result: ManualAdjustmentInput[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const a = item as Record<string, unknown>
    const name = typeof a.name === 'string' ? a.name : ''
    const eff =
      a.effect && typeof a.effect === 'object' ? (a.effect as Record<string, unknown>) : {}
    const effect: PricingEffect = {
      type: eff.type === 'percent' ? 'percent' : 'fixed',
      value: typeof eff.value === 'number' ? eff.value : 0,
      apply_to: eff.apply_to === 'per_night' ? 'per_night' : 'total',
    }
    result.push({ name, effect })
  }
  return result.length > 0 ? result : undefined
}

export function parseBookingDetailPayload(raw: unknown): BookingDetailPayload {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const formRef = normalizeFormRef(o._form)
  const guest = (o.guest && typeof o.guest === 'object' ? o.guest : {}) as Record<string, unknown>
  const stay = (o.stay && typeof o.stay === 'object' ? o.stay : {}) as Record<string, unknown>
  const accommodation = parseAccommodationSnapshot(o.accommodation)
  const adjustments = parseManualAdjustments(o.adjustments)
  return {
    detail: {
      guest,
      stay,
      status: typeof o.status === 'string' ? o.status : undefined,
      id: typeof o.id === 'string' ? o.id : undefined,
      accommodation,
      adjustments,
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
    accommodation: detail.accommodation,
    adjustments: detail.adjustments,
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

export function fetchBookingFormDefinition(): Promise<{
  definition: FormNode
  hash: string
}> {
  return api.get('/api/bookings/form/definition').then(({ data }) => ({
    definition: (data.definition ?? {}) as FormNode,
    hash: String(data.hash ?? ''),
  }))
}

export function updateBookingFormDefinition(body: {
  definition: FormNode
}): Promise<{ definition: FormNode; hash: string }> {
  return api.put('/api/bookings/form/definition', body).then(({ data }) => ({
    definition: (data.definition ?? {}) as FormNode,
    hash: String(data.hash ?? ''),
  }))
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
