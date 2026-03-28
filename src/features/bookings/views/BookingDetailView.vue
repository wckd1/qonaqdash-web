<template>
  <header class="page-header">
    <h1>{{ page_title }}</h1>
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

  <p v-if="loadError" class="error-message">{{ loadError }}</p>
  <p v-else-if="notFound" class="error-message">
    {{ t('bookings.not_found') }}
    <router-link to="/bookings" class="inline-link">{{ t('bookings.back_to_list') }}</router-link>
  </p>
  <p v-else-if="concurrentError" class="error-message">
    {{ concurrentError }}
    <button type="button" @click="load">{{ t('common.retry') }}</button>
  </p>
  <template v-else-if="currentBooking">
    <template v-if="bookingForm">
      <template v-if="!editing">
        <nav v-if="showTabs" class="subnav" :aria-label="t('bookings.detail_tabs_aria')">
          <button
            type="button"
            class="subnav__link"
            :class="{ 'subnav__link--active': activeTab === 'details' }"
            @click="activeTab = 'details'"
          >
            {{ t('bookings.tab_details') }}
          </button>
          <button
            type="button"
            class="subnav__link"
            :class="{ 'subnav__link--active': activeTab === 'folio' }"
            @click="activeTab = 'folio'"
          >
            {{ t('bookings.tab_folio') }}
          </button>
        </nav>

        <template v-if="activeTab === 'details'">
          <BookingStatusActions
            v-if="bookingId"
            :booking-id="bookingId"
            :status="getBookingStatusFromResponse(currentBooking)"
            detail-inset
          />
          <FormView :definition="bookingForm.definition" :data="bookingForm.data" />
          <AccommodationSummary
            v-if="currentBooking?.accommodation"
            :accommodation="currentBooking.accommodation"
            :currency="hotelCurrency"
            :room-type-names="roomTypeNames"
          />
        </template>

        <FolioSection
          v-if="activeTab === 'folio'"
          ref="folioRef"
          :booking-id="bookingId"
          :booking-status="getBookingStatusFromResponse(currentBooking)"
          :currency="hotelCurrency"
        />
      </template>
      <template v-else>
        <FormEdit
          :definition="bookingForm.definition"
          :data="editFormData"
          :errors-map="errorsMap"
          @update:data="editFormData = $event"
        />
        <QuoteBreakdown
          :quote="quote"
          :currency="hotelCurrency"
          :loading="quoteLoading"
          :error="quoteError"
          :room-type-names="roomTypeNames"
          @remove-manual-adjustment="removeManualAdjustment"
        >
          <template #actions>
            <ManualAdjustmentEditor
              v-if="quote"
              v-model="editManualAdjustments"
              :currency="hotelCurrency"
            />
          </template>
        </QuoteBreakdown>
      </template>
    </template>
    <p v-else class="section-placeholder">{{ t('bookings.details_loading') }}</p>
  </template>
  <div v-else class="loading-state">{{ t('common.loading') }}</div>
</template>

<script setup lang="ts">
import { ref, computed, watch, provide } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { formatDocumentTitle } from '@/shared/i18n/documentTitle'
import { useBookingStore } from '@/features/bookings/stores/useBookingStore'
import { usePropertyStore } from '@/features/property/stores/usePropertyStore'
import { fetchGuests } from '@/features/guests/api'
import { fetchAvailableRooms } from '@/features/property/api'
import type { Room } from '@/shared/types/property'
import {
  getBookingStatusFromResponse,
  bookingStatusAllowsEdit,
} from '@/features/bookings/bookingStatus'
import BookingStatusActions from '@/features/bookings/components/BookingStatusActions.vue'
import AccommodationSummary from '@/features/bookings/components/AccommodationSummary.vue'
import FolioSection from '@/features/billing/components/FolioSection.vue'
import FormView from '@/shared/form-dsl/FormView.vue'
import FormEdit from '@/shared/form-dsl/FormEdit.vue'
import QuoteBreakdown from '@/features/bookings/components/QuoteBreakdown.vue'
import ManualAdjustmentEditor from '@/features/bookings/components/ManualAdjustmentEditor.vue'
import type { ManualAdjustmentInput } from '@/shared/types/commercial'
import { normalizeBookingFormResponse } from '@/shared/form-dsl/normalizeFormResponse'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import { httpErrorData, httpErrorResponse } from '@/shared/unknownError'
import { validateFormData } from '@/shared/form-dsl/validateFormData'
import { scrollToFirstFormError } from '@/shared/form-dsl/scrollToFirstError'
import { useBookingQuote } from '@/features/bookings/composables/useBookingQuote'

import { guestSearchKey, availableRoomsKey } from '@/shared/injectKeys'
import type { BookingFormDataDraft, CreateBookingPayload } from '@/features/bookings/api'

provide(guestSearchKey, (q) => fetchGuests({ q }))

const { t, locale } = useI18n()
const route = useRoute()
const store = useBookingStore()
const propertyStore = usePropertyStore()
const { currentBooking } = storeToRefs(store)
const loadError = ref('')
const notFound = ref(false)
const concurrentError = ref('')
const editing = ref(false)
const editFormData = ref<BookingFormDataDraft>({})
const editManualAdjustments = ref<ManualAdjustmentInput[]>([])
const errorsMap = ref<Record<string, string[]>>({})
const submitting = ref(false)
const availableRooms = ref<Room[]>([])
const folioRef = ref<InstanceType<typeof FolioSection> | null>(null)
const activeTab = ref<'details' | 'folio'>('details')

const showTabs = computed(() => {
  const status = getBookingStatusFromResponse(currentBooking.value)
  return status === 'checked_in' || status === 'checked_out' || status === 'canceled'
})

provide(availableRoomsKey, availableRooms)

const editStayBranch = computed(() => {
  if (!editing.value) return null
  const raw = editFormData.value.stay
  if (!raw || typeof raw !== 'object') return null
  return raw as Record<string, unknown>
})

const hotelCurrency = computed(() => propertyStore.hotel?.currency ?? '')

function removeManualAdjustment(name: string) {
  editManualAdjustments.value = editManualAdjustments.value.filter((a) => a.name !== name)
}

const roomTypeNames = computed(() => {
  const map: Record<string, string> = {}
  for (const rt of propertyStore.roomTypes) map[rt.id] = rt.name
  return map
})

const editGuestId = computed(() => {
  if (!editing.value) return undefined
  const g = editFormData.value.guest as Record<string, unknown> | undefined
  const id = g?.id
  return typeof id === 'string' && id ? id : undefined
})

const { quote, quoteLoading, quoteError } = useBookingQuote(
  () => String(editStayBranch.value?.check_in ?? ''),
  () => String(editStayBranch.value?.check_out ?? ''),
  () => (Array.isArray(editStayBranch.value?.rooms) ? editStayBranch.value!.rooms : []),
  () => (editing.value ? editFormData.value : {}),
  editGuestId,
  () => (editing.value ? editManualAdjustments.value : []),
)

function routeParamId(): string | null {
  const id = route.params.id
  if (typeof id === 'string' && id) return id
  if (Array.isArray(id) && id[0]) return id[0]
  return null
}

const bookingId = computed(() => routeParamId())

/** Edit when API allows PUT (confirmed or checked_in). */
const canEdit = computed(() => {
  const status = getBookingStatusFromResponse(currentBooking.value)
  return bookingStatusAllowsEdit(status)
})

/** Merged runtime form + GET /api/bookings/:id `{ guest, stay }` data. */
const bookingForm = computed(() => normalizeBookingFormResponse(currentBooking.value ?? null))

/** Title line from FormResponse (data.guest) or flat Booking (guest). */
const guestDisplayName = computed(() => {
  const b = currentBooking.value as Record<string, unknown> | null
  if (!b) return ''
  const data = (b.data as Record<string, unknown> | undefined) ?? {}
  const flatGuest = b.guest as Record<string, unknown> | undefined
  const g = (data.guest as Record<string, unknown> | undefined) ?? flatGuest
  if (!g) return ''
  const first = (g.first_name ?? '') as string
  const last = (g.last_name ?? '') as string
  const parts = [first, last].filter(Boolean)
  const email = g.email
  return parts.length ? parts.join(' ') : ((typeof email === 'string' ? email : '') ?? '')
})

const page_title = computed(() => {
  void locale.value
  if (!currentBooking.value) return t('page_title.booking')
  const name = guestDisplayName.value
  return name ? t('page_title.booking_with_guest', { name }) : t('page_title.booking')
})

async function load() {
  const id = routeParamId()
  if (!id) return
  store.clearCurrentBooking()
  loadError.value = ''
  notFound.value = false
  propertyStore.fetchHotel()
  propertyStore.fetchRoomTypes()
  try {
    await store.fetchBooking(id, { formTarget: 'view' })
  } catch (err: unknown) {
    if (httpErrorResponse(err)?.status === 404) {
      store.clearCurrentBooking()
      notFound.value = true
    } else {
      loadError.value = formatUnknownApiError(err) || t('bookings.detail_load_failed')
    }
  }
}

watch(editing, (isEdit) => {
  if (isEdit && bookingForm.value) {
    editFormData.value = JSON.parse(
      JSON.stringify(bookingForm.value.data ?? {}),
    ) as BookingFormDataDraft
    if (!editFormData.value.guest) editFormData.value.guest = {}
    if (editFormData.value.guest.id === undefined) editFormData.value.guest.id = null
    if (!editFormData.value.stay)
      editFormData.value.stay = { check_in: '', check_out: '', rooms: [] }
    if (!Array.isArray(editFormData.value.stay.rooms)) editFormData.value.stay.rooms = []
    editManualAdjustments.value = currentBooking.value?.adjustments
      ? JSON.parse(JSON.stringify(currentBooking.value.adjustments))
      : []
    errorsMap.value = {}
  }
})

watch(
  () =>
    editing.value
      ? [editFormData.value?.stay?.check_in, editFormData.value?.stay?.check_out]
      : [null, null],
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

watch(
  () => route.params.id,
  (newId) => {
    if (newId) load()
    editing.value = false
    concurrentError.value = ''
    activeTab.value = route.query.tab === 'folio' ? 'folio' : 'details'
  },
  { immediate: true },
)

async function startEdit() {
  const id = bookingId.value
  if (!id) return
  await store.fetchBooking(id, { formTarget: 'edit' })
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  editManualAdjustments.value = []
  if (bookingForm.value) {
    editFormData.value = JSON.parse(
      JSON.stringify(bookingForm.value.data ?? {}),
    ) as BookingFormDataDraft
    if (!editFormData.value.guest) editFormData.value.guest = {}
    if (editFormData.value.guest.id === undefined) editFormData.value.guest.id = null
    if (!editFormData.value.stay)
      editFormData.value.stay = { check_in: '', check_out: '', rooms: [] }
    if (!Array.isArray(editFormData.value.stay.rooms)) editFormData.value.stay.rooms = []
  }
}

async function onSave() {
  if (!bookingId.value) return
  errorsMap.value = {}
  concurrentError.value = ''
  const forValidate = JSON.parse(JSON.stringify(editFormData.value))
  delete forValidate.status
  if (forValidate.stay && typeof forValidate.stay === 'object') {
    delete forValidate.stay.status
  }
  const { valid, errorsMap: clientErrors } = validateFormData(
    bookingForm.value?.definition,
    forValidate,
  )
  if (!valid) {
    errorsMap.value = clientErrors
    scrollToFirstFormError()
    return
  }
  submitting.value = true
  try {
    const payload = JSON.parse(JSON.stringify(editFormData.value))
    delete payload.id
    delete payload.status
    if (payload.stay && typeof payload.stay === 'object') {
      delete payload.stay.status
    }
    if (editManualAdjustments.value.length) {
      payload.adjustments = JSON.parse(JSON.stringify(editManualAdjustments.value))
    }
    await store.updateBooking(bookingId.value, payload as CreateBookingPayload)
    editing.value = false
  } catch (err: unknown) {
    if (httpErrorResponse(err)?.status === 409) {
      concurrentError.value = formatUnknownApiError(err) || t('bookings.concurrent')
      await load()
    } else {
      const msg = formatUnknownApiError(err) || t('bookings.save_failed')
      const serverErrors = httpErrorData(err)?.errors
      errorsMap.value =
        serverErrors && typeof serverErrors === 'object'
          ? (serverErrors as Record<string, string[]>)
          : { '': [msg] }
    }
  } finally {
    submitting.value = false
  }
}

watch(
  [page_title, locale],
  () => {
    document.title = formatDocumentTitle(page_title.value)
  },
  { immediate: true },
)
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
