/**
 * Billing domain types: ledger entries, guest bill header, and summary.
 *
 * Sign convention (requirements §2):
 *   positive `balance_delta` → guest owes more  (charges, surcharges, refunds)
 *   negative `balance_delta` → balance reduced    (payments, credits, discounts)
 *
 * `outstanding_balance = SUM(balance_delta)` over all rows scoped to a bill.
 * Rows are append-only; corrections add new lines (never UPDATE existing rows).
 */

// ---------------------------------------------------------------------------
// Entry type catalog (requirements §6)
// ---------------------------------------------------------------------------

export type LedgerEntryType =
  | 'accommodation_night'
  | 'accommodation_correction'
  | 'rule_adjustment'
  | 'manual_adjustment'
  | 'service_charge'
  | 'payment'
  | 'refund'
  | 'correction'

// ---------------------------------------------------------------------------
// Ledger row
// ---------------------------------------------------------------------------

export interface LedgerEntryMetadata {
  date?: string
  room_type_id?: string
  rule_id?: string
  manual_reason?: string
  origin_module?: string
  external_ref?: string
  idempotency_key?: string
  reverses_entry_id?: string
}

export interface LedgerEntry {
  id: string
  guest_bill_id: string | null
  booking_id: string
  entry_type: LedgerEntryType
  /** Positive = guest owes more; negative = balance reduced. */
  balance_delta: number
  description?: string
  metadata?: LedgerEntryMetadata
  created_at: string
}

// ---------------------------------------------------------------------------
// Guest bill header
// ---------------------------------------------------------------------------

export type BillStatus = 'open' | 'closed'

export interface GuestBill {
  id: string
  booking_id: string
  guest_id: string | null
  status: BillStatus
  currency: string
  opened_at: string
  closed_at?: string
}

// ---------------------------------------------------------------------------
// Bill summary (computed on the client from bill + ledger rows)
// ---------------------------------------------------------------------------

export interface BillSummary {
  bill: GuestBill
  total_charges_minor: number
  total_payments_minor: number
  /** `SUM(balance_delta)` — positive = guest owes; zero/negative = overpaid. */
  outstanding_balance_minor: number
}

// ---------------------------------------------------------------------------
// Report DTOs (GET /api/billing/reports/*)
// ---------------------------------------------------------------------------

export interface ReportPeriod {
  from: string
  to: string
}

export interface ReportLedgerEntry {
  id: string
  booking_id: string
  entry_type: LedgerEntryType
  balance_delta: number
  description?: string
  metadata?: LedgerEntryMetadata
  created_at: string
}

export interface LedgerListResponse {
  entries: ReportLedgerEntry[]
}

export interface OverviewResponse {
  period: ReportPeriod
  accommodation: number
  rule_adjustments: number
  manual_adjustments: number
  service_charges: number
  total_charges: number
  payments: number
  refunds: number
  corrections: number
  total_outstanding: number
}

export interface DailyBreakdownRow {
  date: string
  charges: number
  payments: number
  refunds: number
  net: number
  entries_count: number
}

export interface DailyBreakdownResponse {
  period: ReportPeriod
  days: DailyBreakdownRow[]
}

export interface MonthlyBreakdownRow {
  month: string
  charges: number
  payments: number
  refunds: number
  net: number
  entries_count: number
}

export interface MonthlyBreakdownResponse {
  period: ReportPeriod
  months: MonthlyBreakdownRow[]
}

export interface OutstandingBillDTO {
  bill_id: string
  booking_id: string
  guest_id: string
  status: string
  opened_at: string
  total_charges: number
  total_payments: number
  outstanding: number
}

export interface OutstandingBalancesResponse {
  bills: OutstandingBillDTO[]
  total_outstanding: number
}
