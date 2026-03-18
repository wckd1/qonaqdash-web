<template>
  <div class="booking-detail-view">
    <header class="page-header">
      <h1 class="page-title">{{ pageTitle }}</h1>
    </header>

    <p v-if="loadError" class="error-message">{{ loadError }}</p>
    <p v-else-if="notFound" class="error-message">
      Booking not found.
      <router-link to="/bookings" class="inline-link">Back to bookings</router-link>
    </p>
    <template v-else-if="currentBooking">
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
import { useBookingStore } from '@/features/bookings/stores/useBookingStore'
import { useBreadcrumb } from '@/shared/composables/useBreadcrumb'

const route = useRoute()
const store = useBookingStore()
const { currentBooking } = storeToRefs(store)
const { setItems: setBreadcrumb } = useBreadcrumb()

const loadError = ref('')
const notFound = ref(false)

/** Guest name for title/breadcrumb from FormResponse (data.guest) or flat Booking (guest). */
const guestDisplayName = computed(() => {
  const b = currentBooking.value
  if (!b) return ''
  const g = b.data?.guest ?? b.guest
  if (!g) return ''
  const first = g.firstName ?? g.first_name ?? ''
  const last = g.lastName ?? g.last_name ?? ''
  const parts = [first, last].filter(Boolean)
  return parts.length ? parts.join(' ') : (g.email ?? '')
})

const pageTitle = computed(() => {
  if (!currentBooking.value) return 'Booking'
  const name = guestDisplayName.value
  return name ? `Booking — ${name}` : 'Booking'
})

async function load() {
  const id = route.params.id
  if (!id) return
  store.clearCurrentBooking()
  loadError.value = ''
  notFound.value = false
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
