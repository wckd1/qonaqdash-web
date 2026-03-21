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

<script setup>
import { ref, onMounted, provide, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useBookingStore } from '@/features/bookings/stores/useBookingStore'
import { fetchGuests } from '@/features/guests/api'
import { fetchAvailableRooms, fetchRooms } from '@/features/property/api'
import JsonFormEdit from '@/shared/jsonform/JsonFormEdit.vue'

provide('guestSearch', (q) => fetchGuests({ q }))

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useBookingStore()

const loading = ref(true)
const loadError = ref('')
const bookingForm = ref(null)
const formData = ref({})
const errorsMap = ref({})
const submitting = ref(false)
const availableRooms = ref([])

provide('availableRooms', availableRooms)

watch(
  () => [formData.value?.booking?.checkIn, formData.value?.booking?.checkOut],
  async ([checkIn, checkOut]) => {
    if (!checkIn || !checkOut) {
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
  if (!formData.value?.booking) return
  const q = route.query
  const checkIn = typeof q.checkIn === 'string' ? q.checkIn : ''
  const checkOut = typeof q.checkOut === 'string' ? q.checkOut : ''
  const roomId = typeof q.roomId === 'string' ? q.roomId : ''
  if (checkIn) formData.value.booking.checkIn = checkIn
  if (checkOut) formData.value.booking.checkOut = checkOut
  if (roomId) {
    try {
      const list = await fetchRooms()
      const room = list.find((r) => r.id === roomId)
      if (room?.room_type_id) {
        formData.value.booking.rooms = [{ roomType: room.room_type_id, roomID: room.id }]
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
    bookingForm.value = await store.fetchBookingForm()
    formData.value = JSON.parse(JSON.stringify(bookingForm.value.data ?? {}))
    if (!formData.value.guest) formData.value.guest = {}
    if (!formData.value.booking) formData.value.booking = { checkIn: '', checkOut: '', rooms: [] }
    if (!Array.isArray(formData.value.booking.rooms)) formData.value.booking.rooms = []
    await mergeRouteQueryIntoForm()
  } catch (err) {
    loadError.value = err.response?.data?.error ?? t('bookings.formLoadFailed')
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
  submitting.value = true
  try {
    await store.createBooking(formData.value)
    router.push('/bookings')
  } catch (err) {
    const msg = err.response?.data?.error ?? t('bookings.createFailed')
    if (err.response?.data?.errors && typeof err.response.data.errors === 'object') {
      errorsMap.value = err.response.data.errors
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
