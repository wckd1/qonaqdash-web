<template>
  <header class="page-header">
    <h1>{{ t('bookings.form_settings_title') }}</h1>
    <div class="page-header-actions">
      <button type="button" class="btn-secondary" :disabled="loading || saving" @click="onReset">
        {{ t('common.reset') }}
      </button>
      <button type="button" :disabled="loading || saving || !formReady" @click="onSave">
        {{ saving ? t('common.saving') : t('common.save') }}
      </button>
    </div>
  </header>

  <p v-if="loadError" class="error-message">{{ loadError }}</p>
  <p v-if="saveError" class="error-message">{{ saveError }}</p>
  <div v-else-if="loading" class="loading-state">{{ t('form_settings.loading_schema') }}</div>
  <FormBuild
    v-else-if="formReady"
    :definition="definitionDraft"
    :data="formData"
    variant="booking"
    @update:definition="definitionDraft = $event"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormNode } from '@/shared/types/forms'
import { updateBookingFormSchema } from '@/features/bookings/api'
import { useBookingStore } from '@/features/bookings/stores/useBookingStore'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import FormBuild from '@/shared/form-dsl/FormBuild.vue'
import { useNotification } from '@/shared/composables/useNotification'

const { t } = useI18n()
const { success, error: notifyError } = useNotification()
const bookingStore = useBookingStore()

const loading = ref(true)
const saving = ref(false)
const loadError = ref('')
const saveError = ref('')

const definitionDraft = ref<FormNode | null>(null)
const formData = ref<Record<string, unknown>>({})
const hasLoaded = ref(false)

const formReady = computed(() => hasLoaded.value && !loadError.value)

function normalizeFormData(data: Record<string, unknown>): Record<string, unknown> {
  const next = JSON.parse(JSON.stringify(data ?? {}))
  if (!next.guest) next.guest = {}
  if (next.guest.id === undefined) next.guest.id = null
  if (!next.stay) next.stay = { check_in: '', check_out: '', rooms: [] }
  if (!Array.isArray(next.stay.rooms)) next.stay.rooms = []
  return next
}

async function loadForm() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await bookingStore.fetchBookingFormSchema()
    definitionDraft.value = JSON.parse(JSON.stringify(res.definition ?? {}))
    formData.value = normalizeFormData(res.data ?? {})
    hasLoaded.value = true
  } catch (err: unknown) {
    loadError.value = formatUnknownApiError(err) || t('form_settings.load_failed')
    hasLoaded.value = false
  } finally {
    loading.value = false
  }
}

onMounted(() => loadForm())

async function onReset() {
  saveError.value = ''
  await loadForm()
}

async function onSave() {
  saving.value = true
  saveError.value = ''
  try {
    const res = await updateBookingFormSchema({
      definition: definitionDraft.value as FormNode,
    })
    if (res.definition) definitionDraft.value = JSON.parse(JSON.stringify(res.definition))
    if (res.data) formData.value = normalizeFormData(res.data)
    bookingStore.replaceBookingFormTemplate(res)
    success(t('form_settings.saved'))
  } catch (err: unknown) {
    const msg = formatUnknownApiError(err) || t('form_settings.save_failed')
    saveError.value = msg
    notifyError(msg)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.error-message {
  color: var(--semantic-error);
  font-size: var(--text-body-size);
  margin: 0 0 var(--space-md);
}

.loading-state {
  color: var(--ink-tertiary);
  font-size: var(--text-body-size);
}
</style>
