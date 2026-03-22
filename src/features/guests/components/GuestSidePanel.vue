<template>
  <Transition name="slide-panel">
    <aside
      v-if="guest"
      class="guest-panel"
      aria-labelledby="guest-panel-title"
    >
      <div class="guest-panel-header">
        <h2 id="guest-panel-title">{{ guestPanelTitle }}</h2>
        <button
          type="button"
          class="guest-panel-close"
          :aria-label="t('common.closePanel')"
          @click="emit('close')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <div class="guest-panel-body">
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
      <div class="guest-panel-footer">
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

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import JsonFormView from '@/shared/jsonform/JsonFormView.vue'
import { composeGuestFormFromEntity } from '@/shared/jsonform/normalizeFormResponse'
import { fetchGuest } from '@/features/guests/api'
import { useGuestStore } from '@/features/guests/stores/useGuestStore'
import { formatApiError } from '@/shared/i18n/apiError'

const { t, locale } = useI18n()
const guestStore = useGuestStore()
const { guestFormTemplate } = storeToRefs(guestStore)

const props = defineProps({
  /**
   * @type {{ id: string, first_name?: string, last_name?: string, email?: string, phone?: string } | null}
   */
  guest: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const detailEntity = ref(null)
const loading = ref(false)
const loadError = ref('')
const notFound = ref(false)

let loadSeq = 0

const guestForm = computed(() =>
  composeGuestFormFromEntity(detailEntity.value ?? null, guestFormTemplate.value),
)

const guestPanelTitle = computed(() => {
  void locale.value
  const entity = detailEntity.value
  if (entity) {
    const data = entity.data ?? entity
    const first = data.firstName ?? data.first_name ?? ''
    const last = data.lastName ?? data.last_name ?? ''
    const parts = [first, last].filter(Boolean)
    if (parts.length) return parts.join(' ')
    if (data.email) return String(data.email)
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
      const entity = await fetchGuest(id)
      if (seq !== loadSeq) return
      detailEntity.value = entity
      if (entity && !(entity.schema && entity.uischema)) {
        await guestStore.fetchGuestForm()
        if (seq !== loadSeq) return
      }
    } catch (err) {
      if (seq !== loadSeq) return
      if (err.response?.status === 404) {
        notFound.value = true
      } else {
        loadError.value = formatApiError(err.response?.data?.error) || t('guests.guestLoadFailed')
      }
    } finally {
      if (seq === loadSeq) loading.value = false
    }
  },
  { immediate: true },
)
</script>
