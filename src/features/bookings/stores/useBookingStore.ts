import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FormNode } from '@/shared/types/forms'
import type {
  BookingFormResponse,
  BookingListItem,
  CreateBookingPayload,
} from '@/features/bookings/api'
import * as bookingsApi from '@/features/bookings/api'

type BookingFormTemplate = { definition: FormNode; data: Record<string, unknown> }

function snapshotBookingForm(res: { definition?: unknown; data?: unknown }): BookingFormTemplate {
  return {
    definition: JSON.parse(JSON.stringify(res.definition ?? {})),
    data: JSON.parse(JSON.stringify(res.data ?? {})),
  }
}

export const useBookingStore = defineStore('bookings', () => {
  const bookings = ref<BookingListItem[]>([])
  const currentBooking = ref<BookingFormResponse | null>(null)
  const currentBookingId = ref<string | null>(null)

  const bookingCreateFormHash = ref<string | null>(null)

  const bookingFormTemplate = ref<BookingFormTemplate | null>(null)

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
    bookingFormTemplate.value = snapshotBookingForm(res)
    return JSON.parse(JSON.stringify(bookingFormTemplate.value))
  }

  async function fetchBookingFormSchema() {
    const res = await bookingsApi.fetchBookingFormSchema()
    return {
      definition: JSON.parse(JSON.stringify(res.definition ?? {})),
      data: JSON.parse(JSON.stringify(res.data ?? {})),
    }
  }

  function replaceBookingFormTemplate(res: { definition?: unknown; data?: unknown }) {
    bookingsApi.invalidateBookingRuntimeFormCache()
    bookingCreateFormHash.value = null
    bookingFormTemplate.value = null
    if (res?.definition != null) {
      bookingFormTemplate.value = snapshotBookingForm(res)
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

  async function updateBooking(id: string, payload: CreateBookingPayload) {
    await bookingsApi.updateBooking(id, payload)
    const formResponse = await bookingsApi.fetchBookingWithRuntimeForm(id, 'view')
    if (currentBookingId.value === id) {
      currentBooking.value = formResponse
    }
    return formResponse
  }

  async function checkIn(id: string) {
    await bookingsApi.checkIn(id)
    const formResponse = await bookingsApi.fetchBookingWithRuntimeForm(id, 'view')
    if (currentBookingId.value === id) {
      currentBooking.value = formResponse
    }
    return formResponse
  }

  async function checkOut(id: string) {
    await bookingsApi.checkOut(id)
    const formResponse = await bookingsApi.fetchBookingWithRuntimeForm(id, 'view')
    if (currentBookingId.value === id) {
      currentBooking.value = formResponse
    }
    return formResponse
  }

  async function cancel(id: string) {
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
