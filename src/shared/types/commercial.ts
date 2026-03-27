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
// Quote breakdown (server-returned, never computed client-side)
// ---------------------------------------------------------------------------

export interface QuoteAdjustment {
  rule_id?: string
  label?: string
  amount_minor: number
}

export interface QuoteLine {
  date: string
  base_amount_minor: number
  adjustments: QuoteAdjustment[]
  total_minor: number
}

export interface QuoteSummary {
  lines: QuoteLine[]
  subtotal_minor: number
  total_adjustments_minor: number
  total_minor: number
  currency: string
}

// ---------------------------------------------------------------------------
// Accommodation snapshot (embedded on booking aggregate after save)
// ---------------------------------------------------------------------------

export interface AccommodationSnapshot {
  quoted_at: string
  currency: string
  lines: QuoteLine[]
  total_minor: number
  pricing_context?: Record<string, string>
}
