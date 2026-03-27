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
        <h2 class="hotel-settings-view__heading">{{ t('hotel.profile_section') }}</h2>
        <p class="hotel-settings-view__hint">{{ t('hotel.name_hint') }}</p>
        <label>
          {{ t('hotel.display_name') }}
          <input v-model="name" type="text" autocomplete="organization" :disabled="saving" />
        </label>
      </section>

      <section class="panel hotel-settings-view__section">
        <h2 class="hotel-settings-view__heading">{{ t('hotel.hours_section') }}</h2>
        <p class="hotel-settings-view__hint">{{ t('hotel.hours_hint') }}</p>
        <div class="hotel-settings-view__row">
          <label>
            {{ t('hotel.check_in_hour') }}
            <input v-model="checkInHour" type="time" :disabled="saving" />
          </label>
          <label>
            {{ t('hotel.check_out_hour') }}
            <input v-model="checkOutHour" type="time" :disabled="saving" />
          </label>
        </div>
      </section>

      <section class="panel hotel-settings-view__section">
        <h2 class="hotel-settings-view__heading">{{ t('hotel.currency_section') }}</h2>
        <p class="hotel-settings-view__hint">{{ t('hotel.currency_hint') }}</p>
        <label>
          {{ t('hotel.currency') }}
          <select :value="currency" :disabled="saving" @change="onCurrencyChange">
            <option v-for="code in CURRENCY_CODES" :key="code" :value="code">
              {{ t(`hotel.currency_name.${code}`) }} ({{ getCurrencySymbol(code) }})
            </option>
          </select>
        </label>
      </section>
    </template>
  </div>

  <Teleport to="body">
    <div
      v-if="currencyConfirmOpen"
      class="dialog-backdrop"
      role="presentation"
      @click.self="closeCurrencyConfirm"
    >
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="currency-confirm-title">
        <h2 id="currency-confirm-title">{{ t('hotel.confirm_currency_title') }}</h2>
        <p class="hotel-confirm-body">{{ t('hotel.confirm_currency_body') }}</p>
        <div class="dialog-actions">
          <button
            type="button"
            class="btn-secondary"
            :disabled="saving"
            @click="closeCurrencyConfirm"
          >
            {{ t('common.cancel') }}
          </button>
          <button type="button" @click="confirmCurrencyChange">
            {{ t('hotel.confirm_currency_proceed') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import * as propertyApi from '@/features/property/api'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import { CURRENCY_CODES, getCurrencySymbol } from '@/shared/lib/money'

const { t } = useI18n()

const loading = ref(true)
const saving = ref(false)
const loadError = ref('')
const validationError = ref('')

const name = ref('')
const originalName = ref('')
const currency = ref('USD')
const originalCurrency = ref('USD')
const checkInHour = ref('14:00')
const originalCheckInHour = ref('14:00')
const checkOutHour = ref('12:00')
const originalCheckOutHour = ref('12:00')

const dirty = computed(
  () =>
    name.value.trim() !== originalName.value.trim() ||
    currency.value !== originalCurrency.value ||
    checkInHour.value !== originalCheckInHour.value ||
    checkOutHour.value !== originalCheckOutHour.value,
)

async function load() {
  loadError.value = ''
  loading.value = true
  try {
    const data = await propertyApi.fetchHotel()
    const n = typeof data?.name === 'string' ? data.name : ''
    name.value = n
    originalName.value = n
    const c = typeof data?.currency === 'string' && data.currency ? data.currency : 'USD'
    currency.value = c
    originalCurrency.value = c
    const ci =
      typeof data?.check_in_hour === 'string' && data.check_in_hour ? data.check_in_hour : '14:00'
    checkInHour.value = ci
    originalCheckInHour.value = ci
    const co =
      typeof data?.check_out_hour === 'string' && data.check_out_hour
        ? data.check_out_hour
        : '12:00'
    checkOutHour.value = co
    originalCheckOutHour.value = co
  } catch (err: unknown) {
    loadError.value = formatUnknownApiError(err) || t('hotel.load_error')
  } finally {
    loading.value = false
  }
}

const currencyConfirmOpen = ref(false)
const pendingCurrency = ref('')

function onCurrencyChange(e: Event) {
  const next = (e.target as HTMLSelectElement).value
  if (next === currency.value) return

  pendingCurrency.value = next
  currencyConfirmOpen.value = true
  ;(e.target as HTMLSelectElement).value = currency.value
}

function closeCurrencyConfirm() {
  pendingCurrency.value = ''
  currencyConfirmOpen.value = false
}

function confirmCurrencyChange() {
  currency.value = pendingCurrency.value
  pendingCurrency.value = ''
  currencyConfirmOpen.value = false
}

async function onSave() {
  validationError.value = ''
  const trimmed = name.value.trim()
  if (!trimmed) {
    validationError.value = t('errors.property.hotel_name_required')
    return
  }
  if (!currency.value) {
    validationError.value = t('errors.property.hotel_invalid_currency')
    return
  }

  saving.value = true
  try {
    const data = await propertyApi.updateHotel({
      name: trimmed,
      currency: currency.value,
      check_in_hour: checkInHour.value,
      check_out_hour: checkOutHour.value,
    })
    const n = typeof data?.name === 'string' ? data.name : trimmed
    name.value = n
    originalName.value = n
    const c = typeof data?.currency === 'string' && data.currency ? data.currency : currency.value
    currency.value = c
    originalCurrency.value = c
    const ci =
      typeof data?.check_in_hour === 'string' && data.check_in_hour
        ? data.check_in_hour
        : checkInHour.value
    checkInHour.value = ci
    originalCheckInHour.value = ci
    const co =
      typeof data?.check_out_hour === 'string' && data.check_out_hour
        ? data.check_out_hour
        : checkOutHour.value
    checkOutHour.value = co
    originalCheckOutHour.value = co
  } catch (err: unknown) {
    const msg = formatUnknownApiError(err)
    if (msg) validationError.value = msg
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

.hotel-settings-view__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.hotel-confirm-body {
  margin: 0 0 var(--space-md);
  font-size: var(--text-body-size);
  color: var(--ink-secondary);
}
</style>
