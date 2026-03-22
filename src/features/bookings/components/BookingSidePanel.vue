<template>
  <Transition name="slide-panel">
    <aside
      v-if="booking"
      class="booking-panel"
      aria-labelledby="booking-panel-title"
    >
      <div class="booking-panel-header">
        <h2 id="booking-panel-title">{{ bookingPanelTitle }}</h2>
        <button
          type="button"
          class="booking-panel-close"
          :aria-label="t('common.closePanel')"
          @click="emit('close')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <div class="booking-panel-body">
        <p v-if="loadError" class="error-message">{{ loadError }}</p>
        <p v-else-if="notFound" class="error-message">{{ t('bookings.notFound') }}</p>
        <div v-else-if="loading" class="loading-state">{{ t('common.loading') }}</div>
        <JsonFormView
          v-else-if="bookingForm"
          compact
          :schema="bookingForm.schema"
          :uischema="bookingForm.uischema"
          :data="bookingForm.data"
        />
        <p v-else class="section-placeholder">{{ t('bookings.detailsLoading') }}</p>
      </div>
      <div class="booking-panel-footer">
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

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import JsonFormView from '@/shared/jsonform/JsonFormView.vue'
import { normalizeBookingFormResponse } from '@/shared/jsonform/normalizeFormResponse'
import { fetchBooking } from '@/features/bookings/api'
import { formatApiError } from '@/shared/i18n/apiError'

const { t, locale } = useI18n()

const props = defineProps({
  /**
   * List or grid row: must include `id`. Other fields are optional (used for title until load completes).
   * @type {{ id: string, check_in?: string, check_out?: string, status?: string, guest?: { first_name?: string, last_name?: string, email?: string }, guest_name?: string } | null}
   */
  booking: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const detailEntity = ref(null)
const loading = ref(false)
const loadError = ref('')
const notFound = ref(false)

let loadSeq = 0

const bookingForm = computed(() => normalizeBookingFormResponse(detailEntity.value ?? null))

function bookingGuestNameFromList(b) {
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
    const g = raw.data?.guest ?? raw.guest
    if (g) {
      const first = g.firstName ?? g.first_name ?? ''
      const last = g.lastName ?? g.last_name ?? ''
      const parts = [first, last].filter(Boolean)
      const name = parts.length ? parts.join(' ') : (g.email ?? '')
      if (name) return t('pageTitle.bookingWithGuest', { name })
    }
  }
  const b = props.booking
  if (!b) return ''
  const name = bookingGuestNameFromList(b)
  return name ? t('pageTitle.bookingWithGuest', { name }) : t('pageTitle.booking')
})

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
      const entity = await fetchBooking(id)
      if (seq !== loadSeq) return
      detailEntity.value = entity
    } catch (err) {
      if (seq !== loadSeq) return
      if (err.response?.status === 404) {
        notFound.value = true
      } else {
        loadError.value = formatApiError(err.response?.data?.error) || t('bookings.detailLoadFailed')
      }
    } finally {
      if (seq === loadSeq) loading.value = false
    }
  },
  { immediate: true },
)
</script>
