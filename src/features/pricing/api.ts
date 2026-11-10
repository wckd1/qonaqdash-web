import type { RequestOptions } from '@/shared/api/client'
import { typedApi, type Schemas } from '@/shared/api/typed'
import { httpErrorResponse } from '@/shared/unknownError'

/** Base rate as it is saved: room type and rate. */
export type BaseRateItem = Schemas['pricinghttp.BaseRateItemDTO']
/** Base rate as it is read: also the name of its room type. */
export type BaseRate = Schemas['pricinghttp.BaseRateResponseItemDTO']
export type PricingRule = Schemas['pricinghttp.PricingRuleResponse']
export type PricingCondition = Schemas['pricinghttp.RuleConditionDTO']
export type PricingEffect = Schemas['pricinghttp.RuleEffectDTO']
export type EffectType = Schemas['domain.EffectType']
export type EffectApplyTo = Schemas['domain.ApplyTo']
export type RuleStatus = Schemas['domain.RuleStatus']
export type CreatePricingRulePayload = Schemas['pricinghttp.CreatePricingRuleRequest']
export type UpdatePricingRulePayload = Schemas['pricinghttp.UpdatePricingRuleRequest']
export type CalculateQuoteRequest = Schemas['pricinghttp.CalculateQuoteRequest']
export type StayQuoteResponse = Schemas['pricinghttp.StayQuoteResponse']
export type StayQuoteNight = Schemas['pricinghttp.QuoteNightDTO']
export type StayQuoteAdjustment = Schemas['pricinghttp.QuoteAdjustmentDTO']

/** Manual adjustment as the booking form edits it: a name and an effect are always set. */
export type ManualAdjustmentInput = Required<Schemas['pricinghttp.QuoteManualAdjustmentDTO']>

/** Stored accommodation snapshot of a booking, with the optional lists filled in. */
export interface AccommodationSnapshot {
  calculated_at: string
  version: number
  nights: StayQuoteNight[]
  nights_subtotal: number
  total_adjustments: StayQuoteAdjustment[]
  grand_total: number
}

/** Stored quote from `GET /api/pricing/bookings/{bookingId}/quote`. */
export interface StoredBookingQuote {
  accommodation: AccommodationSnapshot
  manual_adjustments: ManualAdjustmentInput[]
}

// ---------------------------------------------------------------------------
// Base rates
// ---------------------------------------------------------------------------

/** Rates of every active room type of the hotel, ordered by room type name (`0` when not set). */
export function fetchBaseRates(options: RequestOptions = {}): Promise<BaseRate[]> {
  return typedApi
    .get('/api/pricing/base-rates', { signal: options.signal })
    .then(({ data }) => data.rates)
}

export function updateBaseRates(rates: BaseRateItem[]): Promise<BaseRate[]> {
  return typedApi.put('/api/pricing/base-rates', { body: { rates } }).then(({ data }) => data.rates)
}

// ---------------------------------------------------------------------------
// Condition candidates
// ---------------------------------------------------------------------------

/** Field a rule condition can test (`pricinghttp.ConditionCandidateDTO`). */
export type ConditionCandidate = Schemas['pricinghttp.ConditionCandidateDTO']
/** Option of a select candidate; `value` is `null` for the "any" option. */
export type ConditionCandidateOption = Schemas['pricinghttp.ConditionCandidateOption']
export type ConditionCandidatesResult = Schemas['pricinghttp.ConditionsResponse']

/**
 * Condition candidates. With `ifNoneMatch` (the hash of the cached list) the
 * server answers `304` when nothing changed; then the result is `null`.
 */
export function fetchConditionCandidates(
  ifNoneMatch?: string,
  options: RequestOptions = {},
): Promise<ConditionCandidatesResult | null> {
  return typedApi
    .get('/api/pricing/conditions', {
      header: ifNoneMatch ? { 'If-None-Match': `"${ifNoneMatch}"` } : {},
      signal: options.signal,
      axios: { validateStatus: (s) => s === 200 || s === 304 },
    })
    .then((res) => ((res.status as number) === 304 ? null : res.data))
}

// ---------------------------------------------------------------------------
// Pricing Rules
// ---------------------------------------------------------------------------

export function fetchPricingRules(options: RequestOptions = {}): Promise<PricingRule[]> {
  return typedApi.get('/api/pricing/rules', { signal: options.signal }).then(({ data }) => data)
}

export function fetchPricingRule(id: string): Promise<PricingRule> {
  return typedApi.get('/api/pricing/rules/{id}', { path: { id } }).then(({ data }) => data)
}

export function createPricingRule(body: CreatePricingRulePayload): Promise<PricingRule> {
  return typedApi.post('/api/pricing/rules', { body }).then(({ data }) => data)
}

export function updatePricingRule(
  id: string,
  body: UpdatePricingRulePayload,
): Promise<PricingRule> {
  return typedApi.put('/api/pricing/rules/{id}', { path: { id }, body }).then(({ data }) => data)
}

export function deletePricingRule(id: string): Promise<void> {
  return typedApi.delete('/api/pricing/rules/{id}', { path: { id } }).then(() => undefined)
}

// ---------------------------------------------------------------------------
// Quote
// ---------------------------------------------------------------------------

export function fetchStayQuote(
  body: CalculateQuoteRequest,
  signal?: AbortSignal,
): Promise<StayQuoteResponse> {
  return typedApi.post('/api/pricing/quote', { body, signal }).then(({ data }) => data)
}

/** Stored quote with the optional lists filled in; adjustments without a name are dropped. */
function storedBookingQuote(data: Schemas['pricinghttp.BookingQuoteResponse']): StoredBookingQuote {
  return {
    accommodation: {
      calculated_at: data.calculated_at,
      version: data.version,
      nights: data.nights.map((night) => ({ ...night, adjustments: night.adjustments ?? [] })),
      nights_subtotal: data.nights_subtotal,
      total_adjustments: data.total_adjustments ?? [],
      grand_total: data.grand_total,
    },
    manual_adjustments: (data.manual_adjustments ?? []).flatMap((a) =>
      a.name?.trim()
        ? [
            {
              name: a.name,
              effect: {
                type: a.effect?.type ?? 'fixed',
                value: a.effect?.value ?? 0,
                apply_to: a.effect?.apply_to ?? 'total',
              },
            },
          ]
        : [],
    ),
  }
}

/**
 * Stored accommodation snapshot + manual adjustments for round-trip updates.
 * 404 (`pricing.not_found`) → null.
 */
export async function fetchStoredBookingQuote(
  bookingId: string,
  options: RequestOptions = {},
): Promise<StoredBookingQuote | null> {
  try {
    const { data } = await typedApi.get('/api/pricing/bookings/{bookingId}/quote', {
      path: { bookingId },
      signal: options.signal,
    })
    return storedBookingQuote(data)
  } catch (err: unknown) {
    if (httpErrorResponse(err)?.status === 404) return null
    throw err
  }
}
