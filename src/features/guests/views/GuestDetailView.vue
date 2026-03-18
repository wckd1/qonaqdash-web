<template>
  <div class="guest-detail-view">
    <header class="page-header">
      <h1 class="page-title">{{ guestDisplayName }}</h1>
    </header>

    <p v-if="loadError" class="error-message">{{ loadError }}</p>
    <p v-else-if="notFound" class="error-message">
      Guest not found.
      <router-link to="/guests" class="inline-link">Back to guests</router-link>
    </p>
    <template v-else-if="currentGuest">
      <section class="detail-section" aria-labelledby="detail-heading">
        <h2 id="detail-heading" class="section-title">Details</h2>
        <p class="section-placeholder">Form will be added in P5.</p>
      </section>
    </template>
    <div v-else class="loading-state">Loading…</div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useGuestStore } from '@/features/guests/stores/useGuestStore'
import { useBreadcrumb } from '@/shared/composables/useBreadcrumb'

const route = useRoute()
const store = useGuestStore()
const { currentGuest } = storeToRefs(store)
const { setItems: setBreadcrumb } = useBreadcrumb()

const loadError = ref('')
const notFound = ref(false)

/**
 * Guest name from API: response has "data" with "firstName" and "lastName" (camelCase).
 */
const guestDisplayName = computed(() => {
  const g = currentGuest.value
  if (!g) return 'Guest'
  const data = g.data ?? g
  const first = data.firstName ?? data.first_name ?? ''
  const last = data.lastName ?? data.last_name ?? ''
  const parts = [first, last].filter(Boolean)
  return parts.length ? parts.join(' ') : 'Guest'
})

async function load() {
  const id = route.params.id
  if (!id) return
  store.clearCurrentGuest()
  loadError.value = ''
  notFound.value = false
  try {
    await store.fetchGuest(id)
  } catch (err) {
    if (err.response?.status === 404) {
      store.clearCurrentGuest()
      notFound.value = true
    } else {
      loadError.value = err.response?.data?.error || 'Failed to load guest.'
    }
  }
}

watch(() => route.params.id, (newId) => {
  if (newId) load()
})

watch(
  guestDisplayName,
  (name) => {
    if (name && currentGuest.value) {
      setBreadcrumb([{ label: 'Guests', path: '/guests' }, { label: name, path: null }])
    }
  },
  { immediate: true },
)

load()
</script>

<style scoped>
.guest-detail-view {
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
