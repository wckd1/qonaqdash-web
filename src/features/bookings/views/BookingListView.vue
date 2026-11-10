<template>
  <header class="page-header">
    <h1>{{ t('nav.bookings') }}</h1>
    <router-link v-if="canCreateBookings" :to="{ name: 'booking-new' }" class="btn-add-outline">
      <svg
        class="btn-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      {{ t('bookings.new_booking') }}
    </router-link>
  </header>

  <SearchBar
    v-model="searchQuery"
    :placeholder="t('bookings.search_placeholder')"
    :aria-label="t('bookings.search_aria')"
    :searching="searching"
  />

  <section class="list-content">
    <div class="list-content__viewport">
      <p v-if="loadError" class="error-message">{{ loadError }}</p>
      <div v-else-if="initialLoading" class="loading-state">{{ t('common.loading') }}</div>
      <template v-else>
        <div v-if="!bookings.length && !searchQuery" class="empty-state-widget">
          <div class="empty-state-widget__icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h3 class="empty-state-widget__title">{{ t('bookings.empty_title') }}</h3>
          <p class="empty-state-widget__description">{{ t('bookings.empty_description') }}</p>
          <div class="empty-state-widget__actions">
            <router-link
              v-if="canCreateBookings"
              :to="{ name: 'booking-new' }"
              class="primary"
              role="button"
              >{{ t('bookings.new_booking') }}</router-link
            >
          </div>
        </div>
        <p v-else-if="!bookings.length && searchQuery" class="empty-state">
          {{ t('bookings.empty_search') }}
        </p>
        <table v-else-if="bookings.length" class="list-table" role="grid">
          <thead>
            <tr>
              <th scope="col">{{ t('fields.guest') }}</th>
              <th scope="col">{{ t('fields.check_in') }}</th>
              <th scope="col">{{ t('fields.check_out') }}</th>
              <th scope="col">{{ t('fields.status') }}</th>
              <th scope="col" class="list-table__col--actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="booking in bookings"
              :key="booking.id"
              class="list-row"
              :class="{ 'list-row--selected': selectedBookingId === booking.id }"
              @click="openPanel(booking)"
            >
              <td :data-label="t('fields.guest')">{{ bookingGuestName(booking) }}</td>
              <td :data-label="t('fields.check_in')">{{ formatDate(booking.stay?.check_in) }}</td>
              <td :data-label="t('fields.check_out')">{{ formatDate(booking.stay?.check_out) }}</td>
              <td :data-label="t('fields.status')">
                <BookingStatusBadge :status="booking.status" />
              </td>
              <td class="list-table__cell--actions">
                <router-link
                  :to="{ name: 'booking-detail', params: { id: booking.id } }"
                  class="list-table__action"
                  @click.stop
                >
                  {{ t('common.details') }}
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </div>
    <BookingSidePanel :booking="selectedBooking" @close="closePanel" />
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@pinia/colada'
import SearchBar from '@/shared/components/SearchBar.vue'
import BookingStatusBadge from '@/shared/components/BookingStatusBadge.vue'
import BookingSidePanel from '@/features/bookings/components/BookingSidePanel.vue'
import { bookingListQuery } from '@/features/bookings/queries'
import { useDebouncedRef } from '@/shared/composables/useDebouncedRef'
import type { BookingItem } from '@/features/bookings/api'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import { usePermissions } from '@/shared/composables/usePermissions'
import { useHotelTime } from '@/shared/composables/useHotelTime'
import { MEDIUM_DATE } from '@/shared/lib/moment'

const DEBOUNCE_MS = 300

const { t } = useI18n()
const { formatMoment } = useHotelTime()
const route = useRoute()
const router = useRouter()
const { canCreateBookings } = usePermissions()

const searchQuery = ref('')
const debouncedQuery = useDebouncedRef(searchQuery, DEBOUNCE_MS)
// Keep the current rows on screen while a new search loads.
const bookingsQuery = useQuery(() => ({
  ...bookingListQuery({ q: debouncedQuery.value }),
  placeholderData: (previous) => previous,
}))
const bookings = computed(() => bookingsQuery.data.value ?? [])
const initialLoading = computed(() => bookingsQuery.isPending.value)
const searching = computed(() => !initialLoading.value && bookingsQuery.isLoading.value)
const loadError = computed(() =>
  bookingsQuery.error.value
    ? formatUnknownApiError(bookingsQuery.error.value) || t('bookings.load_failed')
    : '',
)

const selectedBookingId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' && id ? id : null
})

const selectedBooking = computed(() => {
  const id = selectedBookingId.value
  if (!id) return null
  return bookings.value.find((b) => b.id === id) ?? { id }
})

type BookingPanelRow = BookingItem | { id: string; guest?: BookingItem['guest'] }

function bookingGuestName(booking: BookingPanelRow | null | undefined) {
  if (!booking) return '—'
  const g = booking.guest
  if (!g) return '—'
  const first = g.first_name ?? ''
  const last = g.last_name ?? ''
  const parts = [first, last].filter(Boolean)
  return parts.length ? parts.join(' ') : (g.email ?? '—')
}

function formatDate(iso: string | null | undefined) {
  return formatMoment(iso, MEDIUM_DATE) || '—'
}

function openPanel(booking: BookingItem) {
  const id = booking.id
  if (route.params.id) {
    router.replace({ name: 'bookings', params: { id } })
  } else {
    router.push({ name: 'bookings', params: { id } })
  }
}

function closePanel() {
  router.push('/bookings')
}
</script>
