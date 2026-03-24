import api from '@/shared/api/client'
import type { BookingFlat, BookingFormResponse, CreateBookingPayload } from '@/shared/types/bookings'

export type {
  BookingFlat,
  BookingFormDataDraft,
  BookingFormGuestData,
  BookingFormResponse,
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

export function fetchBookingForm(): Promise<BookingFormResponse> {
  return api.get('/api/bookings/form').then(({ data }) => data)
}

export function fetchBookingFormSchema(): Promise<BookingFormResponse> {
  return api.get('/api/bookings/form/schema').then(({ data }) => data)
}

export function updateBookingFormSchema(body: {
  schema: object
  uischema: object
  data?: object
}): Promise<BookingFormResponse> {
  return api.put('/api/bookings/form/schema', body).then(({ data }) => data)
}

export function fetchBooking(id: string): Promise<BookingFormResponse> {
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
