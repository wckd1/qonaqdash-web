<template>
  <header class="page-header">
    <h1>{{ guestDisplayName }}</h1>
    <div v-if="guestId && guestForm && !editing" class="page-header-actions">
      <button
        type="button"
        class="btn-secondary guest-detail-block-btn"
        :disabled="removing"
        @click="openBlockConfirm"
      >
        {{ t('guests.block') }}
      </button>
      <button type="button" class="btn-secondary" @click="editing = true">
        {{ t('common.edit') }}
      </button>
    </div>
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
    {{ t('guests.not_found') }}
    <router-link to="/guests" class="inline-link">{{ t('guests.back_to_list') }}</router-link>
  </p>
  <template v-else-if="currentGuest">
    <div class="guest-detail-body">
      <div class="guest-detail-form">
        <template v-if="guestForm">
          <FormView v-if="!editing" :definition="guestForm.definition" :data="guestForm.data" />
          <template v-else>
            <FormEdit
              :definition="guestForm.definition"
              :data="editFormData"
              :errors-map="errorsMap"
              @update:data="editFormData = $event"
            />
          </template>
        </template>
        <p v-else class="section-placeholder">{{ t('guests.details_loading') }}</p>
      </div>
      <section v-if="guestId" class="related-records" aria-labelledby="related-records-heading">
        <h2 id="related-records-heading">{{ t('guests.bookings_heading') }}</h2>
        <p v-if="bookingsLoadError" class="error-message">{{ bookingsLoadError }}</p>
        <div v-else-if="bookingsLoading" class="loading-state">{{ t('common.loading') }}</div>
        <p v-else-if="!previousBookings.length" class="empty-state">
          {{ t('guests.no_bookings') }}
        </p>
        <table v-else class="list-table" role="grid">
          <thead>
            <tr>
              <th scope="col">{{ t('fields.check_in') }}</th>
              <th scope="col">{{ t('fields.check_out') }}</th>
              <th scope="col">{{ t('fields.status') }}</th>
              <th scope="col" class="list-table__col--actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in previousBookings" :key="b.id">
              <td :data-label="t('fields.check_in')">{{ formatDate(b.stay?.check_in) }}</td>
              <td :data-label="t('fields.check_out')">{{ formatDate(b.stay?.check_out) }}</td>
              <td :data-label="t('fields.status')">
                <BookingStatusBadge :status="b.status" />
              </td>
              <td class="list-table__cell--actions">
                <router-link
                  :to="{ name: 'booking-detail', params: { id: b.id } }"
                  class="list-table__action"
                >
                  {{ t('common.view') }}
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </template>
  <div v-else class="loading-state">{{ t('common.loading') }}</div>

  <Teleport to="body">
    <div
      v-if="blockConfirmOpen"
      class="dialog-backdrop"
      role="presentation"
      @click.self="closeBlockConfirm"
    >
      <div class="dialog" role="dialog" :aria-labelledby="blockDialogTitleId" aria-modal="true">
        <h2 :id="blockDialogTitleId" class="guest-block-dialog-title">
          {{ t('guests.confirm_block_title') }}
        </h2>
        <p class="guest-block-dialog-body">{{ t('guests.confirm_block_body') }}</p>
        <div class="dialog-actions">
          <button
            type="button"
            class="btn-secondary"
            :disabled="removing"
            @click="closeBlockConfirm"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="action-toolbar__btn action-toolbar__btn--cancel"
            :disabled="removing"
            @click="confirmBlock"
          >
            {{ removing ? t('common.loading') : t('guests.block') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { formatDocumentTitle } from '@/shared/i18n/documentTitle'
import { useGuestStore } from '@/features/guests/stores/useGuestStore'
import FormView from '@/shared/form-dsl/FormView.vue'
import FormEdit from '@/shared/form-dsl/FormEdit.vue'
import { composeGuestFormFromEntity } from '@/shared/form-dsl/normalizeFormResponse'
import { fetchGuestBookings } from '@/features/guests/api'
import BookingStatusBadge from '@/shared/components/BookingStatusBadge.vue'
import type { GuestBookingListItem } from '@/features/bookings/api'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import { httpErrorData, httpErrorResponse } from '@/shared/unknownError'
import { validateFormData } from '@/shared/form-dsl/validateFormData'
import { scrollToFirstFormError } from '@/shared/form-dsl/scrollToFirstError'
import { useNotification } from '@/shared/composables/useNotification'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useGuestStore()
const { success } = useNotification()
const { currentGuest, guestFormTemplate, guestFormRuntimeView, currentGuestFormRef } =
  storeToRefs(store)
const loadError = ref('')
const notFound = ref(false)
const editing = ref(false)
const editFormData = ref({})
const errorsMap = ref({})
const submitting = ref(false)
const blockConfirmOpen = ref(false)
const removing = ref(false)
const blockDialogTitleId = useId()

function routeGuestId(): string | null {
  const id = route.params.id
  if (typeof id === 'string' && id) return id
  if (Array.isArray(id) && id[0]) return id[0]
  return null
}

const guestId = computed(() => routeGuestId())

/** Runtime GET /guests/form?target=view (+ edit fallback) merged with GET /guests/:id data. */
const guestForm = computed(() =>
  composeGuestFormFromEntity(
    currentGuest.value ?? null,
    guestFormRuntimeView.value ?? guestFormTemplate.value,
  ),
)

const previousBookings = ref<GuestBookingListItem[]>([])
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
 * Guest name from API: response has "data" with "first_name" and "last_name".
 */
const guestDisplayName = computed(() => {
  void locale.value
  const g = currentGuest.value
  if (!g) return t('page_title.guest')
  const data = g as Record<string, unknown>
  const first = (data.first_name ?? '') as string
  const last = (data.last_name ?? '') as string
  const parts = [first, last].filter(Boolean)
  const email = data.email
  return parts.length
    ? parts.join(' ')
    : (typeof email === 'string' ? email : '') || t('page_title.guest')
})

async function load() {
  const id = routeGuestId()
  if (!id) return
  store.clearCurrentGuest()
  loadError.value = ''
  notFound.value = false
  try {
    await store.fetchGuest(id)
    await store.fetchGuestForm({
      target: 'view',
      definitionHash: currentGuestFormRef.value?.hash ?? null,
    })
  } catch (err: unknown) {
    if (httpErrorResponse(err)?.status === 404) {
      store.clearCurrentGuest()
      notFound.value = true
    } else {
      loadError.value = formatUnknownApiError(err) || t('guests.guest_load_failed')
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
  } catch (err: unknown) {
    bookingsLoadError.value = formatUnknownApiError(err) || t('guests.bookings_load_failed')
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

watch(
  () => route.params.id,
  (newId) => {
    if (newId) load()
    editing.value = false
  },
  { immediate: true },
)

function cancelEdit() {
  editing.value = false
  if (guestForm.value) editFormData.value = { ...guestForm.value.data }
}

async function onSave() {
  if (!guestId.value) return
  errorsMap.value = {}
  const { valid, errorsMap: clientErrors } = validateFormData(
    guestForm.value?.definition,
    editFormData.value,
  )
  if (!valid) {
    errorsMap.value = clientErrors
    scrollToFirstFormError()
    return
  }
  submitting.value = true
  try {
    await store.updateGuest(guestId.value, editFormData.value)
    editing.value = false
  } catch (err: unknown) {
    const msg = formatUnknownApiError(err) || t('guests.save_edit_failed')
    const serverErrors = httpErrorData(err)?.errors
    errorsMap.value =
      serverErrors && typeof serverErrors === 'object'
        ? (serverErrors as Record<string, string[]>)
        : { '': [msg] }
  } finally {
    submitting.value = false
  }
}

watch(guestId, (id) => {
  if (id && currentGuest.value) loadBookings()
})

watch(
  currentGuest,
  (guest) => {
    if (guest && guestId.value) loadBookings()
  },
  { immediate: true },
)

watch(
  [guestDisplayName, locale],
  () => {
    document.title = formatDocumentTitle(guestDisplayName.value)
  },
  { immediate: true },
)

function openBlockConfirm() {
  blockConfirmOpen.value = true
}

function closeBlockConfirm() {
  if (removing.value) return
  blockConfirmOpen.value = false
}

async function confirmBlock() {
  const id = guestId.value
  if (!id) return
  removing.value = true
  try {
    await store.deleteGuest(id)
    await store.fetchGuests({})
    success(t('guests.block_success'))
    blockConfirmOpen.value = false
    await router.replace({ name: 'guests' })
  } catch {
    /* Global API interceptor surfaces error toast. */
  } finally {
    removing.value = false
  }
}
</script>

<style scoped>
/* Scroll column: flex + min-height so long content scrolls inside main. */
.guest-detail-body {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: var(--space-md);
  padding: 0 var(--space-md) var(--space-md);
  box-sizing: border-box;
  position: relative;
}

.guest-detail-form {
  flex: 0 0 auto;
  order: 0;
  min-width: 0;
  width: 100%;
}

/* FormDSL root: single scroll on `.guest-detail-body`, not nested viewport */
:deep(.form-content__viewport) {
  flex: 0 1 auto;
  overflow: visible;
  min-height: 0;
  padding: 0;
  gap: 0;
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

.section-placeholder {
  color: var(--ink-tertiary);
  font-size: var(--text-body-size);
  margin: 0;
}

.loading-state {
  color: var(--ink-tertiary);
  font-size: var(--text-body-size);
}

.related-records {
  flex: auto;
  order: 1;
  min-width: 0;
  min-height: 0;
  width: 100%;
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

.guest-detail-block-btn {
  border-color: color-mix(in srgb, var(--semantic-error) 45%, var(--border-subtle));
  color: var(--semantic-error);
}

.guest-detail-block-btn:hover:not(:disabled) {
  border-color: var(--semantic-error);
  background: var(--semantic-error-bg);
}

.guest-block-dialog-title {
  margin: 0 0 var(--space-sm);
  font-size: var(--text-heading-size);
}

.guest-block-dialog-body {
  margin: 0 0 var(--space-lg);
  font-size: var(--text-body-size);
  color: var(--ink-secondary);
}
</style>
