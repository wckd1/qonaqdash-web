/**
 * Pricing domain types: rules, conditions, effects, quote lines,
 * and the accommodation snapshot embedded on a booking.
 *
 * These mirror the backend contract from requirements §4-9
 * and will be consumed by the quote composable (FE2b) and
 * booking commercial snapshot (FE3).
 */

// ---------------------------------------------------------------------------
// Pricing rule conditions (requirements §8)
// ---------------------------------------------------------------------------

export interface PricingConditionDimensionEq {
  type: 'dimension_eq'
  dimension_id: string
  value: string
}

export interface PricingConditionDimensionIn {
  type: 'dimension_in'
  dimension_id: string
  values: string[]
}

export interface PricingConditionNightInCalendar {
  type: 'night_in_calendar'
  calendar_set_id: string
}

export interface PricingConditionNightDowIn {
  type: 'night_dow_in'
  days_of_week: number[]
}

export type PricingCondition =
  | PricingConditionDimensionEq
  | PricingConditionDimensionIn
  | PricingConditionNightInCalendar
  | PricingConditionNightDowIn

// ---------------------------------------------------------------------------
// Effect shape (requirements §9)
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
// Pricing rule
// ---------------------------------------------------------------------------

export interface PricingRule {
  id: string
  name?: string
  priority: number
  conditions: PricingCondition[]
  effect: PricingEffect
  room_type_ids?: string[]
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
