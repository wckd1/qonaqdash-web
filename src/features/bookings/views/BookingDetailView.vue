<template>
  <header class="page-header">
    <h1>{{ pageTitle }}</h1>
    <div v-if="bookingId && bookingForm && !editing" class="page-header-actions">
      <button v-if="canEdit" type="button" class="btn-secondary" @click="startEdit">
        {{ t('common.edit') }}
      </button>
    </div>
    <div v-else-if="bookingId && bookingForm && editing" class="page-header-actions">
      <button type="button" :disabled="submitting" @click="onSave">
        {{ submitting ? t('common.saving') : t('common.save') }}
      </button>
      <button type="button" class="btn-secondary" :disabled="submitting" @click="cancelEdit">
        {{ t('common.cancel') }}
      </button>
    </div>
  </header>

  <BookingStatusActions
    v-if="bookingId && bookingForm && !editing"
    :booking-id="bookingId"
    :status="getBookingStatusFromResponse(currentBooking)"
    detail-inset
  />

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
import { ref, computed, watch, provide } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { formatDocumentTitle } from '@/shared/i18n/documentTitle'
import { useBookingStore } from '@/features/bookings/stores/useBookingStore'
import { fetchGuests } from '@/features/guests/api'
import { fetchAvailableRooms } from '@/features/property/api'
import {
  getBookingStatusFromResponse,
  bookingStatusAllowsEdit,
} from '@/features/bookings/bookingStatus'
import BookingStatusActions from '@/features/bookings/components/BookingStatusActions.vue'
import JsonFormView from '@/shared/jsonform/JsonFormView.vue'
import JsonFormEdit from '@/shared/jsonform/JsonFormEdit.vue'
import { normalizeBookingFormResponse } from '@/shared/jsonform/normalizeFormResponse'
import { formatApiError } from '@/shared/i18n/apiError'
import { bookingSchemaWithAvailableRoomIds } from '@/shared/jsonform/utils'
import { validateJsonFormData } from '@/shared/jsonform/validateJsonFormData'

provide('guestSearch', (q) => fetchGuests({ q }))

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
const availableRooms = ref([])

provide('availableRooms', availableRooms)

const bookingId = computed(() => route.params.id ?? null)

/** Edit when API allows PUT (confirmed or checked_in). */
const canEdit = computed(() => {
  const status = getBookingStatusFromResponse(currentBooking.value)
  return bookingStatusAllowsEdit(status)
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
      loadError.value = formatApiError(err.response?.data?.error) || t('bookings.detailLoadFailed')
    }
  }
}

watch(editing, (isEdit) => {
  if (isEdit && bookingForm.value) {
    editFormData.value = JSON.parse(JSON.stringify(bookingForm.value.data ?? {}))
    if (!editFormData.value.guest) editFormData.value.guest = {}
    if (editFormData.value.guest.id === undefined) editFormData.value.guest.id = null
    if (!editFormData.value.booking) editFormData.value.booking = { checkIn: '', checkOut: '', rooms: [] }
    if (!Array.isArray(editFormData.value.booking.rooms)) editFormData.value.booking.rooms = []
    errorsMap.value = {}
  }
})

watch(
  () =>
    editing.value
      ? [editFormData.value?.booking?.checkIn, editFormData.value?.booking?.checkOut]
      : [null, null],
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
      const id = typeof route.params.id === 'string' ? route.params.id : ''
      availableRooms.value = await fetchAvailableRooms(from, to, {
        excludeBookingId: id || undefined,
      })
    } catch {
      availableRooms.value = []
    }
  },
  { immediate: true },
)

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
    if (editFormData.value.guest.id === undefined) editFormData.value.guest.id = null
    if (!editFormData.value.booking) editFormData.value.booking = { checkIn: '', checkOut: '', rooms: [] }
    if (!Array.isArray(editFormData.value.booking.rooms)) editFormData.value.booking.rooms = []
  }
}

async function onSave() {
  if (!bookingId.value) return
  errorsMap.value = {}
  concurrentError.value = ''
  const forValidate = JSON.parse(JSON.stringify(editFormData.value))
  delete forValidate.status
  const schemaForValidate = bookingSchemaWithAvailableRoomIds(
    bookingForm.value?.schema ?? {},
    availableRooms.value,
    forValidate,
  )
  const { valid, errorsMap: clientErrors } = validateJsonFormData(schemaForValidate, forValidate)
  if (!valid) {
    errorsMap.value = clientErrors
    return
  }
  submitting.value = true
  try {
    const payload = JSON.parse(JSON.stringify(editFormData.value))
    delete payload.id
    delete payload.status
    await store.updateBooking(bookingId.value, payload)
    editing.value = false
  } catch (err) {
    if (err.response?.status === 409) {
      concurrentError.value =
        formatApiError(err.response?.data?.error) || t('bookings.concurrent')
      await load()
    } else {
      const msg = formatApiError(err.response?.data?.error) || t('bookings.saveFailed')
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
