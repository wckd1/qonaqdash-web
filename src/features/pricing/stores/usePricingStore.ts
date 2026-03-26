import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as pricingApi from '@/features/pricing/api'
import type { BaseRateItem, PricingRule } from '@/shared/types/commercial'

export const usePricingStore = defineStore('pricing', () => {
  const baseRates = ref<BaseRateItem[]>([])
  const rules = ref<PricingRule[]>([])

  let baseRatesFetched = false
  let rulesFetched = false

  async function fetchBaseRates(force = false) {
    if (baseRatesFetched && !force) return
    baseRates.value = await pricingApi.fetchBaseRates()
    baseRatesFetched = true
  }

  async function updateBaseRates(rates: BaseRateItem[]) {
    baseRates.value = await pricingApi.updateBaseRates(rates)
    return baseRates.value
  }

  async function fetchRules(force = false) {
    if (rulesFetched && !force) return
    rules.value = await pricingApi.fetchPricingRules()
    rulesFetched = true
  }

  async function createRule(body: pricingApi.CreatePricingRulePayload) {
    const created = await pricingApi.createPricingRule(body)
    rules.value = [...rules.value, created].sort((a, b) => a.priority - b.priority)
    return created
  }

  async function updateRule(id: string, body: pricingApi.UpdatePricingRulePayload) {
    const updated = await pricingApi.updatePricingRule(id, body)
    rules.value = rules.value
      .map((r) => (r.id === id ? updated : r))
      .sort((a, b) => a.priority - b.priority)
    return updated
  }

  async function deleteRule(id: string) {
    await pricingApi.deletePricingRule(id)
    rules.value = rules.value.filter((r) => r.id !== id)
  }

  return {
    baseRates,
    rules,
    fetchBaseRates,
    updateBaseRates,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
  }
})
