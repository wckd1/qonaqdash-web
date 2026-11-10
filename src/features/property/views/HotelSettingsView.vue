<template>
  <header class="page-header">
    <h1>{{ t('hotel.title') }}</h1>
    <div v-if="canManageHotel" class="page-header-actions">
      <button type="button" :disabled="saving || loading || !dirty" @click="onSave">
        {{ saving ? t('common.saving') : t('common.save') }}
      </button>
    </div>
  </header>

  <PropertySubNav />

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
          <input
            v-model="name"
            type="text"
            autocomplete="organization"
            :disabled="saving || !canManageHotel"
          />
        </label>
      </section>

      <section class="panel hotel-settings-view__section">
        <h2 class="hotel-settings-view__heading">{{ t('hotel.hours_section') }}</h2>
        <p class="hotel-settings-view__hint">{{ t('hotel.hours_hint') }}</p>
        <div class="hotel-settings-view__row">
          <label>
            {{ t('hotel.check_in_hour') }}
            <input v-model="checkInHour" type="time" :disabled="saving || !canManageHotel" />
          </label>
          <label>
            {{ t('hotel.check_out_hour') }}
            <input v-model="checkOutHour" type="time" :disabled="saving || !canManageHotel" />
          </label>
        </div>
      </section>

      <section class="panel hotel-settings-view__section">
        <h2 class="hotel-settings-view__heading">{{ t('hotel.timezone_section') }}</h2>
        <p class="hotel-settings-view__hint">{{ t('hotel.timezone_hint') }}</p>
        <label>
          {{ t('hotel.timezone') }}
          <select v-model="timezone" :disabled="saving || !canManageHotel">
            <option v-for="zone in timeZoneOptions" :key="zone.value" :value="zone.value">
              {{ zone.label }}
            </option>
          </select>
        </label>
      </section>

      <section class="panel hotel-settings-view__section">
        <h2 class="hotel-settings-view__heading">{{ t('hotel.currency_section') }}</h2>
        <p class="hotel-settings-view__hint">{{ t('hotel.currency_hint') }}</p>
        <label>
          {{ t('hotel.currency') }}
          <select
            :value="currency"
            :disabled="saving || !canManageHotel"
            @change="onCurrencyChange"
          >
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
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuery } from '@pinia/colada'
import PropertySubNav from '@/features/property/components/PropertySubNav.vue'
import { hotelQuery, useUpdateHotelMutation } from '@/features/property/queries'
import type { Hotel } from '@/features/property/api'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import { CURRENCY_CODES, getCurrencySymbol } from '@/shared/lib/money'
import { usePermissions } from '@/shared/composables/usePermissions'
import { timeZoneLabel } from '@/shared/lib/moment'

const { t, locale } = useI18n()
const { canManageHotel } = usePermissions()

const hotel = useQuery(hotelQuery)
const updateHotel = useUpdateHotelMutation()

const loading = computed(() => hotel.isPending.value)
const saving = computed(() => updateHotel.isLoading.value)
const loadError = computed(() =>
  hotel.error.value ? formatUnknownApiError(hotel.error.value) || t('hotel.load_error') : '',
)
const validationError = ref('')

const name = ref('')
const originalName = ref('')
const currency = ref('USD')
const originalCurrency = ref('USD')
const checkInHour = ref('14:00')
const originalCheckInHour = ref('14:00')
const checkOutHour = ref('12:00')
const originalCheckOutHour = ref('12:00')
const timezone = ref('')
const originalTimezone = ref('')

/** IANA zones the browser knows, with the current offset; the saved zone is always offered. */
const timeZoneOptions = computed(() => {
  const zones = new Set(Intl.supportedValuesOf('timeZone'))
  if (originalTimezone.value) zones.add(originalTimezone.value)
  const now = Date.now()
  return [...zones].sort().map((zone) => {
    const offset = timeZoneLabel(now, zone, locale.value)
    return { value: zone, label: offset ? `${zone} (${offset})` : zone }
  })
})

const dirty = computed(
  () =>
    name.value.trim() !== originalName.value.trim() ||
    currency.value !== originalCurrency.value ||
    checkInHour.value !== originalCheckInHour.value ||
    checkOutHour.value !== originalCheckOutHour.value ||
    timezone.value !== originalTimezone.value,
)

/** Copies server values into the form; `fallback` fills fields the response lacks. */
function applyHotel(data: Partial<Hotel> | undefined, fallback: Omit<Hotel, 'id' | 'timezone'>) {
  const n = typeof data?.name === 'string' ? data.name : fallback.name
  name.value = n
  originalName.value = n
  const c = typeof data?.currency === 'string' && data.currency ? data.currency : fallback.currency
  currency.value = c
  originalCurrency.value = c
  const ci =
    typeof data?.check_in_hour === 'string' && data.check_in_hour
      ? data.check_in_hour
      : fallback.check_in_hour
  checkInHour.value = ci
  originalCheckInHour.value = ci
  const co =
    typeof data?.check_out_hour === 'string' && data.check_out_hour
      ? data.check_out_hour
      : fallback.check_out_hour
  checkOutHour.value = co
  originalCheckOutHour.value = co
  const zone = typeof data?.timezone === 'string' && data.timezone ? data.timezone : timezone.value
  timezone.value = zone
  originalTimezone.value = zone
}

// Fill the form from the hotel query, but never over unsaved edits.
watch(
  () => hotel.data.value,
  (data) => {
    if (data && !dirty.value) {
      applyHotel(data, {
        name: '',
        currency: 'USD',
        check_in_hour: '14:00',
        check_out_hour: '12:00',
      })
    }
  },
  { immediate: true },
)

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

  const body = {
    name: trimmed,
    currency: currency.value,
    check_in_hour: checkInHour.value,
    check_out_hour: checkOutHour.value,
    // Only a change: the server refuses one while the hotel has current or future bookings.
    timezone: timezone.value !== originalTimezone.value ? timezone.value : undefined,
  }
  try {
    applyHotel(await updateHotel.mutateAsync(body), body)
  } catch (err: unknown) {
    const msg = formatUnknownApiError(err)
    if (msg) validationError.value = msg
  }
}
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
