import api from '@/shared/api/client'
import type {
  BaseRateItem,
  ConditionCandidate,
  PricingRule,
  PricingCondition,
  PricingEffect,
} from '@/shared/types/commercial'

export type { BaseRateItem, ConditionCandidate, PricingRule, PricingCondition, PricingEffect }

// ---------------------------------------------------------------------------
// Base rates
// ---------------------------------------------------------------------------

export function fetchBaseRates(): Promise<BaseRateItem[]> {
  return api.get('/api/property/pricing/base-rates').then(({ data }) => data?.rates ?? [])
}

export function updateBaseRates(rates: BaseRateItem[]): Promise<BaseRateItem[]> {
  return api
    .put('/api/property/pricing/base-rates', { rates })
    .then(({ data }) => data?.rates ?? [])
}

// ---------------------------------------------------------------------------
// Condition candidates
// ---------------------------------------------------------------------------

export interface ConditionCandidatesResult {
  conditions: ConditionCandidate[]
  hash: string
}

export function fetchConditionCandidates(
  ifNoneMatch?: string,
): Promise<ConditionCandidatesResult | null> {
  const headers: Record<string, string> = {}
  if (ifNoneMatch) headers['If-None-Match'] = `"${ifNoneMatch}"`
  return api
    .get('/api/property/pricing/conditions', {
      headers,
      validateStatus: (s) => s === 200 || s === 304,
    })
    .then((res) => {
      if (res.status === 304) return null
      return {
        conditions: res.data?.conditions ?? [],
        hash: res.data?.hash ?? '',
      }
    })
}

// ---------------------------------------------------------------------------
// Pricing Rules
// ---------------------------------------------------------------------------

export interface CreatePricingRulePayload {
  name: string
  priority: number
  status?: string
  conditions: PricingCondition[]
  effect: PricingEffect
}

export type UpdatePricingRulePayload = CreatePricingRulePayload

export function fetchPricingRules(): Promise<PricingRule[]> {
  return api.get('/api/property/pricing/rules').then(({ data }) => data ?? [])
}

export function fetchPricingRule(id: string): Promise<PricingRule> {
  return api.get(`/api/property/pricing/rules/${id}`).then(({ data }) => data)
}

export function createPricingRule(body: CreatePricingRulePayload): Promise<PricingRule> {
  return api.post('/api/property/pricing/rules', body).then(({ data }) => data)
}

export function updatePricingRule(
  id: string,
  body: UpdatePricingRulePayload,
): Promise<PricingRule> {
  return api.put(`/api/property/pricing/rules/${id}`, body).then(({ data }) => data)
}

export function deletePricingRule(id: string): Promise<void> {
  return api.delete(`/api/property/pricing/rules/${id}`).then(() => undefined)
}
