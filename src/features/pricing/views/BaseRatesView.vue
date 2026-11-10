<template>
  <header class="page-header">
    <h1>{{ t('pricing.title') }}</h1>
  </header>

  <PricingSubNav />

  <div class="form-content__viewport pricing-view">
    <p v-if="loadError" class="error-message">{{ loadError }}</p>
    <div v-else-if="loading" class="loading-state">{{ t('common.loading') }}</div>
    <template v-else>
      <section class="panel pricing-view__section">
        <div class="pricing-view__section-header">
          <div>
            <h2 class="pricing-view__heading">{{ t('pricing.base_rates_title') }}</h2>
            <p class="pricing-view__hint">{{ t('pricing.base_rates_hint') }}</p>
          </div>
          <button
            v-if="baseRates.length && canAdjustPricing"
            type="button"
            :disabled="!dirty || saving"
            @click="saveAll"
          >
            {{ saving ? t('common.saving') : t('common.save') }}
          </button>
        </div>

        <p v-if="saveError" class="form-error">{{ saveError }}</p>

        <p v-if="!baseRates.length" class="pricing-view__empty">
          {{ t('pricing.base_rates_empty') }}
        </p>

        <table v-else class="list-table">
          <thead>
            <tr>
              <th scope="col">{{ t('pricing.base_rates_col_room_type') }}</th>
              <th scope="col" class="base-rates__col-rate">
                {{ t('pricing.base_rates_col_rate') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rate in baseRates" :key="rate.room_type_id">
              <td>{{ rate.room_type_name }}</td>
              <td class="base-rates__col-rate">
                <div class="base-rates__amount-wrap">
                  <input
                    type="number"
                    min="0"
                    :step="rateInputStep"
                    :value="editedMajorRate(rate.room_type_id)"
                    :disabled="saving || !canAdjustPricing"
                    class="base-rates__amount-input"
                    @beforeinput="onRateBeforeInput"
                    @input="onRateInput(rate.room_type_id, $event)"
                  />
                  <span class="base-rates__currency">{{ currencySymbol }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PricingSubNav from '@/features/pricing/components/PricingSubNav.vue'
import { useQuery } from '@pinia/colada'
import { hotelQuery } from '@/features/property/queries'
import { baseRatesQuery, useUpdateBaseRatesMutation } from '@/features/pricing/queries'
import {
  minorToMajor,
  majorToMinor,
  getCurrencyExponent,
  getCurrencySymbol,
} from '@/shared/lib/money'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import { guardNumberBeforeInput } from '@/shared/form-dsl/inputGuard'
import { usePermissions } from '@/shared/composables/usePermissions'

const { t } = useI18n()
const { canAdjustPricing } = usePermissions()
const hotelQ = useQuery(hotelQuery)
const ratesQ = useQuery(baseRatesQuery)
const updateBaseRates = useUpdateBaseRatesMutation()
const hotel = computed(() => hotelQ.data.value ?? null)
const baseRates = computed(() => ratesQ.data.value ?? [])

const loading = computed(() => hotelQ.isPending.value || ratesQ.isPending.value)
const loadError = computed(() => {
  const err = hotelQ.error.value ?? ratesQ.error.value
  return err ? formatUnknownApiError(err) || t('pricing.load_failed') : ''
})
const saving = ref(false)
const saveError = ref('')

const edits = ref<Map<string, number>>(new Map())

const currencyCode = computed(() => hotel.value?.currency ?? 'USD')
const currencySymbol = computed(() => getCurrencySymbol(currencyCode.value))

const rateInputStep = computed(() => {
  const exp = getCurrencyExponent(currencyCode.value)
  return (1 / 10 ** exp).toString()
})

function rateForRoomType(roomTypeId: string): number {
  return baseRates.value.find((r) => r.room_type_id === roomTypeId)?.base_rate_minor ?? 0
}

const dirty = computed(() => {
  for (const [id, minorValue] of edits.value) {
    if (minorValue !== rateForRoomType(id)) return true
  }
  return false
})

function editedMajorRate(rtId: string): number {
  const minorOverride = edits.value.get(rtId)
  const minor = minorOverride ?? rateForRoomType(rtId)
  return minorToMajor(minor, currencyCode.value)
}

function onRateBeforeInput(e: Event) {
  guardNumberBeforeInput(e as InputEvent, { min: 0 })
}

function onRateInput(id: string, event: Event) {
  const value = Number((event.target as HTMLInputElement).value) || 0
  edits.value.set(id, majorToMinor(value, currencyCode.value))
}

async function saveAll() {
  saving.value = true
  saveError.value = ''
  try {
    // The rates carry their room type names; one rate per active room type of the hotel.
    const updatedRates = baseRates.value.map((rate) => ({
      room_type_id: rate.room_type_id,
      base_rate_minor: edits.value.get(rate.room_type_id) ?? rate.base_rate_minor,
    }))
    await updateBaseRates.mutateAsync(updatedRates)
    edits.value.clear()
  } catch (err: unknown) {
    saveError.value = formatUnknownApiError(err) || t('pricing.base_rates_save_failed')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.pricing-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.pricing-view__section {
  margin: 0;
}

.pricing-view__section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.pricing-view__heading {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  margin: 0 0 var(--space-xs);
}

.pricing-view__hint {
  margin: 0;
  font-size: var(--text-caption-size);
  font-weight: var(--text-caption-weight);
  line-height: 1.45;
  color: var(--ink-muted);
}

.pricing-view__empty {
  margin: 0;
  padding: var(--space-md);
  text-align: center;
  color: var(--ink-muted);
  font-size: var(--text-body-size);
}

.base-rates__col-rate {
  width: 14rem;
}

.base-rates__amount-wrap {
  position: relative;
}

.base-rates__amount-input {
  padding-right: var(--space-xl);
  -moz-appearance: textfield;
  appearance: textfield;
}

.base-rates__amount-input::-webkit-outer-spin-button,
.base-rates__amount-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.base-rates__currency {
  position: absolute;
  right: var(--space-md);
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-tertiary);
  font-size: var(--text-label-size);
  pointer-events: none;
}
</style>
