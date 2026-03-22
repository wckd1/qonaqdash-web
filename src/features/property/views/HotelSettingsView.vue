<template>
  <header class="page-header">
    <h1>{{ t('hotel.title') }}</h1>
    <div class="page-header-actions">
      <button type="button" :disabled="saving || loading || !dirty" @click="onSave">
        {{ saving ? t('common.saving') : t('common.save') }}
      </button>
    </div>
  </header>

  <div class="form-content__viewport hotel-settings-view">
    <p v-if="loadError" class="error-message">{{ loadError }}</p>
    <div v-else-if="loading" class="loading-state">{{ t('common.loading') }}</div>
    <template v-else>
      <p v-if="validationError" class="form-field-error">{{ validationError }}</p>
      <section class="panel hotel-settings-view__section">
        <h2 class="hotel-settings-view__heading">{{ t('hotel.profileSection') }}</h2>
        <p class="hotel-settings-view__hint">{{ t('hotel.nameHint') }}</p>
        <label>
          {{ t('hotel.displayName') }}
          <input v-model="name" type="text" autocomplete="organization" :disabled="saving" />
        </label>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import * as propertyApi from '@/features/property/api'
import { formatApiError } from '@/shared/i18n/apiError'

const { t } = useI18n()

const loading = ref(true)
const saving = ref(false)
const loadError = ref('')
const validationError = ref('')

const name = ref('')
const originalName = ref('')

const dirty = computed(() => name.value.trim() !== originalName.value.trim())

async function load() {
  loadError.value = ''
  loading.value = true
  try {
    const data = await propertyApi.fetchHotel()
    const n = typeof data?.name === 'string' ? data.name : ''
    name.value = n
    originalName.value = n
  } catch (err) {
    loadError.value = formatApiError(err.response?.data?.error) || t('hotel.loadError')
  } finally {
    loading.value = false
  }
}

async function onSave() {
  validationError.value = ''
  const trimmed = name.value.trim()
  if (!trimmed) {
    validationError.value = t('errors.property.hotel_name_required')
    return
  }

  saving.value = true
  try {
    const data = await propertyApi.updateHotel(trimmed)
    const n = typeof data?.name === 'string' ? data.name : trimmed
    name.value = n
    originalName.value = n
  } catch {
    // Global toast from API client; optional inline from response
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.hotel-settings-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.hotel-settings-view__section {
  margin: 0;
}

.hotel-settings-view__section label {
  display: block;
  margin-bottom: 0;
}

.hotel-settings-view__heading {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  margin: 0 0 var(--space-md);
}

.hotel-settings-view__hint {
  margin: 0 0 var(--space-md);
  font-size: var(--text-caption-size);
  font-weight: var(--text-caption-weight);
  line-height: 1.45;
  color: var(--ink-muted);
}
</style>
