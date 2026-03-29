/**
 * Pricing domain types: rules, conditions, effects, quote lines,
 * and the accommodation snapshot embedded on a booking.
 */

// ---------------------------------------------------------------------------
// Pricing rule conditions
// ---------------------------------------------------------------------------

export type ConditionType = 'property' | 'specific_date' | 'date_range'
export type PropertyOperator = 'eq' | 'not_eq'
export type RuleStatus = 'active' | 'disabled' | 'invalid'

export interface PricingConditionProperty {
  type: 'property'
  field_id: string
  operator: PropertyOperator
  value?: string
}

export interface PricingConditionSpecificDate {
  type: 'specific_date'
  date: string
}

export interface PricingConditionDateRange {
  type: 'date_range'
  from: string
  to: string
}

export type PricingCondition =
  | PricingConditionProperty
  | PricingConditionSpecificDate
  | PricingConditionDateRange

// ---------------------------------------------------------------------------
// Effect shape
// ---------------------------------------------------------------------------

export type EffectType = 'percent' | 'fixed'
export type EffectApplyTo = 'per_night' | 'total'

export interface PricingEffect {
  type: EffectType
  /** percent → basis points (1000 = 10.00%); fixed → minor currency units. */
  value: number
  apply_to: EffectApplyTo
}

// ---------------------------------------------------------------------------
// Invalid reason
// ---------------------------------------------------------------------------

export interface InvalidReason {
  code: string
  message: string
  field_id?: string
  condition_index?: number
  details?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Pricing rule
// ---------------------------------------------------------------------------

export interface PricingRule {
  id: string
  name: string
  priority: number
  status: RuleStatus
  invalid_reason: InvalidReason | null
  conditions: PricingCondition[]
  effect: PricingEffect
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Condition candidates (from booking form index)
// ---------------------------------------------------------------------------

export interface ConditionCandidateOption {
  value: string
  label: string
}

export interface ConditionCandidate {
  field_id: string
  type: string
  label: string
  bind: string
  options: ConditionCandidateOption[]
}

// ---------------------------------------------------------------------------
// Base rates
// ---------------------------------------------------------------------------

export interface BaseRateItem {
  room_type_id: string
  base_rate_minor: number
}

// ---------------------------------------------------------------------------
// Adjustment sources (§6.3 integration.md)
// ---------------------------------------------------------------------------

export type AdjustmentSource = 'rule' | 'manual' | 'system'

// ---------------------------------------------------------------------------
// Manual adjustment input (quote request + booking create/update body)
// Matches propertyhttp.QuoteManualAdjustmentDTO.
// ---------------------------------------------------------------------------

export interface ManualAdjustmentInput {
  name: string
  effect: PricingEffect
}

// ---------------------------------------------------------------------------
// Accommodation snapshot (stored quote; GET /api/pricing/bookings/{id}/quote)
// Matches pricing snapshot shape (nights, totals, adjustments).
// ---------------------------------------------------------------------------

export interface AccommodationSnapshot {
  calculated_at: string
  version: number
  nights: StayQuoteNight[]
  nights_subtotal: number
  total_adjustments: StayQuoteAdjustment[]
  grand_total: number
}

// ---------------------------------------------------------------------------
// Quote request / response (POST /api/pricing/quote per swagger)
// ---------------------------------------------------------------------------

export interface QuoteRoomInput {
  room_type_id: string
}

export interface CalculateQuoteRequest {
  check_in: string
  check_out: string
  rooms: QuoteRoomInput[]
  booking_data?: Record<string, unknown>
  guest_id?: string
  manual_adjustments?: ManualAdjustmentInput[]
  /** When recalculating for an existing reservation (POST /api/pricing/quote). */
  booking_id?: string
}

export interface StayQuoteAdjustment {
  source: AdjustmentSource
  source_id: string | null
  name: string
  type: EffectType
  apply_to: EffectApplyTo
  /** Raw rule value: basis points for percent, minor units for fixed. */
  value: number
  /** Computed adjustment amount in minor currency units. */
  amount: number
}

export interface StayQuoteNight {
  date: string
  room_type_id: string
  base_rate: number
  adjustments: StayQuoteAdjustment[]
  subtotal: number
}

export interface StayQuoteResponse {
  nights: StayQuoteNight[]
  nights_subtotal: number
  total_adjustments: StayQuoteAdjustment[]
  grand_total: number
}
