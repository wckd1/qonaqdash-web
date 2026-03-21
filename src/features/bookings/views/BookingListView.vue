<template>
  <header class="page-header">
    <h1>{{ t('nav.bookings') }}</h1>
    <router-link :to="{ name: 'booking-new' }" class="btn-add-outline">
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      {{ t('bookings.newBooking') }}
    </router-link>
  </header>

  <SearchBar
    v-model="searchQuery"
    :placeholder="t('bookings.searchPlaceholder')"
    :aria-label="t('bookings.searchAria')"
    :searching="searching"
  />

  <section class="list-content">
    <div class="list-content__viewport">
      <p v-if="loadError" class="error-message">{{ loadError }}</p>
      <div v-else-if="initialLoading" class="loading-state">{{ t('common.loading') }}</div>
      <template v-else>
        <p v-if="!bookings.length && !searchQuery" class="empty-state">{{ t('bookings.empty') }}</p>
        <p v-else-if="!bookings.length && searchQuery" class="empty-state">{{ t('bookings.emptySearch') }}</p>
        <table v-else-if="bookings.length" class="list-table" role="grid">
            <thead>
              <tr>
                <th scope="col">{{ t('fields.guest') }}</th>
                <th scope="col">{{ t('fields.checkIn') }}</th>
                <th scope="col">{{ t('fields.checkOut') }}</th>
                <th scope="col">{{ t('fields.status') }}</th>
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
                <td :data-label="t('fields.guest')">{{ bookingGuestName(booking) }}</td>
                <td :data-label="t('fields.checkIn')">{{ formatDate(booking.check_in) }}</td>
                <td :data-label="t('fields.checkOut')">{{ formatDate(booking.check_out) }}</td>
                <td :data-label="t('fields.status')">
                  <BookingStatusBadge :status="booking.status" />
                </td>
              </tr>
            </tbody>
        </table>
      </template>
    </div>
    <BookingSidePanel :booking="selectedBooking" @close="closePanel" />
  </section>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import SearchBar from '@/shared/components/SearchBar.vue'
import BookingStatusBadge from '@/shared/components/BookingStatusBadge.vue'
import BookingSidePanel from '@/features/bookings/components/BookingSidePanel.vue'
import { useBookingStore } from '@/features/bookings/stores/useBookingStore'

const DEBOUNCE_MS = 300

const { t } = useI18n()
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
    loadError.value = err.response?.data?.error || t('bookings.loadFailed')
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
