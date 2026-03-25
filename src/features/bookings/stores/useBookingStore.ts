import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  BookingFormResponse,
  BookingListItem,
  CreateBookingPayload,
} from '@/features/bookings/api'
import * as bookingsApi from '@/features/bookings/api'

type BookingFormTemplate = { schema: object; uischema: object; data: object }

/**
 * @param {{ schema?: object, uischema?: object, data?: object }} res
 * @returns {{ schema: object, uischema: object, data: object }}
 */
function snapshotBookingForm(res) {
  return {
    schema: JSON.parse(JSON.stringify(res.schema ?? {})),
    uischema: JSON.parse(JSON.stringify(res.uischema ?? {})),
    data: JSON.parse(JSON.stringify(res.data ?? {})),
  }
}

export const useBookingStore = defineStore('bookings', () => {
  const bookings = ref<BookingListItem[]>([])
  const currentBooking = ref<BookingFormResponse | null>(null)
  /** Booking id last loaded into `currentBooking` (detail route); lifecycle PUTs refresh it only when this matches. */
  const currentBookingId = ref<string | null>(null)

  /** Last `hash` from create `GET …/form?target=edit` — `If-None-Match` on each new-booking open. */
  const bookingCreateFormHash = ref<string | null>(null)

  /** Session cache for GET /api/bookings/form (blank form definition). */
  const bookingFormTemplate = ref<BookingFormTemplate | null>(null)

  /**
   * @param {{ q?: string, from?: string, to?: string }} [params]
   * @returns {Promise<import('@/features/bookings/api').BookingListItem[]>}
   */
  async function fetchBookings(params = {}) {
    bookings.value = await bookingsApi.fetchBookings(params)
    return bookings.value
  }

  /**
   * Blank form for create. Returns { schema, uischema, data }.
   * @param {{ force?: boolean }} [options] - force=true always hits the network.
   * @returns {Promise<import('@/features/bookings/api').BookingFormResponse>}
   */
  async function fetchBookingForm(options: { force?: boolean } = {}) {
    const res = await bookingsApi.fetchBookingForm({
      target: 'edit',
      force: options.force,
      revalidate: !options.force,
      ifNoneMatch: options.force ? null : bookingCreateFormHash.value,
    })
    if (typeof res.hash === 'string' && res.hash.trim()) {
      bookingCreateFormHash.value = res.hash.trim()
    }
    bookingFormTemplate.value = snapshotBookingForm(res)
    return JSON.parse(JSON.stringify(bookingFormTemplate.value))
  }

  /**
   * Form definition for manage → booking form (JSONForm build). Always hits GET …/form/schema.
   * @returns {Promise<import('@/features/bookings/api').BookingFormResponse>}
   */
  async function fetchBookingFormSchema() {
    const res = await bookingsApi.fetchBookingFormSchema()
    return {
      schema: JSON.parse(JSON.stringify(res.schema ?? {})),
      uischema: JSON.parse(JSON.stringify(res.uischema ?? {})),
      data: JSON.parse(JSON.stringify(res.data ?? {})),
    }
  }

  /**
   * After a successful PUT …/form/schema from settings: drop cached GET …/form so create flow refetches;
   * if the response includes schema + uischema, optionally re-seed the runtime template.
   * @param {{ schema?: object, uischema?: object, data?: object }} res
   */
  function replaceBookingFormTemplate(res) {
    bookingsApi.invalidateBookingRuntimeFormCache()
    bookingCreateFormHash.value = null
    bookingFormTemplate.value = null
    if (res?.schema != null && res?.uischema != null) {
      bookingFormTemplate.value = snapshotBookingForm(res)
    }
  }

  /**
   * @param {string} id
   * @param {{ setAsCurrent?: boolean }} [options] - setAsCurrent=false when refreshing another id without switching detail context.
   * @returns {Promise<import('@/features/bookings/api').BookingFormResponse>}
   */
  async function fetchBooking(
    id: string,
    options: { setAsCurrent?: boolean; formTarget?: 'view' | 'edit' } = {},
  ) {
    const setAsCurrent = options.setAsCurrent !== false
    const formTarget = options.formTarget ?? 'view'
    const formResponse = await bookingsApi.fetchBookingWithRuntimeForm(id, formTarget)
    if (setAsCurrent) {
      currentBookingId.value = id
      currentBooking.value = formResponse
    }
    return formResponse
  }

  /**
   * @param {import('@/features/bookings/api').CreateBookingPayload} payload
   * @returns {Promise<{ id: string, guest_id: string, check_in: string, check_out: string, status: string, version?: number }>}
   */
  async function createBooking(payload: CreateBookingPayload) {
    return bookingsApi.createBooking(payload)
  }

  /**
   * @param {string} id
   * @param {import('@/features/bookings/api').CreateBookingPayload} payload
   * @returns {Promise<import('@/features/bookings/api').BookingFormResponse>}
   */
  async function updateBooking(id: string, payload: CreateBookingPayload) {
    await bookingsApi.updateBooking(id, payload)
    const formResponse = await bookingsApi.fetchBookingWithRuntimeForm(id, 'view')
    if (currentBookingId.value === id) {
      currentBooking.value = formResponse
    }
    return formResponse
  }

  /**
   * @param {string} id
   * @returns {Promise<import('@/features/bookings/api').BookingFormResponse>}
   */
  async function checkIn(id) {
    await bookingsApi.checkIn(id)
    const formResponse = await bookingsApi.fetchBookingWithRuntimeForm(id, 'view')
    if (currentBookingId.value === id) {
      currentBooking.value = formResponse
    }
    return formResponse
  }

  /**
   * @param {string} id
   * @returns {Promise<import('@/features/bookings/api').BookingFormResponse>}
   */
  async function checkOut(id) {
    await bookingsApi.checkOut(id)
    const formResponse = await bookingsApi.fetchBookingWithRuntimeForm(id, 'view')
    if (currentBookingId.value === id) {
      currentBooking.value = formResponse
    }
    return formResponse
  }

  /**
   * @param {string} id
   * @returns {Promise<import('@/features/bookings/api').BookingFormResponse>}
   */
  async function cancel(id) {
    await bookingsApi.cancel(id)
    const formResponse = await bookingsApi.fetchBookingWithRuntimeForm(id, 'view')
    if (currentBookingId.value === id) {
      currentBooking.value = formResponse
    }
    return formResponse
  }

  function clearCurrentBooking() {
    currentBooking.value = null
    currentBookingId.value = null
  }

  return {
    bookings,
    currentBooking,
    fetchBookings,
    fetchBookingForm,
    fetchBookingFormSchema,
    replaceBookingFormTemplate,
    fetchBooking,
    createBooking,
    updateBooking,
    checkIn,
    checkOut,
    cancel,
    clearCurrentBooking,
  }
})
