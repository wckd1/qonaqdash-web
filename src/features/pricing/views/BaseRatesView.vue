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
            v-if="roomTypes.length"
            type="button"
            :disabled="!dirty || saving"
            @click="saveAll"
          >
            {{ saving ? t('common.saving') : t('common.save') }}
          </button>
        </div>

        <p v-if="saveError" class="form-error">{{ saveError }}</p>

        <p v-if="!roomTypes.length" class="pricing-view__empty">
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
            <tr v-for="rt in roomTypes" :key="rt.id">
              <td>{{ rt.name }}</td>
              <td class="base-rates__col-rate">
                <div class="base-rates__input-group">
                  <input
                    type="number"
                    min="0"
                    :step="rateInputStep"
                    :value="editedMajorRate(rt.id)"
                    :disabled="saving"
                    @input="onRateInput(rt.id, $event)"
                  />
                  <span class="base-rates__currency">{{ currencyCode }}</span>
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
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import PricingSubNav from '@/features/pricing/components/PricingSubNav.vue'
import { usePropertyStore } from '@/features/property/stores/usePropertyStore'
import { usePricingStore } from '@/features/pricing/stores/usePricingStore'
import { minorToMajor, majorToMinor, getCurrencyExponent } from '@/shared/lib/money'
import { formatUnknownApiError } from '@/shared/i18n/apiError'

const { t } = useI18n()
const propertyStore = usePropertyStore()
const pricingStore = usePricingStore()
const { roomTypes, hotel } = storeToRefs(propertyStore)
const { baseRates } = storeToRefs(pricingStore)

const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const saveError = ref('')

const edits = ref<Map<string, number>>(new Map())

const currencyCode = computed(() => hotel.value?.currency ?? 'USD')

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

function onRateInput(id: string, event: Event) {
  const value = Number((event.target as HTMLInputElement).value) || 0
  edits.value.set(id, majorToMinor(value, currencyCode.value))
}

async function saveAll() {
  saving.value = true
  saveError.value = ''
  try {
    const updatedRates = roomTypes.value.map((rt) => ({
      room_type_id: rt.id,
      base_rate_minor: edits.value.get(rt.id) ?? rateForRoomType(rt.id),
    }))
    await pricingStore.updateBaseRates(updatedRates)
    edits.value.clear()
  } catch (err: unknown) {
    saveError.value = formatUnknownApiError(err) || t('pricing.base_rates_save_failed')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    await propertyStore.fetchHotel()
    await Promise.all([propertyStore.fetchRoomTypes(), pricingStore.fetchBaseRates()])
  } catch (err: unknown) {
    loadError.value = formatUnknownApiError(err) || t('pricing.load_failed')
  } finally {
    loading.value = false
  }
})
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

.base-rates__input-group {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.base-rates__input-group input {
  flex: 1;
  margin-bottom: 0;
  -moz-appearance: textfield;
  appearance: textfield;
}

.base-rates__input-group input::-webkit-outer-spin-button,
.base-rates__input-group input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.base-rates__currency {
  flex-shrink: 0;
  font-size: var(--text-caption-size);
  font-weight: var(--text-label-weight);
  color: var(--ink-secondary);
}
</style>
