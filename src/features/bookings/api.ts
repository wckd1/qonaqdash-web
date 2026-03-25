import api from '@/shared/api/client'
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
 * Runtime booking JSONForm definition (schema + uischema; optional empty `data`).
 * GET /api/bookings/form?target=edit|view — omit query → edit.
 */
export function fetchBookingForm(
  options: { target?: 'edit' | 'view' } = {},
): Promise<BookingFormSchemaResponse> {
  const target = options.target ?? 'edit'
  return api
    .get('/api/bookings/form', { params: { target } })
    .then(({ data }) => ({
      schema: data.schema,
      uischema: data.uischema,
      data: data.data ?? {},
    }))
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
 * Parallel load for booking detail / panel: aggregate data + runtime form.
 */
export async function fetchBookingWithRuntimeForm(
  id: string,
  target: 'edit' | 'view' = 'view',
): Promise<BookingFormResponse> {
  const [detail, form] = await Promise.all([
    fetchBooking(id),
    fetchBookingForm({ target }),
  ])
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

/** Booking JSONForms data only (`{ guest, booking }`). */
export function fetchBooking(id: string): Promise<BookingDetailData> {
  return api.get(`/api/bookings/${id}`).then(({ data }) => data)
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
