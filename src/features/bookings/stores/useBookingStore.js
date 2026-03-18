import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as bookingsApi from '@/features/bookings/api'

export const useBookingStore = defineStore('bookings', () => {
  const bookings = ref([])
  const currentBooking = ref(null)

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
   * @returns {Promise<import('@/features/bookings/api').BookingFormResponse>}
   */
  async function fetchBookingForm() {
    return bookingsApi.fetchBookingForm()
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
   * @returns {Promise<import('@/features/bookings/api').BookingFlat>}
   */
  async function updateBooking(id, payload) {
    const booking = await bookingsApi.updateBooking(id, payload)
    currentBooking.value = booking
    return booking
  }

  /**
   * @param {string} id
   * @returns {Promise<import('@/features/bookings/api').BookingFlat>}
   */
  async function checkIn(id) {
    const booking = await bookingsApi.checkIn(id)
    currentBooking.value = booking
    return booking
  }

  /**
   * @param {string} id
   * @returns {Promise<import('@/features/bookings/api').BookingFlat>}
   */
  async function checkOut(id) {
    const booking = await bookingsApi.checkOut(id)
    currentBooking.value = booking
    return booking
  }

  /**
   * @param {string} id
   * @returns {Promise<import('@/features/bookings/api').BookingFlat>}
   */
  async function cancel(id) {
    const booking = await bookingsApi.cancel(id)
    currentBooking.value = booking
    return booking
  }

  function clearCurrentBooking() {
    currentBooking.value = null
  }

  return {
    bookings,
    currentBooking,
    fetchBookings,
    fetchBookingForm,
    fetchBooking,
    createBooking,
    updateBooking,
    checkIn,
    checkOut,
    cancel,
    clearCurrentBooking,
  }
})
