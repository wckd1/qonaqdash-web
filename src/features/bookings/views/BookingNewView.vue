<template>
  <header class="page-header">
    <h1>{{ t('page_title.booking_new') }}</h1>
  </header>

  <p v-if="loadError" class="error-message">{{ loadError }}</p>
  <div v-else-if="loading" class="loading-state">{{ t('common.loading') }}</div>
  <div v-else-if="submitting" class="creating-state">
    <span class="creating-state__spinner" aria-hidden="true" />
    {{ t('bookings.creating') }}
  </div>
  <template v-else-if="bookingForm">
    <FormEdit
      :definition="bookingForm.definition"
      :data="formData"
      :errors-map="errorsMap"
      @update:data="formData = $event"
    />
    <QuoteBreakdown
      :quote="quote"
      :currency="hotelCurrency"
      :loading="quoteLoading"
      :error="quoteError"
      :room-type-names="roomTypeNames"
    >
      <template #actions>
        <button type="button" @click="onSubmit">
          {{ t('common.save') }}
        </button>
      </template>
    </QuoteBreakdown>
  </template>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, provide, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useBookingStore } from '@/features/bookings/stores/useBookingStore'
import { usePropertyStore } from '@/features/property/stores/usePropertyStore'
import { fetchGuests } from '@/features/guests/api'
import { fetchAvailableRooms, fetchRooms } from '@/features/property/api'
import type { Room } from '@/shared/types/property'
import type { FormNode } from '@/shared/types/forms'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import { httpErrorData, httpErrorResponse } from '@/shared/unknownError'
import { useNotification } from '@/shared/composables/useNotification'
import FormEdit from '@/shared/form-dsl/FormEdit.vue'
import QuoteBreakdown from '@/features/bookings/components/QuoteBreakdown.vue'
import { validateFormData } from '@/shared/form-dsl/validateFormData'
import { scrollToFirstFormError } from '@/shared/form-dsl/scrollToFirstError'
import { useBookingQuote } from '@/features/bookings/composables/useBookingQuote'

import { guestSearchKey, availableRoomsKey } from '@/shared/injectKeys'

provide(guestSearchKey, (q) => fetchGuests({ q }))

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useBookingStore()
const { error: showError } = useNotification()
const propertyStore = usePropertyStore()

const loading = ref(true)
const loadError = ref('')
type BookingFormRuntime = { definition: FormNode; data: Record<string, unknown> }

const bookingForm = ref<BookingFormRuntime | null>(null)
const formData = ref<Record<string, unknown>>({})
const errorsMap = ref<Record<string, string[]>>({})
const submitting = ref(false)
const availableRooms = ref<Room[]>([])

provide(availableRoomsKey, availableRooms)

const stayBranch = computed(() => {
  const raw = formData.value.stay
  if (!raw || typeof raw !== 'object') return null
  return raw as Record<string, unknown>
})

const hotelCurrency = computed(() => propertyStore.hotel?.currency ?? '')
const roomTypeNames = computed(() => {
  const map: Record<string, string> = {}
  for (const rt of propertyStore.roomTypes) map[rt.id] = rt.name
  return map
})

const { quote, quoteLoading, quoteError } = useBookingQuote(
  () => String(stayBranch.value?.check_in ?? ''),
  () => String(stayBranch.value?.check_out ?? ''),
  () => (Array.isArray(stayBranch.value?.rooms) ? stayBranch.value!.rooms : []),
  () => formData.value,
)

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
  propertyStore.fetchHotel()
  propertyStore.fetchRoomTypes()
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
    const created = await store.createBooking(payload)
    router.push(`/bookings/${created.id}/details`)
  } catch (err: unknown) {
    submitting.value = false
    const msg = formatUnknownApiError(err) || t('bookings.create_failed')
    const serverErrors = httpErrorData(err)?.errors
    if (
      httpErrorResponse(err) &&
      serverErrors &&
      typeof serverErrors === 'object' &&
      !Array.isArray(serverErrors)
    ) {
      errorsMap.value = serverErrors as Record<string, string[]>
    }
    showError(msg)
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

.creating-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  flex: 1;
  color: var(--ink-tertiary);
  font-size: var(--text-body-size);
}

.creating-state__spinner {
  display: block;
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-default);
  border-top-color: var(--brand-primary);
  border-radius: 50%;
  animation: creating-spin 0.7s linear infinite;
}

@keyframes creating-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
