<template>
  <header class="page-header">
    <h1>{{ t('pageTitle.bookingNew') }}</h1>
    <button
      v-if="bookingForm"
      type="button"
      :disabled="submitting"
      @click="onSubmit"
    >
      {{ submitting ? t('common.saving') : t('common.save') }}
    </button>
  </header>

  <p v-if="loadError" class="error-message">{{ loadError }}</p>
  <div v-else-if="loading" class="loading-state">{{ t('common.loading') }}</div>
  <template v-else-if="bookingForm">
    <JsonFormEdit
      :schema="bookingForm.schema"
      :uischema="bookingForm.uischema"
      :data="formData"
      :errors-map="errorsMap"
      @update:data="formData = $event"
    />
  </template>
</template>

<script setup lang="ts">
import { ref, onMounted, provide, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useBookingStore } from '@/features/bookings/stores/useBookingStore'
import { fetchGuests } from '@/features/guests/api'
import { fetchAvailableRooms, fetchRooms } from '@/features/property/api'
import type { Room } from '@/shared/types/property'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import { httpErrorData, httpErrorResponse } from '@/shared/unknownError'
import JsonFormEdit from '@/shared/jsonform/JsonFormEdit.vue'
import { bookingSchemaWithAvailableRoomIds } from '@/shared/jsonform/utils'
import { validateJsonFormData } from '@/shared/jsonform/validateJsonFormData'

import { guestSearchKey, availableRoomsKey } from '@/shared/injectKeys'

provide(guestSearchKey, (q) => fetchGuests({ q }))

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useBookingStore()

const loading = ref(true)
const loadError = ref('')
type BookingFormRuntime = { schema: object; uischema: object; data: Record<string, unknown> }

const bookingForm = ref<BookingFormRuntime | null>(null)
const formData = ref<Record<string, unknown>>({})
const errorsMap = ref<Record<string, string[]>>({})
const submitting = ref(false)
const availableRooms = ref<Room[]>([])

provide(availableRoomsKey, availableRooms)

watch(
  () => {
    const raw = formData.value.booking
    if (!raw || typeof raw !== 'object') return [undefined, undefined] as const
    const b = raw as Record<string, unknown>
    return [b.checkIn, b.checkOut] as const
  },
  async ([checkIn, checkOut]) => {
    if (typeof checkIn !== 'string' || typeof checkOut !== 'string' || !checkIn || !checkOut) {
      availableRooms.value = []
      return
    }
    const from = new Date(checkIn)
    const to = new Date(checkOut)
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      availableRooms.value = []
      return
    }
    try {
      availableRooms.value = await fetchAvailableRooms(from, to)
    } catch {
      availableRooms.value = []
    }
  },
  { immediate: true },
)

async function mergeRouteQueryIntoForm() {
  const raw = formData.value.booking
  if (!raw || typeof raw !== 'object') return
  const booking = raw as Record<string, unknown>
  const q = route.query
  const checkIn = typeof q.checkIn === 'string' ? q.checkIn : ''
  const checkOut = typeof q.checkOut === 'string' ? q.checkOut : ''
  const roomId = typeof q.roomId === 'string' ? q.roomId : ''
  if (checkIn) booking.checkIn = checkIn
  if (checkOut) booking.checkOut = checkOut
  if (roomId) {
    try {
      const list = await fetchRooms()
      const room = list.find((r) => r.id === roomId)
      if (room?.room_type_id) {
        booking.rooms = [{ roomType: room.room_type_id, roomID: room.id }]
      }
    } catch {
      /* keep existing rooms */
    }
  }
}

onMounted(async () => {
  loading.value = true
  loadError.value = ''
  try {
    const template = await store.fetchBookingForm()
    bookingForm.value = template as BookingFormRuntime
    formData.value = JSON.parse(JSON.stringify(bookingForm.value.data ?? {}))
    if (!formData.value.guest) formData.value.guest = {}
    const guestObj = formData.value.guest as Record<string, unknown>
    if (guestObj.id === undefined) guestObj.id = null
    if (!formData.value.booking) formData.value.booking = { checkIn: '', checkOut: '', rooms: [] }
    const bookingObj = formData.value.booking as Record<string, unknown>
    if (!Array.isArray(bookingObj.rooms)) bookingObj.rooms = []
    await mergeRouteQueryIntoForm()
  } catch (err: unknown) {
    loadError.value = formatUnknownApiError(err) || t('bookings.formLoadFailed')
  } finally {
    loading.value = false
  }
})

watch(
  () => [route.query.checkIn, route.query.checkOut, route.query.roomId],
  () => {
    if (route.name !== 'booking-new' || !bookingForm.value) return
    mergeRouteQueryIntoForm()
  },
)

async function onSubmit() {
  errorsMap.value = {}
  const schemaForValidate = bookingSchemaWithAvailableRoomIds(
    bookingForm.value?.schema ?? {},
    availableRooms.value,
    formData.value,
  )
  const { valid, errorsMap: clientErrors } = validateJsonFormData(schemaForValidate, formData.value)
  if (!valid) {
    errorsMap.value = clientErrors
    return
  }
  submitting.value = true
  try {
    const payload = JSON.parse(JSON.stringify(formData.value))
    delete payload.id
    await store.createBooking(payload)
    router.push('/bookings')
  } catch (err: unknown) {
    const msg = formatUnknownApiError(err) || t('bookings.createFailed')
    const serverErrors = httpErrorData(err)?.errors
    if (
      httpErrorResponse(err) &&
      serverErrors &&
      typeof serverErrors === 'object' &&
      !Array.isArray(serverErrors)
    ) {
      errorsMap.value = serverErrors as Record<string, string[]>
    } else {
      errorsMap.value = { '': [msg] }
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.error-message {
  color: var(--semantic-error);
  font-size: var(--text-body-size);
  margin: 0 0 var(--space-md);
}

.loading-state {
  color: var(--ink-tertiary);
  font-size: var(--text-body-size);
}
</style>
