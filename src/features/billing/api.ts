import api from '@/shared/api/client'
import type {
  GuestBill,
  LedgerEntry,
  LedgerEntryType,
  LedgerEntryMetadata,
  BillStatus,
} from '@/shared/types/billing'

export type {
  GuestBill,
  LedgerEntry,
  LedgerEntryType,
  LedgerEntryMetadata,
  BillStatus,
  BillSummary,
} from '@/shared/types/billing'

export interface BillResponse {
  bill: GuestBill
  entries: LedgerEntry[]
  outstanding_balance: number
}

function parseBillHeader(raw: unknown): GuestBill {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    id: String(o.id ?? ''),
    booking_id: String(o.booking_id ?? ''),
    guest_id: typeof o.guest_id === 'string' ? o.guest_id : null,
    status: String(o.status ?? 'open') as BillStatus,
    currency: typeof o.currency === 'string' ? o.currency : '',
    opened_at: String(o.opened_at ?? ''),
    closed_at: typeof o.closed_at === 'string' ? o.closed_at : undefined,
  }
}

function parseLedgerEntry(raw: unknown): LedgerEntry {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    id: String(o.id ?? ''),
    guest_bill_id: typeof o.guest_bill_id === 'string' ? o.guest_bill_id : null,
    booking_id: typeof o.booking_id === 'string' ? o.booking_id : '',
    entry_type: String(o.entry_type ?? '') as LedgerEntryType,
    balance_delta: typeof o.balance_delta === 'number' ? o.balance_delta : 0,
    description: typeof o.description === 'string' ? o.description : undefined,
    metadata:
      o.metadata && typeof o.metadata === 'object'
        ? (o.metadata as LedgerEntryMetadata)
        : undefined,
    created_at: String(o.created_at ?? ''),
  }
}

/**
 * GET /api/billing/bookings/{bookingId}/bill
 *
 * Returns bill header, all ledger entries, and outstanding balance.
 * 404 when no bill exists (bill opens at check-in).
 */
export function fetchGuestBill(bookingId: string): Promise<BillResponse> {
  return api.get(`/api/billing/bookings/${bookingId}/bill`).then(({ data }) => {
    const o = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
    return {
      bill: parseBillHeader(o.bill),
      entries: Array.isArray(o.entries) ? o.entries.map(parseLedgerEntry) : [],
      outstanding_balance: typeof o.outstanding_balance === 'number' ? o.outstanding_balance : 0,
    }
  })
}
