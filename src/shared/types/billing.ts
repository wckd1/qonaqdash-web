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
  rule_id?: string
  manual_reason?: string
  origin_module?: string
  payment_method?: string
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
