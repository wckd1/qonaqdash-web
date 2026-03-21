<template>
  <header class="page-header">
    <h1>{{ t('nav.guests') }}</h1>
    <router-link :to="{ name: 'guest-new' }" class="btn-add-guest">
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
    <p v-if="loadError" class="error-message">{{ loadError }}</p>
      <div v-else-if="initialLoading" class="loading-state">{{ t('common.loading') }}</div>
      <template v-else>
        <p v-if="!guests.length && !searchQuery" class="empty-state">{{ t('guests.empty') }}</p>
        <p v-else-if="!guests.length && searchQuery" class="empty-state">{{ t('guests.emptySearch') }}</p>
        <div v-else-if="guests.length" class="guest-table-wrap">
          <table class="guest-table" role="grid">
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
                class="guest-row"
                :class="{ 'guest-row--selected': selectedGuest?.id === guest.id }"
                @click="openPanel(guest)"
              >
                <td :data-label="t('fields.firstName')">{{ guest.first_name ?? '—' }}</td>
                <td :data-label="t('fields.lastName')">{{ guest.last_name ?? '—' }}</td>
                <td :data-label="t('fields.email')">{{ guest.email ?? '—' }}</td>
                <td :data-label="t('fields.phone')">{{ guest.phone ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
    </template>
  </section>

  <Transition name="slide-panel">
    <aside
      v-if="selectedGuest"
      class="guest-panel"
      role="dialog"
      aria-labelledby="guest-panel-title"
    >
      <div class="guest-panel-header">
        <h2 id="guest-panel-title">{{ guestPanelTitle }}</h2>
        <button
          type="button"
          class="guest-panel-close"
          :aria-label="t('common.closePanel')"
          @click="closePanel"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <div class="guest-panel-body">
        <dl class="guest-panel-dl">
          <dt>{{ t('fields.email') }}</dt>
          <dd>{{ selectedGuest.email ?? '—' }}</dd>
          <dt>{{ t('fields.phone') }}</dt>
          <dd>{{ selectedGuest.phone ?? '—' }}</dd>
        </dl>
      </div>
      <div class="guest-panel-footer">
        <router-link
          :to="{ name: 'guest-detail', params: { id: selectedGuest.id } }"
          class="btn-open-full-page"
          @click="closePanel"
        >
          {{ t('common.openFullPage') }}
        </router-link>
      </div>
    </aside>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import SearchBar from '@/shared/components/SearchBar.vue'
import { useGuestStore } from '@/features/guests/stores/useGuestStore'

const DEBOUNCE_MS = 300

const { t, locale } = useI18n()
const store = useGuestStore()
const { guests } = storeToRefs(store)

const initialLoading = ref(true)
const searching = ref(false)
const loadError = ref('')
const searchQuery = ref('')
const selectedGuest = ref(null)
let searchDebounceId = null

const guestPanelTitle = computed(() => {
  void locale.value
  if (!selectedGuest.value) return ''
  const first = selectedGuest.value.first_name ?? ''
  const last = selectedGuest.value.last_name ?? ''
  return [first, last].filter(Boolean).join(' ') || t('pageTitle.guest')
})

function openPanel(guest) {
  selectedGuest.value = guest
}

function closePanel() {
  selectedGuest.value = null
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
    loadError.value = err.response?.data?.error || t('guests.loadFailed')
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
.guest-panel {
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

.guest-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--border-subtle);
}

.guest-panel-close {
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

.guest-panel-close:hover {
  color: var(--ink-primary);
  background: var(--surface-2);
}

.guest-panel-close svg {
  width: 18px;
  height: 18px;
}

.guest-panel-body {
  flex: 1;
  min-height: 0;
  padding: var(--space-lg);
  overflow-y: auto;
}

.guest-panel-footer {
  flex-shrink: 0;
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
}

.guest-panel-dl {
  margin: 0;
  font-size: var(--text-body-size);
}

.guest-panel-dl dt {
  font-weight: var(--text-label-weight);
  color: var(--ink-tertiary);
  margin-top: var(--space-sm);
  margin-bottom: var(--space-micro);
}

.guest-panel-dl dt:first-child {
  margin-top: 0;
}

.guest-panel-dl dd {
  margin: 0;
  color: var(--ink-primary);
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

.btn-add-guest {
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

.btn-add-guest:hover {
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

.guest-table-wrap {
  overflow: hidden;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  background: var(--surface-1);
}

.guest-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-body-size);
}

.guest-table thead {
  background: var(--surface-2);
}

.guest-table th {
  text-align: left;
  font-size: var(--text-label-size);
  font-weight: var(--text-label-weight);
  color: var(--ink-secondary);
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--border-subtle);
}

.guest-table td {
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--border-subtle);
  color: var(--ink-primary);
}

.guest-table tbody tr:last-child td {
  border-bottom: none;
}

.guest-row {
  cursor: pointer;
  transition: background 0.12s ease;
}

.guest-row:hover {
  background: var(--surface-2);
}

.guest-row--selected {
  background: var(--semantic-info-bg);
}

.guest-row--selected:hover {
  background: var(--semantic-info-bg);
}
</style>
