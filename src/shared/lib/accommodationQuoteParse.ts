import type {
  AccommodationSnapshot,
  ManualAdjustmentInput,
  StayQuoteAdjustment,
  StayQuoteNight,
  PricingEffect,
} from '@/shared/types/commercial'

export function parseQuoteNight(raw: unknown): StayQuoteNight {
  const n = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    date: typeof n.date === 'string' ? n.date : '',
    room_type_id: typeof n.room_type_id === 'string' ? n.room_type_id : '',
    base_rate: typeof n.base_rate === 'number' ? n.base_rate : 0,
    adjustments: Array.isArray(n.adjustments) ? (n.adjustments as StayQuoteAdjustment[]) : [],
    subtotal: typeof n.subtotal === 'number' ? n.subtotal : 0,
  }
}

/** Parses accommodation snapshot object (root or nested under `accommodation`). */
export function parseAccommodationSnapshotFromUnknown(raw: unknown): AccommodationSnapshot | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const o = raw as Record<string, unknown>
  if (!Array.isArray(o.nights) || typeof o.grand_total !== 'number') return undefined
  return {
    calculated_at: typeof o.calculated_at === 'string' ? o.calculated_at : '',
    version: typeof o.version === 'number' ? o.version : 0,
    nights: o.nights.map(parseQuoteNight),
    nights_subtotal: typeof o.nights_subtotal === 'number' ? o.nights_subtotal : 0,
    total_adjustments: Array.isArray(o.total_adjustments)
      ? (o.total_adjustments as StayQuoteAdjustment[])
      : [],
    grand_total: o.grand_total,
  }
}

function parseOneManualAdjustment(item: unknown): ManualAdjustmentInput | null {
  if (!item || typeof item !== 'object') return null
  const a = item as Record<string, unknown>
  const name = typeof a.name === 'string' ? a.name : ''
  const eff =
    a.effect && typeof a.effect === 'object' ? (a.effect as Record<string, unknown>) : {}
  const effect: PricingEffect = {
    type: eff.type === 'percent' ? 'percent' : 'fixed',
    value: typeof eff.value === 'number' ? eff.value : 0,
    apply_to: eff.apply_to === 'per_night' ? 'per_night' : 'total',
  }
  return { name, effect }
}

/** Manual adjustments array from API (e.g. stored quote or booking body). */
export function parseManualAdjustmentListFromUnknown(raw: unknown): ManualAdjustmentInput[] {
  if (!Array.isArray(raw) || raw.length === 0) return []
  const result: ManualAdjustmentInput[] = []
  for (const item of raw) {
    const one = parseOneManualAdjustment(item)
    if (one && one.name.trim()) result.push(one)
  }
  return result
}

/**
 * GET /api/pricing/bookings/{id}/quote — stored snapshot JSON + `manual_adjustments`.
 */
export function parseStoredBookingQuoteResponse(raw: unknown): {
  accommodation: AccommodationSnapshot
  manual_adjustments: ManualAdjustmentInput[]
} | null {
  const accommodation = parseAccommodationSnapshotFromUnknown(raw)
  if (!accommodation) return null
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const manual_adjustments = parseManualAdjustmentListFromUnknown(o.manual_adjustments)
  return { accommodation, manual_adjustments }
}
