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
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuery } from '@pinia/colada'
import type { FormNode } from '@/shared/types/forms'
import {
  guestFormDefinitionQuery,
  useUpdateGuestFormDefinitionMutation,
} from '@/features/guests/queries'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import FormBuild from '@/shared/form-dsl/FormBuild.vue'
import { useNotification } from '@/shared/composables/useNotification'

const { t } = useI18n()
const { success, error: notifyError } = useNotification()

const definitionQ = useQuery(guestFormDefinitionQuery)
const updateDefinition = useUpdateGuestFormDefinitionMutation()

const resetting = ref(false)
const loading = computed(() => definitionQ.isPending.value || resetting.value)
const saving = computed(() => updateDefinition.isLoading.value)
const loadError = computed(() =>
  definitionQ.error.value
    ? formatUnknownApiError(definitionQ.error.value) || t('form_settings.load_failed')
    : '',
)
const saveError = ref('')

const definitionDraft = ref<FormNode | null>(null)
const formData = ref<Record<string, unknown>>({})
const hasLoaded = computed(() => definitionDraft.value !== null)

const formReady = computed(() => hasLoaded.value && !loadError.value)

function applyDefinition(definition: FormNode | undefined) {
  definitionDraft.value = JSON.parse(JSON.stringify(definition ?? {}))
  formData.value = {}
}

// The first load of the saved definition becomes the draft the builder edits;
// later ones (after a save) must not reset the builder.
watch(
  () => definitionQ.data.value,
  (res) => {
    if (res && definitionDraft.value === null) applyDefinition(res.definition)
  },
  { immediate: true },
)

async function onReset() {
  saveError.value = ''
  resetting.value = true
  try {
    const { data } = await definitionQ.refetch()
    if (data) applyDefinition(data.definition)
  } finally {
    resetting.value = false
  }
}

async function onSave() {
  saveError.value = ''
  try {
    const res = await updateDefinition.mutateAsync(definitionDraft.value as FormNode)
    definitionDraft.value = JSON.parse(JSON.stringify(res.definition))
    success(t('form_settings.saved'))
  } catch (err: unknown) {
    const msg = formatUnknownApiError(err) || t('form_settings.save_failed')
    saveError.value = msg
    notifyError(msg)
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
