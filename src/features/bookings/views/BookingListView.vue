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

  <BookingSidePanel :booking="selectedBooking" @close="closePanel" />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import SearchBar from '@/shared/components/SearchBar.vue'
import BookingStatusBadge from '@/shared/components/BookingStatusBadge.vue'
import BookingSidePanel from '@/features/bookings/components/BookingSidePanel.vue'
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
