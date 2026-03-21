<template>
  <header class="page-header">
    <h1>{{ pageTitle }}</h1>
    <button
      v-if="bookingId && bookingForm && canEdit && !editing"
      type="button"
      @click="startEdit"
    >
      {{ t('common.edit') }}
    </button>
    <div v-else-if="bookingId && bookingForm && editing" class="page-header-actions">
      <button type="button" :disabled="submitting" @click="onSave">
        {{ submitting ? t('common.saving') : t('common.save') }}
      </button>
      <button type="button" class="btn-secondary" :disabled="submitting" @click="cancelEdit">
        {{ t('common.cancel') }}
      </button>
    </div>
  </header>

  <p v-if="loadError" class="error-message">{{ loadError }}</p>
  <p v-else-if="notFound" class="error-message">
    {{ t('bookings.notFound') }}
    <router-link to="/bookings" class="inline-link">{{ t('bookings.backToList') }}</router-link>
  </p>
  <p v-else-if="concurrentError" class="error-message">
    {{ concurrentError }}
    <button type="button" @click="load">{{ t('common.retry') }}</button>
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
    <p v-else class="section-placeholder">{{ t('bookings.detailsLoading') }}</p>
  </template>
  <div v-else class="loading-state">{{ t('common.loading') }}</div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { formatDocumentTitle } from '@/shared/i18n/documentTitle'
import { useBookingStore } from '@/features/bookings/stores/useBookingStore'
import JsonFormView from '@/shared/jsonform/JsonFormView.vue'
import JsonFormEdit from '@/shared/jsonform/JsonFormEdit.vue'
import { normalizeBookingFormResponse } from '@/shared/jsonform/normalizeFormResponse'

const { t, locale } = useI18n()
const route = useRoute()
const store = useBookingStore()
const { currentBooking } = storeToRefs(store)
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

/** Title line from FormResponse (data.guest) or flat Booking (guest). */
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
  void locale.value
  if (!currentBooking.value) return t('pageTitle.booking')
  const name = guestDisplayName.value
  return name ? t('pageTitle.bookingWithGuest', { name }) : t('pageTitle.booking')
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
      loadError.value = err.response?.data?.error || t('bookings.detailLoadFailed')
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
      concurrentError.value = err.response?.data?.error ?? t('bookings.concurrent')
      await load()
    } else {
      const msg = err.response?.data?.error ?? t('bookings.saveFailed')
      errorsMap.value = err.response?.data?.errors ?? { '': [msg] }
    }
  } finally {
    submitting.value = false
  }
}

watch(
  [pageTitle, locale],
  () => {
    document.title = formatDocumentTitle(pageTitle.value)
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
