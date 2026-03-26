<template>
  <header class="page-header">
    <h1>{{ t('guests.form_settings_title') }}</h1>
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
    variant="guest"
    @update:definition="definitionDraft = $event"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormNode } from '@/shared/types/forms'
import { updateGuestFormSchema } from '@/features/guests/api'
import { useGuestStore } from '@/features/guests/stores/useGuestStore'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import FormBuild from '@/shared/form-dsl/FormBuild.vue'
import { useNotification } from '@/shared/composables/useNotification'

const { t } = useI18n()
const { success, error: notifyError } = useNotification()
const guestStore = useGuestStore()

const loading = ref(true)
const saving = ref(false)
const loadError = ref('')
const saveError = ref('')

const definitionDraft = ref<FormNode | null>(null)
const formData = ref<Record<string, unknown>>({})
const hasLoaded = ref(false)

const formReady = computed(() => hasLoaded.value && !loadError.value)

async function loadForm() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await guestStore.fetchGuestFormSchema()
    definitionDraft.value = JSON.parse(JSON.stringify(res.definition ?? {}))
    formData.value = JSON.parse(JSON.stringify(res.data ?? {}))
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
    const res = await updateGuestFormSchema({
      definition: definitionDraft.value as FormNode,
    })
    if (res.definition) definitionDraft.value = JSON.parse(JSON.stringify(res.definition))
    if (res.data) formData.value = JSON.parse(JSON.stringify(res.data))
    guestStore.replaceGuestFormTemplate(res)
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
