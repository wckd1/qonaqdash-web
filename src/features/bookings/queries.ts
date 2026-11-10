import { defineQueryOptions, useMutation, useQueryCache, type QueryCache } from '@pinia/colada'
import { invalidateKeys } from '@/shared/api/queryCache'
import { snapshotForm, type RuntimeFormSnapshot } from '@/shared/forms/formSnapshot'
import type { FormNode } from '@/shared/types/forms'
import * as bookingsApi from '@/features/bookings/api'
import type { CreateBookingPayload } from '@/features/bookings/api'

export interface BookingListParams {
  q?: string
  from?: string
  to?: string
}

/** List filter as it goes into a key: plain JSON, trimmed search, no `undefined`. */
function listParams(params: BookingListParams) {
  return { q: params.q?.trim() ?? '', from: params.from ?? '', to: params.to ?? '' }
}

export const bookingKeys = {
  all: ['bookings'] as const,
  lists: ['bookings', 'list'] as const,
  list: (params: BookingListParams = {}) => ['bookings', 'list', listParams(params)] as const,
  grid: (range: { from: string; to: string }) =>
    ['bookings', 'grid', { from: range.from, to: range.to }] as const,
  details: ['bookings', 'detail'] as const,
  /** Booking aggregate + stored quote + runtime form for `target`. */
  detail: (id: string, target: 'edit' | 'view') => ['bookings', 'detail', id, target] as const,
  forms: ['bookings', 'form'] as const,
  createForm: ['bookings', 'form', 'runtime', 'edit', ''] as const,
  formDefinition: ['bookings', 'form', 'definition'] as const,
}

export const bookingListQuery = defineQueryOptions((params: BookingListParams = {}) => ({
  key: bookingKeys.list(params),
  query: ({ signal }) => bookingsApi.fetchBookings(listParams(params), { signal }),
}))

/** Reservation grid of a date range. */
export const bookingGridQuery = defineQueryOptions((range: { from: string; to: string }) => ({
  key: bookingKeys.grid(range),
  query: ({ signal }) => bookingsApi.fetchBookingGrid(range, { signal }),
}))

/** Booking with its stored quote and the runtime form, ready for `FormView` / `FormEdit`. */
export const bookingDetailQuery = defineQueryOptions(
  ({ id, target }: { id: string; target: 'edit' | 'view' }) => ({
    key: bookingKeys.detail(id, target),
    query: ({ signal }) => bookingsApi.fetchBookingWithRuntimeForm(id, target, { signal }),
  }),
)

/**
 * Edit form for a new booking. Every open revalidates it with `If-None-Match`
 * and the last known hash: `304` keeps the cached definition, `200` brings
 * the changed one.
 */
export const bookingCreateFormQuery = defineQueryOptions({
  key: bookingKeys.createForm,
  staleTime: 0,
  query: async ({ entry }): Promise<RuntimeFormSnapshot> => {
    const previous = entry.state.value.data as RuntimeFormSnapshot | undefined
    const res = await bookingsApi.fetchBookingForm({
      target: 'edit',
      revalidate: true,
      ifNoneMatch: previous?.hash || null,
    })
    return { ...snapshotForm(res), hash: res.hash?.trim() || previous?.hash || '' }
  },
})

/** Persisted definition for the form builder. */
export const bookingFormDefinitionQuery = defineQueryOptions({
  key: bookingKeys.formDefinition,
  query: ({ signal }) => bookingsApi.fetchBookingFormDefinition({ signal }),
})

/**
 * Keys a booking change touches: booking lists, grids and details, the guest's booking
 * history, the folio and reports, the rooms (occupancy, housekeeping after a
 * check-out) and the tasks a check-out creates.
 */
function invalidateAfterBookingChange(queryCache: QueryCache) {
  return invalidateKeys(queryCache, [
    bookingKeys.lists,
    ['bookings', 'grid'],
    bookingKeys.details,
    ['guests', 'bookings'],
    ['billing'],
    ['property', 'rooms'],
    ['tasks'],
  ])
}

export function useCreateBookingMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (payload: CreateBookingPayload) => bookingsApi.createBooking(payload),
    onSuccess: () => invalidateAfterBookingChange(queryCache),
  })
}

export function useUpdateBookingMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (vars: { id: string; payload: CreateBookingPayload }) =>
      bookingsApi.updateBooking(vars.id, vars.payload),
    onSuccess: () => invalidateAfterBookingChange(queryCache),
  })
}

export function useCheckInMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (id: string) => bookingsApi.checkIn(id),
    onSuccess: () => invalidateAfterBookingChange(queryCache),
  })
}

export function useCheckOutMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (vars: { id: string; forceUnpaid?: boolean }) =>
      bookingsApi.checkOut(vars.id, { forceUnpaid: vars.forceUnpaid }),
    onSuccess: () => invalidateAfterBookingChange(queryCache),
  })
}

export function useCancelBookingMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (id: string) => bookingsApi.cancel(id),
    onSuccess: () => invalidateAfterBookingChange(queryCache),
  })
}

export function useUpdateBookingFormDefinitionMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (definition: FormNode) => bookingsApi.updateBookingFormDefinition({ definition }),
    onSuccess: () => {
      bookingsApi.invalidateBookingRuntimeFormCache()
      // Bookings carry the hash of their form definition in `_form`.
      return invalidateKeys(queryCache, [bookingKeys.all])
    },
  })
}
