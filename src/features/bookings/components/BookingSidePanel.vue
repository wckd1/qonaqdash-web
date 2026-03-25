<template>
  <Transition name="slide-panel">
    <aside
      v-if="booking"
      class="side-panel"
      aria-labelledby="side-panel-title"
    >
      <div class="side-panel-header">
        <h2 id="side-panel-title">{{ bookingPanelTitle }}</h2>
        <button
          type="button"
          class="side-panel-close"
          :aria-label="t('common.closePanel')"
          @click="emit('close')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <BookingStatusActions
        v-if="panelStatusActionsVisible"
        :booking-id="booking!.id"
        :status="panelBookingStatus"
        @updated="onBookingStatusMutation"
      />
      <div class="side-panel-body">
        <p v-if="loadError" class="error-message">{{ loadError }}</p>
        <p v-else-if="notFound" class="error-message">{{ t('bookings.notFound') }}</p>
        <div v-else-if="loading" class="loading-state">{{ t('common.loading') }}</div>
        <FormView
          v-else-if="bookingForm"
          compact
          :definition="bookingForm.definition"
          :data="bookingForm.data"
        />
        <p v-else class="section-placeholder">{{ t('bookings.detailsLoading') }}</p>
      </div>
      <div class="side-panel-footer">
        <router-link
          :to="{ name: 'booking-detail', params: { id: booking.id } }"
          class="btn-open-full-page"
        >
          {{ t('common.openFullPage') }}
        </router-link>
      </div>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import FormView from '@/shared/form-dsl/FormView.vue'
import { normalizeBookingFormResponse } from '@/shared/form-dsl/normalizeFormResponse'
import { fetchBookingWithRuntimeForm, type BookingFormResponse } from '@/features/bookings/api'
import type { BookingSidePanelRef } from '@/features/bookings/panelTypes'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import { httpErrorResponse } from '@/shared/unknownError'
import { getBookingStatusFromResponse } from '@/features/bookings/bookingStatus'
import BookingStatusActions from '@/features/bookings/components/BookingStatusActions.vue'

const { t, locale } = useI18n()

const props = withDefaults(
  defineProps<{
    /** List or grid row: must include `id`. Other fields optional until load completes. */
    booking: BookingSidePanelRef | null
  }>(),
  { booking: null },
)

const emit = defineEmits<{
  close: []
  'booking-updated': []
}>()

const detailEntity = ref<BookingFormResponse | null>(null)
const loading = ref(false)
const loadError = ref('')
const notFound = ref(false)

let loadSeq = 0

const bookingForm = computed(() => normalizeBookingFormResponse(detailEntity.value ?? null))

const panelBookingStatus = computed(
  () => getBookingStatusFromResponse(detailEntity.value) ?? props.booking?.status,
)

const panelStatusActionsVisible = computed(
  () =>
    !!props.booking?.id &&
    !loading.value &&
    !loadError.value &&
    !notFound.value &&
    !!bookingForm.value,
)

function bookingGuestNameFromList(b: BookingSidePanelRef | null | undefined) {
  if (!b) return ''
  if (b.guest_name) return b.guest_name
  const g = b.guest
  if (!g) return ''
  const first = g.first_name ?? ''
  const last = g.last_name ?? ''
  const parts = [first, last].filter(Boolean)
  return parts.length ? parts.join(' ') : (g.email ?? '')
}

const bookingPanelTitle = computed(() => {
  void locale.value
  const raw = detailEntity.value
  if (raw) {
    const data = (raw.data as Record<string, unknown> | undefined) ?? {}
    const flatGuest = raw.guest as Record<string, unknown> | undefined
    const g = (data.guest as Record<string, unknown> | undefined) ?? flatGuest
    if (g) {
      const first = (g.firstName ?? g.first_name ?? '') as string
      const last = (g.lastName ?? g.last_name ?? '') as string
      const parts = [first, last].filter(Boolean)
      const email = g.email
      const name = parts.length ? parts.join(' ') : (typeof email === 'string' ? email : '')
      if (name) return t('pageTitle.bookingWithGuest', { name })
    }
  }
  const b = props.booking
  if (!b) return ''
  const name = bookingGuestNameFromList(b)
  return name ? t('pageTitle.bookingWithGuest', { name }) : t('pageTitle.booking')
})

async function onBookingStatusMutation() {
  const id = props.booking?.id
  if (!id) return
  const seq = loadSeq
  try {
    const entity = await fetchBookingWithRuntimeForm(id, 'view')
    if (seq !== loadSeq) return
    detailEntity.value = entity
    emit('booking-updated')
  } catch (err: unknown) {
    if (seq !== loadSeq) return
    loadError.value = formatUnknownApiError(err) || t('bookings.detailLoadFailed')
  }
}

watch(
  () => props.booking?.id,
  async (id) => {
    if (!id) {
      detailEntity.value = null
      loadError.value = ''
      notFound.value = false
      loading.value = false
      return
    }
    const seq = ++loadSeq
    loading.value = true
    loadError.value = ''
    notFound.value = false
    detailEntity.value = null
    try {
      const entity = await fetchBookingWithRuntimeForm(id, 'view')
      if (seq !== loadSeq) return
      detailEntity.value = entity
    } catch (err: unknown) {
      if (seq !== loadSeq) return
      if (httpErrorResponse(err)?.status === 404) {
        notFound.value = true
      } else {
        loadError.value = formatUnknownApiError(err) || t('bookings.detailLoadFailed')
      }
    } finally {
      if (seq === loadSeq) loading.value = false
    }
  },
  { immediate: true },
)
</script>
