<template>
  <header class="page-header">
    <h1>{{ t('guests.formSettingsTitle') }}</h1>
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
  <div v-else-if="loading" class="loading-state">{{ t('formSettings.loadingSchema') }}</div>
  <JsonFormBuild
    v-else-if="formReady"
    v-model:schema="schemaDraft"
    v-model:uischema="uischemaDraft"
    :data="formData"
    variant="guest"
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { updateGuestForm } from '@/features/guests/api'
import { useGuestStore } from '@/features/guests/stores/useGuestStore'
import JsonFormBuild from '@/shared/jsonform/JsonFormBuild.vue'
import { useNotification } from '@/shared/composables/useNotification'

const { t } = useI18n()
const { success, error: notifyError } = useNotification()
const guestStore = useGuestStore()

const loading = ref(true)
const saving = ref(false)
const loadError = ref('')
const saveError = ref('')

const schemaDraft = ref({})
const uischemaDraft = ref({})
const formData = ref({})
const hasLoaded = ref(false)

const formReady = computed(() => hasLoaded.value && !loadError.value)

/**
 * @param {{ force?: boolean }} [opts]
 */
async function loadForm(opts = {}) {
  loading.value = true
  loadError.value = ''
  try {
    const res = await guestStore.fetchGuestForm({ force: opts.force === true })
    schemaDraft.value = JSON.parse(JSON.stringify(res.schema ?? {}))
    uischemaDraft.value = JSON.parse(JSON.stringify(res.uischema ?? {}))
    formData.value = JSON.parse(JSON.stringify(res.data ?? {}))
    hasLoaded.value = true
  } catch (err) {
    loadError.value = err.response?.data?.error ?? t('formSettings.loadFailed')
    hasLoaded.value = false
  } finally {
    loading.value = false
  }
}

onMounted(() => loadForm())

async function onReset() {
  saveError.value = ''
  await loadForm({ force: true })
}

async function onSave() {
  saving.value = true
  saveError.value = ''
  try {
    const res = await updateGuestForm({
      schema: schemaDraft.value,
      uischema: uischemaDraft.value,
    })
    schemaDraft.value = JSON.parse(JSON.stringify(res.schema ?? schemaDraft.value))
    uischemaDraft.value = JSON.parse(JSON.stringify(res.uischema ?? uischemaDraft.value))
    if (res.data) formData.value = JSON.parse(JSON.stringify(res.data))
    guestStore.replaceGuestFormTemplate(res)
    success(t('formSettings.saved'))
  } catch (err) {
    const msg = err.response?.data?.error ?? t('formSettings.saveFailed')
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
