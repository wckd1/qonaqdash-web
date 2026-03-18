<template>
  <div class="booking-detail-view">
    <header class="page-header">
      <h1 class="page-title">{{ pageTitle }}</h1>
    </header>

    <p v-if="loadError" class="error-message">{{ loadError }}</p>
    <p v-if="concurrencyMessage" class="form-error">{{ concurrencyMessage }}</p>
    <p v-else-if="notFound" class="error-message">
      Booking not found.
      <router-link to="/bookings" class="inline-link">Back to bookings</router-link>
    </p>
    <template v-else-if="currentBooking">
      <section class="detail-section" aria-labelledby="detail-heading">
        <h2 id="detail-heading" class="section-title">Details</h2>
        <dl class="booking-dl">
          <dt>Guest</dt>
          <dd>{{ guestDisplayName }}</dd>
          <dt>Check-in</dt>
          <dd>{{ formatDate(currentBooking.check_in) }}</dd>
          <dt>Check-out</dt>
          <dd>{{ formatDate(currentBooking.check_out) }}</dd>
          <dt>Status</dt>
          <dd>
            <BookingStatusBadge :status="currentBooking.status" />
          </dd>
          <dt v-if="roomsSummary">Rooms</dt>
          <dd v-if="roomsSummary">{{ roomsSummary }}</dd>
        </dl>
      </section>

      <div v-if="hasActions" class="detail-actions">
        <template v-if="currentBooking.status === 'confirmed'">
          <button type="button" class="btn-action" @click="doCheckIn">
            Check In
          </button>
          <button type="button" class="btn-action btn-action--danger" @click="doCancel">
            Cancel
          </button>
          <span class="btn-action btn-action--secondary btn-action--disabled" title="Edit form in P5">Edit</span>
        </template>
        <button
          v-else-if="currentBooking.status === 'checked_in'"
          type="button"
          class="btn-action"
          @click="doCheckOut"
        >
          Check Out
        </button>
      </div>
    </template>
    <div v-else class="loading-state">Loading…</div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useBookingStore } from '@/features/bookings/stores/useBookingStore'
import { useBreadcrumb } from '@/shared/composables/useBreadcrumb'
import BookingStatusBadge from '@/shared/components/BookingStatusBadge.vue'

const route = useRoute()
const store = useBookingStore()
const { currentBooking } = storeToRefs(store)
const { setItems: setBreadcrumb } = useBreadcrumb()

const loadError = ref('')
const notFound = ref(false)
const concurrencyMessage = ref('')

const pageTitle = computed(() => {
  const b = currentBooking.value
  if (!b) return 'Booking'
  const name = guestDisplayName.value
  return name ? `Booking — ${name}` : 'Booking'
})

const guestDisplayName = computed(() => {
  const b = currentBooking.value
  if (!b || !b.guest) return '—'
  const g = b.guest
  const first = g.first_name ?? ''
  const last = g.last_name ?? ''
  const parts = [first, last].filter(Boolean)
  return parts.length ? parts.join(' ') : (g.email ?? '—')
})

const roomsSummary = computed(() => {
  const b = currentBooking.value
  if (!b || !b.rooms || !b.rooms.length) return ''
  return b.rooms
    .map((r) => r.room_type_name && r.room_number ? `${r.room_type_name} (${r.room_number})` : r.room_type_name || r.room_number || '—')
    .join(', ')
})

const hasActions = computed(() => {
  const s = currentBooking.value?.status
  return s === 'confirmed' || s === 'checked_in'
})

function formatDate(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { dateStyle: 'medium' })
  } catch {
    return iso
  }
}

function clearConcurrencyMessage() {
  concurrencyMessage.value = ''
}

async function load() {
  const id = route.params.id
  if (!id) return
  store.clearCurrentBooking()
  loadError.value = ''
  notFound.value = false
  concurrencyMessage.value = ''
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

async function doCheckIn() {
  clearConcurrencyMessage()
  try {
    await store.checkIn(route.params.id)
  } catch (err) {
    if (err.response?.status === 409) {
      await load()
      concurrencyMessage.value = err.response?.data?.error || 'Booking was modified elsewhere. Please retry your action.'
    } else {
      loadError.value = err.response?.data?.error || 'Failed to check in.'
    }
  }
}

async function doCheckOut() {
  clearConcurrencyMessage()
  try {
    await store.checkOut(route.params.id)
  } catch (err) {
    if (err.response?.status === 409) {
      await load()
      concurrencyMessage.value = err.response?.data?.error || 'Booking was modified elsewhere. Please retry your action.'
    } else {
      loadError.value = err.response?.data?.error || 'Failed to check out.'
    }
  }
}

async function doCancel() {
  clearConcurrencyMessage()
  try {
    await store.cancel(route.params.id)
  } catch (err) {
    if (err.response?.status === 409) {
      await load()
      concurrencyMessage.value = err.response?.data?.error || 'Booking was modified elsewhere. Please retry your action.'
    } else {
      loadError.value = err.response?.data?.error || 'Failed to cancel.'
    }
  }
}

watch(() => route.params.id, (newId) => {
  if (newId) load()
})

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
.booking-detail-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.page-header {
  margin: 0;
}

.page-title {
  font-family: var(--font-display);
  font-size: var(--text-heading-size);
  font-weight: var(--text-heading-weight);
  letter-spacing: var(--text-heading-tracking);
  color: var(--ink-primary);
  margin: 0;
}

.error-message {
  color: var(--semantic-error);
  font-size: var(--text-body-size);
  margin: 0;
}

.inline-link {
  color: var(--brand-primary);
  margin-left: var(--space-xs);
}

.detail-section {
  background: var(--surface-1);
  border-radius: var(--content-area-radius);
  padding: var(--content-area-padding);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
}

.section-title {
  font-family: var(--font-display);
  font-size: var(--text-heading-size);
  font-weight: var(--text-heading-weight);
  color: var(--ink-primary);
  margin: 0 0 var(--space-md) 0;
}

.booking-dl {
  margin: 0;
  font-size: var(--text-body-size);
}

.booking-dl dt {
  font-weight: var(--text-label-weight);
  color: var(--ink-tertiary);
  margin-top: var(--space-sm);
  margin-bottom: var(--space-micro);
}

.booking-dl dt:first-child {
  margin-top: 0;
}

.booking-dl dd {
  margin: 0;
  color: var(--ink-primary);
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.btn-action {
  padding: var(--space-xs) var(--space-md);
  font-size: var(--text-label-size);
  font-weight: var(--text-label-weight);
  color: var(--brand-primary);
  background: transparent;
  border: 1px solid var(--brand-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
}

.btn-action:hover {
  background: var(--semantic-info-bg);
  color: var(--brand-primary-hover);
}

.btn-action--secondary {
  color: var(--ink-secondary);
  border-color: var(--border-subtle);
}

.btn-action--secondary:hover {
  background: var(--surface-2);
  color: var(--ink-primary);
}

.btn-action--danger {
  color: var(--status-canceled);
  border-color: var(--status-canceled);
}

.btn-action--danger:hover {
  background: var(--semantic-error-bg);
}

.btn-action--disabled {
  cursor: default;
  opacity: 0.7;
}

.btn-action--disabled:hover {
  background: transparent;
  color: inherit;
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
