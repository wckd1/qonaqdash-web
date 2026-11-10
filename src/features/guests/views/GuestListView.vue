<template>
  <header class="page-header">
    <h1>{{ t('nav.guests') }}</h1>
    <router-link v-if="canCreateGuests" :to="{ name: 'guest-new' }" class="btn-add-outline">
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
      {{ t('guests.new_guest') }}
    </router-link>
  </header>

  <SearchBar
    v-model="searchQuery"
    :placeholder="t('guests.search_placeholder')"
    :aria-label="t('guests.search_aria')"
    :searching="searching"
  />

  <section class="list-content">
    <div class="list-content__viewport">
      <p v-if="loadError" class="error-message">{{ loadError }}</p>
      <div v-else-if="initialLoading" class="loading-state">{{ t('common.loading') }}</div>
      <template v-else>
        <div v-if="!guests.length && !searchQuery" class="empty-state-widget">
          <div class="empty-state-widget__icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3 class="empty-state-widget__title">{{ t('guests.empty_title') }}</h3>
          <p class="empty-state-widget__description">{{ t('guests.empty_description') }}</p>
          <div class="empty-state-widget__actions">
            <router-link
              v-if="canCreateGuests"
              :to="{ name: 'guest-new' }"
              class="primary"
              role="button"
              >{{ t('guests.new_guest') }}</router-link
            >
            <router-link
              v-if="canCreateBookings"
              :to="{ name: 'booking-new' }"
              class="btn-secondary"
              role="button"
              >{{ t('guests.empty_new_booking') }}</router-link
            >
          </div>
        </div>
        <p v-else-if="!guests.length && searchQuery" class="empty-state">
          {{ t('guests.empty_search') }}
        </p>
        <table v-else-if="guests.length" class="list-table" role="grid">
          <thead>
            <tr>
              <th scope="col">{{ t('fields.first_name') }}</th>
              <th scope="col">{{ t('fields.last_name') }}</th>
              <th scope="col">{{ t('fields.email') }}</th>
              <th scope="col">{{ t('fields.phone') }}</th>
              <th scope="col" class="col-status"></th>
              <th scope="col" class="list-table__col--actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="guest in guests"
              :key="guest.id"
              class="list-row"
              :class="{ 'list-row--selected': selectedGuestId === guest.id }"
              @click="openPanel(guest)"
            >
              <td :data-label="t('fields.first_name')">{{ guest.first_name ?? '—' }}</td>
              <td :data-label="t('fields.last_name')">{{ guest.last_name ?? '—' }}</td>
              <td :data-label="t('fields.email')">{{ guest.email ?? '—' }}</td>
              <td :data-label="t('fields.phone')">{{ guest.phone ?? '—' }}</td>
              <td class="col-status">
                <span
                  v-if="guest.blocked"
                  class="status-chip status-chip--blocked"
                  :aria-label="t('guests.blocked_badge_aria')"
                  >{{ t('guests.blocked_badge') }}</span
                >
              </td>
              <td class="list-table__cell--actions">
                <router-link
                  :to="{ name: 'guest-detail', params: { id: guest.id } }"
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
    <GuestSidePanel :guest="selectedGuest" @close="closePanel" />
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@pinia/colada'
import SearchBar from '@/shared/components/SearchBar.vue'
import GuestSidePanel from '@/features/guests/components/GuestSidePanel.vue'
import { guestListQuery } from '@/features/guests/queries'
import { useDebouncedRef } from '@/shared/composables/useDebouncedRef'
import type { Guest } from '@/features/guests/api'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import { usePermissions } from '@/shared/composables/usePermissions'

const DEBOUNCE_MS = 300

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { canCreateGuests, canCreateBookings } = usePermissions()

const searchQuery = ref('')
const debouncedQuery = useDebouncedRef(searchQuery, DEBOUNCE_MS)
// Keep the current rows on screen while a new search loads.
const guestsQuery = useQuery(() => ({
  ...guestListQuery(debouncedQuery.value),
  placeholderData: (previous) => previous,
}))
const guests = computed(() => guestsQuery.data.value ?? [])
const initialLoading = computed(() => guestsQuery.isPending.value)
const searching = computed(() => !initialLoading.value && guestsQuery.isLoading.value)
const loadError = computed(() =>
  guestsQuery.error.value
    ? formatUnknownApiError(guestsQuery.error.value) || t('guests.load_failed')
    : '',
)

const selectedGuestId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' && id ? id : null
})

/** Minimal row or `{ id }` when deep-linking before list row is present */
const selectedGuest = computed(() => {
  const id = selectedGuestId.value
  if (!id) return null
  return guests.value.find((g) => g.id === id) ?? { id }
})

function openPanel(guest: Guest) {
  const id = guest.id
  if (route.params.id) {
    router.replace({ name: 'guests', params: { id } })
  } else {
    router.push({ name: 'guests', params: { id } })
  }
}

function closePanel() {
  router.push('/guests')
}
</script>
