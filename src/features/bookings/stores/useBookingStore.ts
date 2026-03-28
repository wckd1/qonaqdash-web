import { defineStore } from 'pinia'
import { ref } from 'vue'
import { type FormTemplate, snapshotForm } from '@/shared/forms/formSnapshot'
import type {
  BookingFormResponse,
  BookingItem,
  CreateBookingPayload,
} from '@/features/bookings/api'
import * as bookingsApi from '@/features/bookings/api'

export const useBookingStore = defineStore('bookings', () => {
  const bookings = ref<BookingItem[]>([])
  const currentBooking = ref<BookingFormResponse | null>(null)
  const currentBookingId = ref<string | null>(null)

  const bookingCreateFormHash = ref<string | null>(null)

  const bookingFormTemplate = ref<FormTemplate | null>(null)

  async function fetchBookings(params = {}) {
    bookings.value = await bookingsApi.fetchBookings(params)
    return bookings.value
  }

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
    bookingFormTemplate.value = snapshotForm(res)
    return JSON.parse(JSON.stringify(bookingFormTemplate.value))
  }

  async function fetchBookingFormDefinition() {
    const res = await bookingsApi.fetchBookingFormDefinition()
    return {
      definition: JSON.parse(JSON.stringify(res.definition ?? {})),
      hash: res.hash,
    }
  }

  function replaceBookingFormTemplate(res: { definition?: unknown; data?: unknown }) {
    bookingsApi.invalidateBookingRuntimeFormCache()
    bookingCreateFormHash.value = null
    bookingFormTemplate.value = null
    if (res?.definition != null) {
      bookingFormTemplate.value = snapshotForm(res)
    }
  }

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

  async function createBooking(payload: CreateBookingPayload) {
    return bookingsApi.createBooking(payload)
  }

  /** Run a mutation, then re-fetch the booking with its runtime form and sync store state. */
  async function mutateAndRefresh(
    id: string,
    action: () => Promise<unknown>,
  ): Promise<BookingFormResponse> {
    await action()
    const formResponse = await bookingsApi.fetchBookingWithRuntimeForm(id, 'view')
    if (currentBookingId.value === id) {
      currentBooking.value = formResponse
    }
    return formResponse
  }

  async function updateBooking(id: string, payload: CreateBookingPayload) {
    return mutateAndRefresh(id, () => bookingsApi.updateBooking(id, payload))
  }

  async function checkIn(id: string) {
    return mutateAndRefresh(id, () => bookingsApi.checkIn(id))
  }

  async function checkOut(id: string, options?: { forceUnpaid?: boolean }) {
    return mutateAndRefresh(id, () => bookingsApi.checkOut(id, options))
  }

  async function cancel(id: string) {
    return mutateAndRefresh(id, () => bookingsApi.cancel(id))
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
    fetchBookingFormDefinition,
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
