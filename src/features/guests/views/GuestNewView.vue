<template>
  <header class="page-header">
    <h1>{{ t('pageTitle.guestNew') }}</h1>
    <button
      v-if="guestForm"
      type="button"
      :disabled="submitting"
      @click="onSubmit"
    >
      {{ submitting ? t('common.saving') : t('common.save') }}
    </button>
  </header>

  <p v-if="loadError" class="error-message">{{ loadError }}</p>
  <div v-else-if="loading" class="loading-state">{{ t('common.loading') }}</div>
  <template v-else-if="guestForm">
    <FormEdit
      :definition="guestForm.definition"
      :data="formData"
      :errors-map="errorsMap"
      @update:data="formData = $event"
    />
  </template>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useGuestStore } from '@/features/guests/stores/useGuestStore'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import type { FormNode } from '@/shared/types/forms'
import { httpErrorData, httpErrorResponse } from '@/shared/unknownError'
import FormEdit from '@/shared/form-dsl/FormEdit.vue'
import { validateFormData } from '@/shared/form-dsl/validateFormData'

const { t } = useI18n()
const router = useRouter()
const store = useGuestStore()

const loading = ref(true)
const loadError = ref('')
type GuestFormRuntime = { definition: FormNode; data: Record<string, unknown> }

const guestForm = ref<GuestFormRuntime | null>(null)
const formData = ref<Record<string, unknown>>({})
const errorsMap = ref<Record<string, string[]>>({})
const submitting = ref(false)

onMounted(async () => {
  loading.value = true
  loadError.value = ''
  try {
    const template = await store.fetchGuestForm()
    guestForm.value = template as GuestFormRuntime
    formData.value = { ...(guestForm.value.data ?? {}) }
  } catch (err: unknown) {
    loadError.value = formatUnknownApiError(err) || t('guests.formLoadFailed')
    guestForm.value = null
    formData.value = {}
  } finally {
    loading.value = false
  }
})

async function onSubmit() {
  errorsMap.value = {}
  const form = guestForm.value
  if (!form) return
  const { valid, errorsMap: clientErrors } = validateFormData(form.definition, formData.value)
  if (!valid) {
    errorsMap.value = clientErrors
    return
  }
  submitting.value = true
  try {
    await store.createGuest(formData.value)
    router.push('/guests')
  } catch (err: unknown) {
    const msg = formatUnknownApiError(err) || t('guests.saveFailed')
    const serverErrors = httpErrorData(err)?.errors
    if (
      httpErrorResponse(err) &&
      serverErrors &&
      typeof serverErrors === 'object' &&
      !Array.isArray(serverErrors)
    ) {
      errorsMap.value = serverErrors as Record<string, string[]>
    } else {
      errorsMap.value = { '': [msg] }
    }
  } finally {
    submitting.value = false
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
