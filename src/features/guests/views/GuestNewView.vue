<template>
  <header class="page-header">
    <h1>New guest</h1>
    <button
      v-if="guestForm"
      type="button"
      :disabled="submitting"
      @click="onSubmit"
    >
      {{ submitting ? 'Saving…' : 'Save' }}
    </button>
  </header>

  <p v-if="loadError" class="error-message">{{ loadError }}</p>
  <div v-else-if="loading" class="loading-state">Loading…</div>
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
import { useRouter } from 'vue-router'
import { useGuestStore } from '@/features/guests/stores/useGuestStore'
import JsonFormEdit from '@/shared/jsonform/JsonFormEdit.vue'
import { guestToForm } from '@/shared/jsonform/normalizeFormResponse'

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
    loadError.value = err.response?.data?.error ?? 'Failed to load form.'
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
    const msg = err.response?.data?.error ?? 'Failed to save guest.'
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
