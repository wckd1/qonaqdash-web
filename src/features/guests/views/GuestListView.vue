<template>
  <header class="page-header">
    <h1>{{ t('nav.guests') }}</h1>
    <router-link :to="{ name: 'guest-new' }" class="btn-add-outline">
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      {{ t('guests.newGuest') }}
    </router-link>
  </header>

  <SearchBar
    v-model="searchQuery"
    :placeholder="t('guests.searchPlaceholder')"
    :aria-label="t('guests.searchAria')"
    :searching="searching"
  />

  <section class="list-content">
    <div class="list-content__viewport">
      <p v-if="loadError" class="error-message">{{ loadError }}</p>
      <div v-else-if="initialLoading" class="loading-state">{{ t('common.loading') }}</div>
      <template v-else>
        <p v-if="!guests.length && !searchQuery" class="empty-state">{{ t('guests.empty') }}</p>
        <p v-else-if="!guests.length && searchQuery" class="empty-state">{{ t('guests.emptySearch') }}</p>
        <table v-else-if="guests.length" class="list-table" role="grid">
            <thead>
              <tr>
                <th scope="col">{{ t('fields.firstName') }}</th>
                <th scope="col">{{ t('fields.lastName') }}</th>
                <th scope="col">{{ t('fields.email') }}</th>
                <th scope="col">{{ t('fields.phone') }}</th>
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
                <td :data-label="t('fields.firstName')">{{ guest.first_name ?? '—' }}</td>
                <td :data-label="t('fields.lastName')">{{ guest.last_name ?? '—' }}</td>
                <td :data-label="t('fields.email')">{{ guest.email ?? '—' }}</td>
                <td :data-label="t('fields.phone')">{{ guest.phone ?? '—' }}</td>
              </tr>
            </tbody>
        </table>
      </template>
    </div>
    <GuestSidePanel :guest="selectedGuest" @close="closePanel" />
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import SearchBar from '@/shared/components/SearchBar.vue'
import GuestSidePanel from '@/features/guests/components/GuestSidePanel.vue'
import { useGuestStore } from '@/features/guests/stores/useGuestStore'
import { formatApiError } from '@/shared/i18n/apiError'

const DEBOUNCE_MS = 300

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useGuestStore()
const { guests } = storeToRefs(store)

const initialLoading = ref(true)
const searching = ref(false)
const loadError = ref('')
const searchQuery = ref('')
let searchDebounceId = null

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

function openPanel(guest) {
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

/**
 * @param {{ q?: string }} [params]
 * @param {boolean} [isInitial] - If true, show full-page "Loading…"; otherwise keep search bar and table visible (no focus loss).
 */
async function load(params = {}, isInitial = false) {
  loadError.value = ''
  if (isInitial) {
    initialLoading.value = true
  } else {
    searching.value = true
  }
  try {
    await store.fetchGuests(params)
  } catch (err) {
    loadError.value = formatApiError(err.response?.data?.error) || t('guests.loadFailed')
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
