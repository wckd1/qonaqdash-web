<template>
  <header class="page-header">
    <h1>{{ pageTitle }}</h1>
    <button
      v-if="bookingId && bookingForm && canEdit && !editing"
      type="button"
      @click="startEdit"
    >
      Edit
    </button>
    <div v-else-if="bookingId && bookingForm && editing" class="page-header-actions">
      <button type="button" :disabled="submitting" @click="onSave">
        {{ submitting ? 'Saving…' : 'Save' }}
      </button>
      <button type="button" class="btn-secondary" :disabled="submitting" @click="cancelEdit">
        Cancel
      </button>
    </div>
  </header>

  <p v-if="loadError" class="error-message">{{ loadError }}</p>
  <p v-else-if="notFound" class="error-message">
    Booking not found.
    <router-link to="/bookings" class="inline-link">Back to bookings</router-link>
  </p>
  <p v-else-if="concurrentError" class="error-message">
    {{ concurrentError }}
    <button type="button" @click="load">Retry</button>
  </p>
  <template v-else-if="currentBooking">
    <template v-if="bookingForm">
      <JsonFormView
        v-if="!editing"
        :schema="bookingForm.schema"
        :uischema="bookingForm.uischema"
        :data="bookingForm.data"
      />
      <template v-else>
        <JsonFormEdit
          :schema="bookingForm.schema"
          :uischema="bookingForm.uischema"
          :data="editFormData"
          :errors-map="errorsMap"
          @update:data="editFormData = $event"
        />
      </template>
    </template>
    <p v-else class="section-placeholder">Details are loading.</p>
  </template>
  <div v-else class="loading-state">Loading…</div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useBookingStore } from '@/features/bookings/stores/useBookingStore'
import { useBreadcrumb } from '@/shared/composables/useBreadcrumb'
import JsonFormView from '@/shared/jsonform/JsonFormView.vue'
import JsonFormEdit from '@/shared/jsonform/JsonFormEdit.vue'
import { normalizeBookingFormResponse } from '@/shared/jsonform/normalizeFormResponse'

const route = useRoute()
const store = useBookingStore()
const { currentBooking } = storeToRefs(store)
const { setItems: setBreadcrumb } = useBreadcrumb()

const loadError = ref('')
const notFound = ref(false)
const concurrentError = ref('')
const editing = ref(false)
const editFormData = ref({})
const errorsMap = ref({})
const submitting = ref(false)

const bookingId = computed(() => route.params.id ?? null)

/** Edit only when status is confirmed. */
const canEdit = computed(() => {
  const b = currentBooking.value
  const status = b?.status ?? b?.data?.status
  return status === 'confirmed'
})

/** Normalized { schema, uischema, data } when GET /api/bookings/:id returned FormResponse. */
const bookingForm = computed(() => normalizeBookingFormResponse(currentBooking.value ?? null))

/** Guest name for title/breadcrumb from FormResponse (data.guest) or flat Booking (guest). */
const guestDisplayName = computed(() => {
  const b = currentBooking.value
  if (!b) return ''
  const g = b.data?.guest ?? b.guest
  if (!g) return ''
  const first = g.firstName ?? g.first_name ?? ''
  const last = g.lastName ?? g.last_name ?? ''
  const parts = [first, last].filter(Boolean)
  return parts.length ? parts.join(' ') : (g.email ?? '')
})

const pageTitle = computed(() => {
  if (!currentBooking.value) return 'Booking'
  const name = guestDisplayName.value
  return name ? `Booking — ${name}` : 'Booking'
})

async function load() {
  const id = route.params.id
  if (!id) return
  store.clearCurrentBooking()
  loadError.value = ''
  notFound.value = false
  try {
    await store.fetchBooking(id)
  } catch (err) {
    if (err.response?.status === 404) {
      store.clearCurrentBooking()
      notFound.value = true
    } else {
      loadError.value = err.response?.data?.error || 'Failed to load booking.'
    }
  }
}

watch(editing, (isEdit) => {
  if (isEdit && bookingForm.value) {
    editFormData.value = JSON.parse(JSON.stringify(bookingForm.value.data ?? {}))
    if (!editFormData.value.guest) editFormData.value.guest = {}
    if (!editFormData.value.booking) editFormData.value.booking = { checkIn: '', checkOut: '', rooms: [] }
    if (!Array.isArray(editFormData.value.booking.rooms)) editFormData.value.booking.rooms = []
    errorsMap.value = {}
  }
})

watch(() => route.params.id, (newId) => {
  if (newId) load()
  editing.value = false
  concurrentError.value = ''
})

function startEdit() {
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  if (bookingForm.value) {
    editFormData.value = JSON.parse(JSON.stringify(bookingForm.value.data ?? {}))
    if (!editFormData.value.guest) editFormData.value.guest = {}
    if (!editFormData.value.booking) editFormData.value.booking = { checkIn: '', checkOut: '', rooms: [] }
    if (!Array.isArray(editFormData.value.booking.rooms)) editFormData.value.booking.rooms = []
  }
}

async function onSave() {
  if (!bookingId.value) return
  errorsMap.value = {}
  concurrentError.value = ''
  submitting.value = true
  try {
    await store.updateBooking(bookingId.value, editFormData.value)
    editing.value = false
  } catch (err) {
    if (err.response?.status === 409) {
      concurrentError.value = err.response?.data?.error ?? 'Booking was modified concurrently. Please retry.'
      await load()
    } else {
      const msg = err.response?.data?.error ?? 'Failed to save booking.'
      errorsMap.value = err.response?.data?.errors ?? { '': [msg] }
    }
  } finally {
    submitting.value = false
  }
}

watch(
  pageTitle,
  (title) => {
    if (title && currentBooking.value) {
      setBreadcrumb([{ label: 'Bookings', path: '/bookings' }, { label: title, path: null }])
    }
  },
  { immediate: true },
)

load()
</script>

<style scoped>
.error-message {
  color: var(--semantic-error);
  font-size: var(--text-body-size);
  margin: 0;
}

.inline-link {
  color: var(--brand-primary);
  margin-left: var(--space-xs);
}

.section-placeholder {
  color: var(--ink-tertiary);
  font-size: var(--text-body-size);
  margin: 0;
}

.loading-state {
  color: var(--ink-tertiary);
  font-size: var(--text-body-size);
}
</style>
