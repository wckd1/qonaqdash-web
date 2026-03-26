<template>
  <header class="page-header">
    <h1>{{ t('page_title.booking_new') }}</h1>
    <button v-if="bookingForm" type="button" :disabled="submitting" @click="onSubmit">
      {{ submitting ? t('common.saving') : t('common.save') }}
    </button>
  </header>

  <p v-if="loadError" class="error-message">{{ loadError }}</p>
  <div v-else-if="loading" class="loading-state">{{ t('common.loading') }}</div>
  <template v-else-if="bookingForm">
    <FormEdit
      :definition="bookingForm.definition"
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
import type { FormNode } from '@/shared/types/forms'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import { httpErrorData, httpErrorResponse } from '@/shared/unknownError'
import FormEdit from '@/shared/form-dsl/FormEdit.vue'
import { validateFormData } from '@/shared/form-dsl/validateFormData'
import { scrollToFirstFormError } from '@/shared/form-dsl/scrollToFirstError'

import { guestSearchKey, availableRoomsKey } from '@/shared/injectKeys'

provide(guestSearchKey, (q) => fetchGuests({ q }))

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useBookingStore()

const loading = ref(true)
const loadError = ref('')
type BookingFormRuntime = { definition: FormNode; data: Record<string, unknown> }

const bookingForm = ref<BookingFormRuntime | null>(null)
const formData = ref<Record<string, unknown>>({})
const errorsMap = ref<Record<string, string[]>>({})
const submitting = ref(false)
const availableRooms = ref<Room[]>([])

provide(availableRoomsKey, availableRooms)

watch(
  () => {
    const raw = formData.value.stay
    if (!raw || typeof raw !== 'object') return [undefined, undefined] as const
    const b = raw as Record<string, unknown>
    return [b.check_in, b.check_out] as const
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
  const raw = formData.value.stay
  if (!raw || typeof raw !== 'object') return
  const stay = raw as Record<string, unknown>
  const q = route.query
  const checkIn = typeof q.checkIn === 'string' ? q.checkIn : ''
  const checkOut = typeof q.checkOut === 'string' ? q.checkOut : ''
  const roomId = typeof q.roomId === 'string' ? q.roomId : ''
  if (checkIn) stay.check_in = checkIn
  if (checkOut) stay.check_out = checkOut
  if (roomId) {
    try {
      const list = await fetchRooms()
      const room = list.find((r) => r.id === roomId)
      if (room?.room_type_id) {
        stay.rooms = [{ room_type: room.room_type_id, room_id: room.id }]
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
    if (!formData.value.stay) formData.value.stay = { check_in: '', check_out: '', rooms: [] }
    const stayObj = formData.value.stay as Record<string, unknown>
    if (!Array.isArray(stayObj.rooms)) stayObj.rooms = []
    await mergeRouteQueryIntoForm()
  } catch (err: unknown) {
    loadError.value = formatUnknownApiError(err) || t('bookings.form_load_failed')
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
  const { valid, errorsMap: clientErrors } = validateFormData(
    bookingForm.value?.definition,
    formData.value,
  )
  if (!valid) {
    errorsMap.value = clientErrors
    scrollToFirstFormError()
    return
  }
  submitting.value = true
  try {
    const payload = JSON.parse(JSON.stringify(formData.value))
    delete payload.id
    await store.createBooking(payload)
    router.push('/bookings')
  } catch (err: unknown) {
    const msg = formatUnknownApiError(err) || t('bookings.create_failed')
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
