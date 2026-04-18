<template>
  <div class="pricing-chrome">
    <p class="pricing-chrome__currency">
      <span class="pricing-chrome__currency-label">{{ t('pricing.currency_label') }}:</span>
      {{ currencyDisplay }}
      <router-link
        v-if="canAccessHotelGeneral"
        to="/manage/hotel"
        class="pricing-chrome__currency-link"
      >
        {{ t('pricing.currency_change_link') }}
      </router-link>
    </p>
  </div>
  <nav class="subnav" :aria-label="t('pricing.subnav_aria')">
    <router-link v-for="item in items" :key="item.to" :to="item.to" class="subnav__link">
      {{ item.label }}
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { usePropertyStore } from '@/features/property/stores/usePropertyStore'
import { getCurrencySymbol } from '@/shared/lib/money'
import { usePermissions } from '@/shared/composables/usePermissions'

const { t } = useI18n()
const { hotel } = storeToRefs(usePropertyStore())
const { canAccessHotelGeneral, canAccessPricingBaseRates, canAccessPricingRules } = usePermissions()

const currencyCode = computed(() => hotel.value?.currency ?? 'USD')
const currencyDisplay = computed(
  () => `${currencyCode.value} (${getCurrencySymbol(currencyCode.value)})`,
)

const items = computed(() =>
  [
    canAccessPricingBaseRates.value
      ? { to: '/manage/pricing/base-rates', label: t('pricing.tab_base_rates') }
      : null,
    canAccessPricingRules.value
      ? { to: '/manage/pricing/rules', label: t('pricing.tab_rules') }
      : null,
  ].filter((item): item is { to: string; label: string } => item !== null),
)
</script>

<style scoped>
.pricing-chrome {
  padding: 0;
}

.pricing-chrome__currency {
  margin: 0;
  font-size: var(--text-caption-size);
  color: var(--ink-secondary);
}

.pricing-chrome__currency-label {
  font-weight: var(--text-label-weight);
}

.pricing-chrome__currency-link {
  margin-left: var(--space-sm);
  font-size: var(--text-caption-size);
  color: var(--brand-primary);
  text-decoration: none;
}

.pricing-chrome__currency-link:hover {
  text-decoration: underline;
}
</style>
