import { defineQueryOptions, useMutation, useQueryCache } from '@pinia/colada'
import { invalidateKeys } from '@/shared/api/queryCache'
import * as pricingApi from '@/features/pricing/api'
import type { BaseRateItem, CalculateQuoteRequest } from '@/shared/types/commercial'

export const pricingKeys = {
  all: ['pricing'] as const,
  baseRates: ['pricing', 'base-rates'] as const,
  conditions: ['pricing', 'conditions'] as const,
  rules: ['pricing', 'rules'] as const,
  ruleList: ['pricing', 'rules', 'list'] as const,
  /** Calculated stay quotes; they depend on base rates and rules. */
  quotes: ['pricing', 'quote'] as const,
}

export const baseRatesQuery = defineQueryOptions({
  key: pricingKeys.baseRates,
  query: ({ signal }) => pricingApi.fetchBaseRates({ signal }),
})

/**
 * Fields a rule condition can test. The request sends the hash of the cached
 * list; on `304` the cached list stays.
 */
export const conditionCandidatesQuery = defineQueryOptions({
  key: pricingKeys.conditions,
  query: async ({ signal, entry }) => {
    const cached = entry.state.value.data as pricingApi.ConditionCandidatesResult | undefined
    const fresh = await pricingApi.fetchConditionCandidates(cached?.hash || undefined, { signal })
    return fresh ?? cached ?? { conditions: [], hash: '' }
  },
})

export const ruleListQuery = defineQueryOptions({
  key: pricingKeys.ruleList,
  query: ({ signal }) => pricingApi.fetchPricingRules({ signal }),
})

export function useUpdateBaseRatesMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (rates: BaseRateItem[]) => pricingApi.updateBaseRates(rates),
    onSuccess: () => invalidateKeys(queryCache, [pricingKeys.baseRates, pricingKeys.quotes]),
  })
}

export function useCreateRuleMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (body: pricingApi.CreatePricingRulePayload) => pricingApi.createPricingRule(body),
    onSuccess: () => invalidateKeys(queryCache, [pricingKeys.rules, pricingKeys.quotes]),
  })
}

export function useUpdateRuleMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (vars: { id: string; body: pricingApi.UpdatePricingRulePayload }) =>
      pricingApi.updatePricingRule(vars.id, vars.body),
    onSuccess: () => invalidateKeys(queryCache, [pricingKeys.rules, pricingKeys.quotes]),
  })
}

export function useDeleteRuleMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (id: string) => pricingApi.deletePricingRule(id),
    onSuccess: () => invalidateKeys(queryCache, [pricingKeys.rules, pricingKeys.quotes]),
  })
}

/** Price of a stay as the booking form describes it (`POST /api/pricing/quote`). */
export const stayQuoteQuery = defineQueryOptions((body: CalculateQuoteRequest) => ({
  // `JSON.parse(JSON.stringify())` drops `undefined` fields, which a key cannot hold.
  key: [...pricingKeys.quotes, JSON.parse(JSON.stringify(body))] as const,
  query: ({ signal }) => pricingApi.fetchStayQuote(body, signal),
}))
