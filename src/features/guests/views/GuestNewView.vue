<template>
  <header class="page-header">
    <h1>{{ t('page_title.guest_new') }}</h1>
    <button v-if="guestForm" type="button" :disabled="submitting" @click="onSubmit">
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
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useQuery } from '@pinia/colada'
import { guestCreateFormQuery, useCreateGuestMutation } from '@/features/guests/queries'
import { formatUnknownApiError, formErrorsMapFromHttpError } from '@/shared/i18n/apiError'
import type { FormNode } from '@/shared/form-dsl/types'
import FormEdit from '@/shared/form-dsl/FormEdit.vue'
import { validateFormData } from '@/shared/form-dsl/validateFormData'
import { scrollToFirstFormError } from '@/shared/form-dsl/scrollToFirstError'

const { t } = useI18n()
const router = useRouter()
const createGuest = useCreateGuestMutation()

type GuestFormRuntime = { definition: FormNode; data: Record<string, unknown> }

const formQ = useQuery(guestCreateFormQuery)
const guestForm = ref<GuestFormRuntime | null>(null)
const formData = ref<Record<string, unknown>>({})
const errorsMap = ref<Record<string, string[]>>({})
const submitting = ref(false)
const loadError = computed(() =>
  formQ.error.value ? formatUnknownApiError(formQ.error.value) || t('guests.form_load_failed') : '',
)
const loading = computed(() => !guestForm.value && !loadError.value)

// Every open revalidates the form (`If-None-Match`). Take it once, after that
// request, so a later update never replaces what the user typed.
onMounted(async () => {
  const { data, error } = await formQ.refresh()
  if (error || !data || guestForm.value) return
  guestForm.value = JSON.parse(JSON.stringify(data)) as GuestFormRuntime
  formData.value = { ...(guestForm.value.data ?? {}) }
})

async function onSubmit() {
  errorsMap.value = {}
  const form = guestForm.value
  if (!form) return
  const { valid, errorsMap: clientErrors } = validateFormData(form.definition, formData.value)
  if (!valid) {
    errorsMap.value = clientErrors
    scrollToFirstFormError()
    return
  }
  submitting.value = true
  try {
    await createGuest.mutateAsync(formData.value)
    router.push('/guests')
  } catch (err: unknown) {
    const mapped = formErrorsMapFromHttpError(err)
    if (mapped) {
      errorsMap.value = mapped
      scrollToFirstFormError()
    } else {
      const msg = formatUnknownApiError(err) || t('guests.save_failed')
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
