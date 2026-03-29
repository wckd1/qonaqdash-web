import api from '@/shared/api/client'
import { parseStoredBookingQuoteResponse } from '@/shared/lib/accommodationQuoteParse'
import { httpErrorResponse } from '@/shared/unknownError'
import type {
  AccommodationSnapshot,
  BaseRateItem,
  CalculateQuoteRequest,
  ConditionCandidate,
  ManualAdjustmentInput,
  PricingRule,
  PricingCondition,
  PricingEffect,
  StayQuoteResponse,
} from '@/shared/types/commercial'

export type {
  BaseRateItem,
  CalculateQuoteRequest,
  ConditionCandidate,
  ManualAdjustmentInput,
  PricingRule,
  PricingCondition,
  PricingEffect,
  StayQuoteResponse,
}

/** Stored quote from GET /api/pricing/bookings/{bookingId}/quote. */
export interface StoredBookingQuote {
  accommodation: AccommodationSnapshot
  manual_adjustments: ManualAdjustmentInput[]
}

// ---------------------------------------------------------------------------
// Base rates
// ---------------------------------------------------------------------------

export function fetchBaseRates(): Promise<BaseRateItem[]> {
  return api.get('/api/pricing/base-rates').then(({ data }) => data?.rates ?? [])
}

export function updateBaseRates(rates: BaseRateItem[]): Promise<BaseRateItem[]> {
  return api
    .put('/api/pricing/base-rates', { rates })
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
    .get('/api/pricing/conditions', {
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
  return api.get('/api/pricing/rules').then(({ data }) => data ?? [])
}

export function fetchPricingRule(id: string): Promise<PricingRule> {
  return api.get(`/api/pricing/rules/${id}`).then(({ data }) => data)
}

export function createPricingRule(body: CreatePricingRulePayload): Promise<PricingRule> {
  return api.post('/api/pricing/rules', body).then(({ data }) => data)
}

export function updatePricingRule(
  id: string,
  body: UpdatePricingRulePayload,
): Promise<PricingRule> {
  return api.put(`/api/pricing/rules/${id}`, body).then(({ data }) => data)
}

export function deletePricingRule(id: string): Promise<void> {
  return api.delete(`/api/pricing/rules/${id}`).then(() => undefined)
}

// ---------------------------------------------------------------------------
// Quote
// ---------------------------------------------------------------------------

export function fetchStayQuote(
  body: CalculateQuoteRequest,
  signal?: AbortSignal,
): Promise<StayQuoteResponse> {
  return api.post('/api/pricing/quote', body, { signal }).then(({ data }) => data)
}

/**
 * Stored accommodation snapshot + manual adjustments for round-trip updates.
 * 404 (`pricing.not_found` per Swagger) → null.
 */
export async function fetchStoredBookingQuote(
  bookingId: string,
): Promise<StoredBookingQuote | null> {
  try {
    const { data } = await api.get(`/api/pricing/bookings/${encodeURIComponent(bookingId)}/quote`)
    return parseStoredBookingQuoteResponse(data)
  } catch (err: unknown) {
    if (httpErrorResponse(err)?.status === 404) return null
    throw err
  }
}
