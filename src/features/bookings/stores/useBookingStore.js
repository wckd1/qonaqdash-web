import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as bookingsApi from '@/features/bookings/api'

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
  const bookings = ref([])
  const currentBooking = ref(null)

  /** Session cache for GET /api/bookings/form (blank form definition). */
  const bookingFormTemplate = ref(null)

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
  async function fetchBookingForm(options = {}) {
    if (!options.force && bookingFormTemplate.value != null) {
      return JSON.parse(JSON.stringify(bookingFormTemplate.value))
    }
    const res = await bookingsApi.fetchBookingForm()
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
    bookingFormTemplate.value = null
    if (res?.schema != null && res?.uischema != null) {
      bookingFormTemplate.value = snapshotBookingForm(res)
    }
  }

  /**
   * @param {string} id
   * @returns {Promise<import('@/features/bookings/api').BookingFormResponse>}
   */
  async function fetchBooking(id) {
    const formResponse = await bookingsApi.fetchBooking(id)
    currentBooking.value = formResponse
    return formResponse
  }

  /**
   * @param {import('@/features/bookings/api').CreateBookingPayload} payload
   * @returns {Promise<{ id: string, guest_id: string, check_in: string, check_out: string, status: string, version?: number }>}
   */
  async function createBooking(payload) {
    return bookingsApi.createBooking(payload)
  }

  /**
   * @param {string} id
   * @param {import('@/features/bookings/api').CreateBookingPayload} payload
   * @returns {Promise<import('@/features/bookings/api').BookingFormResponse>}
   */
  async function updateBooking(id, payload) {
    await bookingsApi.updateBooking(id, payload)
    const formResponse = await bookingsApi.fetchBooking(id)
    currentBooking.value = formResponse
    return formResponse
  }

  /**
   * @param {string} id
   * @returns {Promise<import('@/features/bookings/api').BookingFormResponse>}
   */
  async function checkIn(id) {
    await bookingsApi.checkIn(id)
    const formResponse = await bookingsApi.fetchBooking(id)
    currentBooking.value = formResponse
    return formResponse
  }

  /**
   * @param {string} id
   * @returns {Promise<import('@/features/bookings/api').BookingFormResponse>}
   */
  async function checkOut(id) {
    await bookingsApi.checkOut(id)
    const formResponse = await bookingsApi.fetchBooking(id)
    currentBooking.value = formResponse
    return formResponse
  }

  /**
   * @param {string} id
   * @returns {Promise<import('@/features/bookings/api').BookingFormResponse>}
   */
  async function cancel(id) {
    await bookingsApi.cancel(id)
    const formResponse = await bookingsApi.fetchBooking(id)
    currentBooking.value = formResponse
    return formResponse
  }

  function clearCurrentBooking() {
    currentBooking.value = null
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
