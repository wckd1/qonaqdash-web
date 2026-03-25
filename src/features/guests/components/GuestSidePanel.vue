<template>
  <Transition name="slide-panel">
    <aside
      v-if="guest"
      class="side-panel"
      aria-labelledby="side-panel-title"
    >
      <div class="side-panel-header">
        <h2 id="side-panel-title">{{ guestPanelTitle }}</h2>
        <button
          type="button"
          class="side-panel-close"
          :aria-label="t('common.closePanel')"
          @click="emit('close')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <div class="side-panel-body">
        <p v-if="loadError" class="error-message">{{ loadError }}</p>
        <p v-else-if="notFound" class="error-message">{{ t('guests.notFound') }}</p>
        <div v-else-if="loading" class="loading-state">{{ t('common.loading') }}</div>
        <JsonFormView
          v-else-if="guestForm"
          compact
          :schema="guestForm.schema"
          :uischema="guestForm.uischema"
          :data="guestForm.data"
        />
        <p v-else class="section-placeholder">{{ t('guests.detailsLoading') }}</p>
      </div>
      <div class="side-panel-footer">
        <router-link
          :to="{ name: 'guest-detail', params: { id: guest.id } }"
          class="btn-open-full-page"
        >
          {{ t('common.openFullPage') }}
        </router-link>
      </div>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import JsonFormView from '@/shared/jsonform/JsonFormView.vue'
import { composeGuestFormFromEntity } from '@/shared/jsonform/normalizeFormResponse'
import { fetchGuest } from '@/features/guests/api'
import type { GuestDetailData } from '@/features/guests/api'
import type { GuestSidePanelRef } from '@/features/guests/panelTypes'
import { useGuestStore } from '@/features/guests/stores/useGuestStore'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import { httpErrorResponse } from '@/shared/unknownError'

const { t, locale } = useI18n()
const guestStore = useGuestStore()
const { guestFormTemplate, guestFormRuntimeView } = storeToRefs(guestStore)

const props = withDefaults(
  defineProps<{
    guest: GuestSidePanelRef | null
  }>(),
  { guest: null },
)

const emit = defineEmits<{
  close: []
}>()

const detailEntity = ref<GuestDetailData | null>(null)
const loading = ref(false)
const loadError = ref('')
const notFound = ref(false)

let loadSeq = 0

const guestForm = computed(() =>
  composeGuestFormFromEntity(
    detailEntity.value ?? null,
    guestFormRuntimeView.value ?? guestFormTemplate.value,
  ),
)

const guestPanelTitle = computed(() => {
  void locale.value
  const entity = detailEntity.value
  if (entity) {
    const row = entity as Record<string, unknown>
    const first = (row.firstName ?? row.first_name ?? '') as string
    const last = (row.lastName ?? row.last_name ?? '') as string
    const parts = [first, last].filter(Boolean)
    if (parts.length) return parts.join(' ')
    if (row.email != null) return String(row.email)
  }
  const g = props.guest
  if (!g) return ''
  const first = g.first_name ?? ''
  const last = g.last_name ?? ''
  return [first, last].filter(Boolean).join(' ') || t('pageTitle.guest')
})

watch(
  () => props.guest?.id,
  async (id) => {
    if (!id) {
      detailEntity.value = null
      loadError.value = ''
      notFound.value = false
      loading.value = false
      return
    }
    const seq = ++loadSeq
    loading.value = true
    loadError.value = ''
    notFound.value = false
    detailEntity.value = null
    try {
      const [entity] = await Promise.all([
        fetchGuest(id),
        guestStore.fetchGuestForm({ target: 'view' }),
      ])
      if (seq !== loadSeq) return
      detailEntity.value = entity
    } catch (err: unknown) {
      if (seq !== loadSeq) return
      if (httpErrorResponse(err)?.status === 404) {
        notFound.value = true
      } else {
        loadError.value = formatUnknownApiError(err) || t('guests.guestLoadFailed')
      }
    } finally {
      if (seq === loadSeq) loading.value = false
    }
  },
  { immediate: true },
)
</script>
