<template>
  <header class="page-header">
    <h1>New booking</h1>
    <button
      v-if="bookingForm"
      type="button"
      :disabled="submitting"
      @click="onSubmit"
    >
      {{ submitting ? 'Saving…' : 'Save' }}
    </button>
  </header>

  <p v-if="loadError" class="error-message">{{ loadError }}</p>
  <div v-else-if="loading" class="loading-state">Loading…</div>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBookingStore } from '@/features/bookings/stores/useBookingStore'
import JsonFormEdit from '@/shared/jsonform/JsonFormEdit.vue'

const router = useRouter()
const store = useBookingStore()

const loading = ref(true)
const loadError = ref('')
const bookingForm = ref(null)
const formData = ref({})
const errorsMap = ref({})
const submitting = ref(false)

onMounted(async () => {
  loading.value = true
  loadError.value = ''
  try {
    bookingForm.value = await store.fetchBookingForm()
    formData.value = JSON.parse(JSON.stringify(bookingForm.value.data ?? {}))
    if (!formData.value.guest) formData.value.guest = {}
    if (!formData.value.booking) formData.value.booking = { checkIn: '', checkOut: '', rooms: [] }
    if (!Array.isArray(formData.value.booking.rooms)) formData.value.booking.rooms = []
  } catch (err) {
    loadError.value = err.response?.data?.error ?? 'Failed to load form.'
  } finally {
    loading.value = false
  }
})

async function onSubmit() {
  errorsMap.value = {}
  submitting.value = true
  try {
    await store.createBooking(formData.value)
    router.push('/bookings')
  } catch (err) {
    const msg = err.response?.data?.error ?? 'Failed to create booking.'
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
