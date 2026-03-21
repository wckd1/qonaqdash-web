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
    <JsonFormEdit
      :schema="guestForm.schema"
      :uischema="guestForm.uischema"
      :data="formData"
      :errors-map="errorsMap"
      @update:data="formData = $event"
    />
  </template>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useGuestStore } from '@/features/guests/stores/useGuestStore'
import JsonFormEdit from '@/shared/jsonform/JsonFormEdit.vue'
import { guestToForm } from '@/shared/jsonform/normalizeFormResponse'

const { t } = useI18n()
const router = useRouter()
const store = useGuestStore()

const loading = ref(true)
const loadError = ref('')
const guestForm = ref(null)
const formData = ref({})
const errorsMap = ref({})
const submitting = ref(false)

onMounted(async () => {
  loading.value = true
  loadError.value = ''
  try {
    guestForm.value = await store.fetchGuestForm()
    formData.value = { ...(guestForm.value.data ?? {}) }
  } catch (err) {
    loadError.value = err.response?.data?.error ?? t('guests.formLoadFailed')
    guestForm.value = guestToForm({})
    formData.value = { ...guestForm.value.data }
  } finally {
    loading.value = false
  }
})

async function onSubmit() {
  errorsMap.value = {}
  submitting.value = true
  try {
    await store.createGuest(formData.value)
    router.push('/guests')
  } catch (err) {
    const msg = err.response?.data?.error ?? t('guests.saveFailed')
    if (err.response?.data?.errors) {
      errorsMap.value = err.response.data.errors
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
