<template>
  <header class="page-header">
    <h1>{{ guestDisplayName }}</h1>
    <button
      v-if="guestId && guestForm && !editing"
      type="button"
      @click="editing = true"
    >
      {{ t('common.edit') }}
    </button>
    <div v-else-if="guestId && guestForm && editing" class="page-header-actions">
      <button type="button" :disabled="submitting" @click="onSave">
        {{ submitting ? t('common.saving') : t('common.save') }}
      </button>
      <button type="button" class="btn-secondary" :disabled="submitting" @click="cancelEdit">
        {{ t('common.cancel') }}
      </button>
    </div>
  </header>

  <p v-if="loadError" class="error-message">{{ loadError }}</p>
  <p v-else-if="notFound" class="error-message">
    {{ t('guests.notFound') }}
    <router-link to="/guests" class="inline-link">{{ t('guests.backToList') }}</router-link>
  </p>
  <template v-else-if="currentGuest">
    <div class="guest-detail-body">
      <template v-if="guestForm">
        <JsonFormView
          v-if="!editing"
          :schema="guestForm.schema"
          :uischema="guestForm.uischema"
          :data="guestForm.data"
        />
        <template v-else>
          <JsonFormEdit
            :schema="guestForm.schema"
            :uischema="guestForm.uischema"
            :data="editFormData"
            :errors-map="errorsMap"
            @update:data="editFormData = $event"
          />
        </template>
      </template>

      <section v-if="guestId" class="previous-bookings" aria-labelledby="previous-bookings-heading">
      <h2 id="previous-bookings-heading">{{ t('guests.bookingsHeading') }}</h2>
      <p v-if="bookingsLoadError" class="error-message">{{ bookingsLoadError }}</p>
      <div v-else-if="bookingsLoading" class="loading-state">{{ t('common.loading') }}</div>
      <p v-else-if="!previousBookings.length" class="empty-state">{{ t('guests.noBookings') }}</p>
      <div v-else class="booking-table-wrap">
        <table class="booking-table" role="grid">
          <thead>
            <tr>
              <th scope="col">{{ t('fields.checkIn') }}</th>
              <th scope="col">{{ t('fields.checkOut') }}</th>
              <th scope="col">{{ t('fields.status') }}</th>
              <th scope="col"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in previousBookings" :key="b.id" class="booking-row">
              <td :data-label="t('fields.checkIn')">{{ formatDate(b.check_in) }}</td>
              <td :data-label="t('fields.checkOut')">{{ formatDate(b.check_out) }}</td>
              <td :data-label="t('fields.status')">
                <BookingStatusBadge :status="b.status" />
              </td>
              <td>
                <router-link :to="{ name: 'booking-detail', params: { id: b.id } }" class="link-booking">{{ t('common.view') }}</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </section>
    </div>
  </template>
  <div v-else class="loading-state">{{ t('common.loading') }}</div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { formatDocumentTitle } from '@/shared/i18n/documentTitle'
import { useGuestStore } from '@/features/guests/stores/useGuestStore'
import { useBreadcrumb } from '@/shared/composables/useBreadcrumb'
import JsonFormView from '@/shared/jsonform/JsonFormView.vue'
import JsonFormEdit from '@/shared/jsonform/JsonFormEdit.vue'
import { normalizeGuestFormResponse } from '@/shared/jsonform/normalizeFormResponse'
import { fetchGuestBookings } from '@/features/guests/api'
import BookingStatusBadge from '@/shared/components/BookingStatusBadge.vue'

const { t, locale } = useI18n()
const route = useRoute()
const store = useGuestStore()
const { currentGuest } = storeToRefs(store)
const { setItems: setBreadcrumb } = useBreadcrumb()

const loadError = ref('')
const notFound = ref(false)
const editing = ref(false)
const editFormData = ref({})
const errorsMap = ref({})
const submitting = ref(false)

const guestId = computed(() => route.params.id || null)

/** Normalized { schema, uischema, data } for JsonFormView (backend FormResponse or plain guest). */
const guestForm = computed(() => normalizeGuestFormResponse(currentGuest.value ?? null))

const previousBookings = ref([])
const bookingsLoading = ref(false)
const bookingsLoadError = ref('')

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
  } catch {
    return iso
  }
}

/**
 * Guest name from API: response has "data" with "firstName" and "lastName" (camelCase).
 */
const guestDisplayName = computed(() => {
  void locale.value
  const g = currentGuest.value
  if (!g) return t('pageTitle.guest')
  const data = g.data ?? g
  const first = data.firstName ?? data.first_name ?? ''
  const last = data.lastName ?? data.last_name ?? ''
  const parts = [first, last].filter(Boolean)
  return parts.length ? parts.join(' ') : (data.email || t('pageTitle.guest'))
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
      loadError.value = err.response?.data?.error || t('guests.guestLoadFailed')
    }
  }
}

async function loadBookings() {
  const id = guestId.value
  if (!id) return
  bookingsLoadError.value = ''
  bookingsLoading.value = true
  try {
    previousBookings.value = await fetchGuestBookings(id)
  } catch (err) {
    bookingsLoadError.value = err.response?.data?.error || t('guests.bookingsLoadFailed')
    previousBookings.value = []
  } finally {
    bookingsLoading.value = false
  }
}

watch(editing, (isEdit) => {
  if (isEdit && guestForm.value) {
    editFormData.value = { ...guestForm.value.data }
    errorsMap.value = {}
  }
})

watch(() => route.params.id, (newId) => {
  if (newId) load()
  editing.value = false
})

function cancelEdit() {
  editing.value = false
  if (guestForm.value) editFormData.value = { ...guestForm.value.data }
}

async function onSave() {
  if (!guestId.value) return
  errorsMap.value = {}
  submitting.value = true
  try {
    await store.updateGuest(guestId.value, editFormData.value)
    editing.value = false
  } catch (err) {
    const msg = err.response?.data?.error ?? t('guests.saveEditFailed')
    errorsMap.value = err.response?.data?.errors ?? { '': [msg] }
  } finally {
    submitting.value = false
  }
}

watch(guestId, (id) => {
  if (id && currentGuest.value) loadBookings()
})

watch(currentGuest, (guest) => {
  if (guest && guestId.value) loadBookings()
}, { immediate: true })

watch(
  [guestDisplayName, locale],
  () => {
    document.title = formatDocumentTitle(guestDisplayName.value)
    if (guestDisplayName.value && currentGuest.value) {
      setBreadcrumb([
        { labelKey: 'nav.guests', path: '/guests' },
        { label: guestDisplayName.value, path: null },
      ])
    }
  },
  { immediate: true },
)

load()
</script>

<style scoped>
.error-message {
  color: var(--semantic-error);
  font-size: var(--text-body-size);
  margin: 0;
}

.inline-link {
  color: var(--brand-primary);
  margin-left: var(--space-xs);
}

.loading-state {
  color: var(--ink-tertiary);
  font-size: var(--text-body-size);
}

.guest-detail-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.guest-detail-body > :first-child {
  flex-shrink: 0;
}

.guest-detail-body > .previous-bookings {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.previous-bookings {
  padding: var(--content-area-padding);
  background: var(--surface-1);
  border-radius: var(--content-area-radius);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
}

.empty-state {
  color: var(--ink-tertiary);
  font-size: var(--text-body-size);
  margin: 0;
}

.booking-table-wrap {
  overflow-x: auto;
}

.booking-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-body-size);
}

.booking-table th {
  text-align: left;
  padding: var(--space-xs) var(--space-sm);
  font-weight: var(--text-label-weight);
  color: var(--ink-secondary);
  border-bottom: 1px solid var(--border-subtle);
}

.booking-table td {
  padding: var(--space-xs) var(--space-sm);
  border-bottom: 1px solid var(--border-subtle);
  color: var(--ink-primary);
}

.booking-row:hover {
  background: var(--surface-2);
}

.link-booking {
  color: var(--brand-primary);
  text-decoration: none;
  font-weight: var(--text-label-weight);
}

.link-booking:hover {
  text-decoration: underline;
}
</style>
