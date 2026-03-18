<template>
  <header class="page-header">
    <h1>Bookings</h1>
    <router-link :to="{ name: 'booking-new' }" class="btn-add-booking">
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      New booking
    </router-link>
  </header>

  <SearchBar
    v-model="searchQuery"
    placeholder="Search by guest name…"
    aria-label="Search by guest"
    :searching="searching"
  />

  <section class="list-content">
    <p v-if="loadError" class="error-message">{{ loadError }}</p>
    <div v-else-if="initialLoading" class="loading-state">Loading…</div>
    <template v-else>
      <p v-if="!bookings.length && !searchQuery" class="empty-state">No bookings yet.</p>
      <p v-else-if="!bookings.length && searchQuery" class="empty-state">No bookings match your search.</p>
      <div v-else-if="bookings.length" class="booking-table-wrap">
        <table class="booking-table" role="grid">
          <thead>
            <tr>
              <th scope="col">Guest</th>
              <th scope="col">Check-in</th>
              <th scope="col">Check-out</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="booking in bookings"
              :key="booking.id"
              class="booking-row"
              :class="{ 'booking-row--selected': selectedBooking?.id === booking.id }"
              @click="openPanel(booking)"
            >
              <td data-label="Guest">{{ bookingGuestName(booking) }}</td>
              <td data-label="Check-in">{{ formatDate(booking.check_in) }}</td>
              <td data-label="Check-out">{{ formatDate(booking.check_out) }}</td>
              <td data-label="Status">
                <BookingStatusBadge :status="booking.status" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>

  <Transition name="slide-panel">
    <aside
      v-if="selectedBooking"
      class="booking-panel"
      role="dialog"
      aria-labelledby="booking-panel-title"
    >
      <div class="booking-panel-header">
        <h2 id="booking-panel-title">{{ bookingPanelTitle }}</h2>
        <button
          type="button"
          class="booking-panel-close"
          aria-label="Close panel"
          @click="closePanel"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <div class="booking-panel-body">
        <dl class="booking-panel-dl">
          <dt>Guest</dt>
          <dd>{{ bookingGuestName(selectedBooking) }}</dd>
          <dt>Check-in</dt>
          <dd>{{ formatDate(selectedBooking.check_in) }}</dd>
          <dt>Check-out</dt>
          <dd>{{ formatDate(selectedBooking.check_out) }}</dd>
          <dt>Status</dt>
          <dd>
            <BookingStatusBadge :status="selectedBooking.status" />
          </dd>
        </dl>
      </div>
      <div class="booking-panel-footer">
        <router-link
          :to="{ name: 'booking-detail', params: { id: selectedBooking.id } }"
          class="btn-open-full-page"
          @click="closePanel"
        >
          Open Full Page
        </router-link>
      </div>
    </aside>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import SearchBar from '@/shared/components/SearchBar.vue'
import BookingStatusBadge from '@/shared/components/BookingStatusBadge.vue'
import { useBookingStore } from '@/features/bookings/stores/useBookingStore'

const DEBOUNCE_MS = 300

const store = useBookingStore()
const { bookings } = storeToRefs(store)

const initialLoading = ref(true)
const searching = ref(false)
const loadError = ref('')
const searchQuery = ref('')
const selectedBooking = ref(null)
let searchDebounceId = null

const bookingPanelTitle = computed(() => {
  if (!selectedBooking.value) return ''
  const name = bookingGuestName(selectedBooking.value)
  return name ? `Booking — ${name}` : 'Booking'
})

function bookingGuestName(booking) {
  if (!booking) return '—'
  if (booking.guest_name) return booking.guest_name
  const g = booking.guest
  if (!g) return '—'
  const first = g.first_name ?? ''
  const last = g.last_name ?? ''
  const parts = [first, last].filter(Boolean)
  return parts.length ? parts.join(' ') : (g.email ?? '—')
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
  } catch {
    return iso
  }
}

function openPanel(booking) {
  selectedBooking.value = booking
}

function closePanel() {
  selectedBooking.value = null
}

/**
 * @param {{ q?: string }} [params]
 * @param {boolean} [isInitial]
 */
async function load(params = {}, isInitial = false) {
  loadError.value = ''
  if (isInitial) {
    initialLoading.value = true
  } else {
    searching.value = true
  }
  try {
    await store.fetchBookings(params)
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Failed to load bookings.'
  } finally {
    initialLoading.value = false
    searching.value = false
  }
}

watch(searchQuery, (q) => {
  if (searchDebounceId) clearTimeout(searchDebounceId)
  searchDebounceId = setTimeout(() => {
    searchDebounceId = null
    load(q ? { q } : {})
  }, DEBOUNCE_MS)
})

onMounted(() => load({}, true))
</script>

<style scoped>
.booking-panel {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 60%;
  min-width: 280px;
  max-width: 720px;
  background: var(--surface-1);
  border-left: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  min-height: 0;
  box-shadow: -4px 0 20px rgba(30, 41, 59, 0.12);
  z-index: 10;
}

.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: transform 0.25s ease;
}

.slide-panel-enter-from,
.slide-panel-leave-to {
  transform: translateX(100%);
}

.slide-panel-enter-to,
.slide-panel-leave-from {
  transform: translateX(0);
}

.booking-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--border-subtle);
}

.booking-panel-close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--ink-tertiary);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}

.booking-panel-close:hover {
  color: var(--ink-primary);
  background: var(--surface-2);
}

.booking-panel-close svg {
  width: 18px;
  height: 18px;
}

.booking-panel-body {
  flex: 1;
  min-height: 0;
  padding: var(--space-lg);
  overflow-y: auto;
}

.booking-panel-dl {
  margin: 0;
  font-size: var(--text-body-size);
}

.booking-panel-dl dt {
  font-weight: var(--text-label-weight);
  color: var(--ink-tertiary);
  margin-top: var(--space-sm);
  margin-bottom: var(--space-micro);
}

.booking-panel-dl dt:first-child {
  margin-top: 0;
}

.booking-panel-dl dd {
  margin: 0;
  color: var(--ink-primary);
}

.booking-panel-footer {
  flex-shrink: 0;
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
}

.btn-open-full-page {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xs) var(--space-md);
  font-size: var(--text-label-size);
  font-weight: var(--text-label-weight);
  color: var(--brand-primary);
  background: transparent;
  border: 1px solid var(--brand-primary);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
}

.btn-open-full-page:hover {
  background: var(--semantic-info-bg);
  color: var(--brand-primary-hover);
}

.btn-add-booking {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--text-label-size);
  font-weight: var(--text-label-weight);
  color: var(--brand-primary);
  background: transparent;
  border: 1px solid var(--brand-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  text-decoration: none;
}

.btn-add-booking:hover {
  background: var(--semantic-info-bg);
  color: var(--brand-primary-hover);
}

.btn-icon {
  width: 14px;
  height: 14px;
}

.error-message {
  color: var(--semantic-error);
  font-size: var(--text-body-size);
  margin: 0;
}

.loading-state,
.empty-state {
  color: var(--ink-tertiary);
  font-size: var(--text-body-size);
  margin: 0;
}

.booking-table-wrap {
  overflow: hidden;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  background: var(--surface-1);
}

.booking-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-body-size);
}

.booking-table thead {
  background: var(--surface-2);
}

.booking-table th {
  text-align: left;
  font-size: var(--text-label-size);
  font-weight: var(--text-label-weight);
  color: var(--ink-secondary);
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--border-subtle);
}

.booking-table td {
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--border-subtle);
  color: var(--ink-primary);
}

.booking-table tbody tr:last-child td {
  border-bottom: none;
}

.booking-row {
  cursor: pointer;
  transition: background 0.12s ease;
}

.booking-row:hover {
  background: var(--surface-2);
}

.booking-row--selected {
  background: var(--semantic-info-bg);
}

.booking-row--selected:hover {
  background: var(--semantic-info-bg);
}
</style>
