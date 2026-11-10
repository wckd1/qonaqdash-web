import type { RequestOptions } from '@/shared/api/client'
import { typedApi, type Schemas } from '@/shared/api/typed'
import { clearFormDefinitionsFor, normalizeFormRef } from '@/shared/forms/formDefinitionCache'
import {
  loadRuntimeFormDefinition,
  type LoadRuntimeFormOptions,
} from '@/shared/forms/loadRuntimeFormDefinition'
import type { FormRef, FormNode } from '@/shared/form-dsl/types'
import type { GuestFormFields } from '@/features/guests/api'

export type { FormRef }
export type { AccommodationSnapshot, ManualAdjustmentInput } from '@/features/pricing/api'
export type { GuestBookingListItem } from '@/features/guests/api'

// ---------------------------------------------------------------------------
// Contract types
// ---------------------------------------------------------------------------

/** Booking in lists, the grid and the detail (`bookinghttp.BookingItem`). */
export type BookingItem = Schemas['bookinghttp.BookingItem']
export type BookingStatus = BookingItem['status']
export type BookingGuestInfo = Schemas['bookinghttp.BookingGuestInfo']
export type BookingStayData = Schemas['bookinghttp.BookingStayData']
export type BookingRoomData = Schemas['bookinghttp.BookingRoomData']
/** Body of create and update: contract fields plus the organization's custom fields. */
export type CreateBookingPayload = Schemas['bookinghttp.CreateBookingRequest'] &
  Record<string, unknown>
export type UpdateBookingPayload = Schemas['bookinghttp.UpdateBookingRequest'] &
  Record<string, unknown>

// ---------------------------------------------------------------------------
// FormDSL shapes of the booking forms
// ---------------------------------------------------------------------------

/** Booking detail as FormDSL data: `guest` and `stay` with the organization's custom fields. */
export interface BookingDetailData {
  guest: Record<string, unknown>
  stay: Record<string, unknown>
  status?: string
  id?: string
  outstanding_balance?: number
}

/** Runtime booking form (`GET /api/bookings/form?target=`) as the form loader returns it. */
export interface BookingFormDefinitionResponse {
  definition?: FormNode
  hash?: string
  data?: Record<string, unknown>
}

/**
 * Booking detail merged with its runtime form, for `FormView` / `FormEdit`.
 * The stored quote is a separate query (`bookingQuoteQuery` in pricing).
 */
export interface BookingFormResponse {
  definition?: FormNode
  data?: Record<string, unknown>
  guest?: Record<string, unknown>
  outstanding_balance?: number
}

export interface BookingFormRoomRowFields {
  room_type: string | null
  room_id: string | null
}

export type BookingFormRoomRow = BookingFormRoomRowFields & { [key: string]: unknown }

export interface BookingFormStayBranchFields {
  check_in: string
  check_out: string
  rooms: BookingFormRoomRow[]
  status?: string
}

export type BookingFormStayBranch = BookingFormStayBranchFields & { [key: string]: unknown }

export type BookingFormGuestData = GuestFormFields & { id: string | null } & {
  [key: string]: unknown
}

export interface BookingFormRootFields {
  guest: BookingFormGuestData
  stay: BookingFormStayBranch
}

export type BookingFormRootData = BookingFormRootFields & { [key: string]: unknown }

export type BookingFormRootDataPartial = Partial<BookingFormRootFields> & {
  [key: string]: unknown
}

/** Edit form state while the user types: branches may be missing. */
export interface BookingFormDataDraft {
  guest?: Record<string, unknown>
  stay?: Record<string, unknown>
  [key: string]: unknown
}

export interface BookingDetailPayload {
  detail: BookingDetailData
  formRef: FormRef | null
}

/** Splits a booking response into FormDSL data and its `_form` reference. */
export function parseBookingDetailPayload(raw: BookingItem): BookingDetailPayload {
  return {
    detail: {
      guest: { ...raw.guest },
      stay: { ...raw.stay },
      status: raw.status,
      id: raw.id,
      outstanding_balance: raw.outstanding_balance,
    },
    formRef: normalizeFormRef(raw._form),
  }
}

/** The contract keeps `definition` free-form; the builder reads it as FormDSL. */
function formDefinition(data: Schemas['bookinghttp.FormResponse']): {
  definition: FormNode
  hash: string
} {
  return { definition: data.definition as unknown as FormNode, hash: data.hash }
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

/**
 * Bookings with a night in the period of hotel-local dates `[from, to)`
 * (`YYYY-MM-DD`, `to` not included); canceled bookings are not returned.
 */
export function fetchBookingGrid(
  params: { from: string; to: string },
  options: RequestOptions = {},
): Promise<BookingItem[]> {
  return typedApi
    .get('/api/bookings/grid', {
      query: { from: params.from, to: params.to },
      signal: options.signal,
    })
    .then(({ data }) => data)
}

/** `body` is FormDSL data of the organization's booking form; its rules checked it. */
export function createBooking(body: CreateBookingPayload): Promise<BookingItem> {
  return typedApi.post('/api/bookings', { body }).then(({ data }) => data)
}

/**
 * Bookings, searched by `q`; `from` and `to` (hotel-local dates, either may be
 * omitted) keep the bookings with a night in `[from, to)`.
 */
export function fetchBookings(
  params: { q?: string; from?: string; to?: string } = {},
  options: RequestOptions = {},
): Promise<BookingItem[]> {
  const query: { q?: string; from?: string; to?: string } = {}
  if (params.q?.trim()) query.q = params.q.trim()
  if (params.from) query.from = params.from
  if (params.to) query.to = params.to
  return typedApi.get('/api/bookings', { query, signal: options.signal }).then(({ data }) => data)
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
 * Merge aggregate detail + runtime form.
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
    outstanding_balance: detail.outstanding_balance,
  }
}

/**
 * Booking aggregate + runtime form (hash-keyed cache). The stored quote is not
 * part of it: a role that may read the booking but not the quote still opens it.
 */
export async function fetchBookingWithRuntimeForm(
  id: string,
  target: 'edit' | 'view' = 'view',
  options: RequestOptions = {},
): Promise<BookingFormResponse> {
  const { detail, formRef } = await fetchBooking(id, options)
  const form = await loadBookingRuntimeForm(target, formRef?.hash, { force: false })
  return mergeBookingDetailWithRuntimeForm(detail, form)
}

export function fetchBookingFormDefinition(options: RequestOptions = {}): Promise<{
  definition: FormNode
  hash: string
}> {
  return typedApi
    .get('/api/bookings/form/definition', { signal: options.signal })
    .then(({ data }) => formDefinition(data))
}

export function updateBookingFormDefinition(body: {
  definition: FormNode
}): Promise<{ definition: FormNode; hash: string }> {
  return typedApi
    .put('/api/bookings/form/definition', {
      body: { definition: body.definition as unknown as Record<string, unknown> },
    })
    .then(({ data }) => formDefinition(data))
}

export function fetchBooking(
  id: string,
  options: RequestOptions = {},
): Promise<BookingDetailPayload> {
  return typedApi
    .get('/api/bookings/{id}', { path: { id }, signal: options.signal })
    .then(({ data }) => parseBookingDetailPayload(data))
}

/** `body` is FormDSL data of the organization's booking form; its rules checked it. */
export function updateBooking(id: string, body: UpdateBookingPayload): Promise<BookingItem> {
  return typedApi.put('/api/bookings/{id}', { path: { id }, body }).then(({ data }) => data)
}

export function checkIn(id: string): Promise<BookingItem> {
  return typedApi.put('/api/bookings/{id}/check-in', { path: { id } }).then(({ data }) => data)
}

export function checkOut(id: string, options?: { forceUnpaid?: boolean }): Promise<BookingItem> {
  return typedApi
    .put('/api/bookings/{id}/check-out', {
      path: { id },
      body: { force_unpaid: options?.forceUnpaid ?? false },
    })
    .then(({ data }) => data)
}

export function cancel(id: string): Promise<BookingItem> {
  return typedApi.put('/api/bookings/{id}/cancel', { path: { id } }).then(({ data }) => data)
}
