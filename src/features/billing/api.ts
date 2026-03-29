import api from '@/shared/api/client'
import type {
  GuestBill,
  LedgerEntry,
  LedgerEntryType,
  LedgerEntryMetadata,
  BillStatus,
  ReportPeriod,
  ReportLedgerEntry,
  DailyBreakdownRow,
  MonthlyBreakdownRow,
} from '@/shared/types/billing'

export type {
  GuestBill,
  LedgerEntry,
  LedgerEntryType,
  LedgerEntryMetadata,
  BillStatus,
  BillSummary,
  ReportPeriod,
  ReportLedgerEntry,
  LedgerListResponse,
  OverviewResponse,
  DailyBreakdownRow,
  DailyBreakdownResponse,
  MonthlyBreakdownRow,
  MonthlyBreakdownResponse,
  OutstandingBillDTO,
  OutstandingBalancesResponse,
} from '@/shared/types/billing'

// ---------------------------------------------------------------------------
// Shared response / payload types
// ---------------------------------------------------------------------------

export interface BillResponse {
  bill: GuestBill
  entries: LedgerEntry[]
  outstanding_balance: number
}

export interface RecordPaymentPayload {
  amount: number
  description?: string
}

export interface MutationEntryResponse {
  entry: LedgerEntry
  balance: number
}

export interface RecordRefundPayload {
  amount: number
  reverses_entry_id: string
  description?: string
}

export interface AddAdjustmentPayload {
  amount: number
  description: string
}

export interface AdjustmentResponse {
  entry: LedgerEntry
  outstanding_balance: number
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

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

function parseMutationEntryResponse(data: unknown): MutationEntryResponse {
  const o = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
  return {
    entry: parseLedgerEntry(o.entry),
    balance: typeof o.balance === 'number' ? o.balance : 0,
  }
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

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

/** POST /api/billing/bookings/{bookingId}/payments */
export function recordPayment(
  bookingId: string,
  payload: RecordPaymentPayload,
): Promise<MutationEntryResponse> {
  return api
    .post(`/api/billing/bookings/${bookingId}/payments`, payload)
    .then(({ data }) => parseMutationEntryResponse(data))
}

/** POST /api/billing/bookings/{bookingId}/refunds */
export function recordRefund(
  bookingId: string,
  payload: RecordRefundPayload,
): Promise<MutationEntryResponse> {
  return api
    .post(`/api/billing/bookings/${bookingId}/refunds`, payload)
    .then(({ data }) => parseMutationEntryResponse(data))
}

/** POST /api/billing/bookings/{bookingId}/adjustments */
export function addAdjustment(
  bookingId: string,
  payload: AddAdjustmentPayload,
): Promise<AdjustmentResponse> {
  return api.post(`/api/billing/bookings/${bookingId}/adjustments`, payload).then(({ data }) => {
    const o = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
    return {
      entry: parseLedgerEntry(o.entry),
      outstanding_balance: typeof o.outstanding_balance === 'number' ? o.outstanding_balance : 0,
    }
  })
}

// ---------------------------------------------------------------------------
// Report parsers
// ---------------------------------------------------------------------------

function parsePeriod(raw: unknown): ReportPeriod {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    from: String(o.from ?? ''),
    to: String(o.to ?? ''),
  }
}

function parseReportLedgerEntry(raw: unknown): ReportLedgerEntry {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    id: String(o.id ?? ''),
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

function parseDailyRow(raw: unknown): DailyBreakdownRow {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    date: String(o.date ?? ''),
    charges: typeof o.charges === 'number' ? o.charges : 0,
    payments: typeof o.payments === 'number' ? o.payments : 0,
    refunds: typeof o.refunds === 'number' ? o.refunds : 0,
    net: typeof o.net === 'number' ? o.net : 0,
    entries_count: typeof o.entries_count === 'number' ? o.entries_count : 0,
  }
}

// ---------------------------------------------------------------------------
// Report API functions
// ---------------------------------------------------------------------------

export interface ReportDateRangeParams {
  from: string
  to: string
  entry_type?: string
}

export interface LedgerReportParams extends ReportDateRangeParams {
  limit?: number
  offset?: number
}

import type {
  OverviewResponse,
  DailyBreakdownResponse,
  MonthlyBreakdownResponse,
  OutstandingBalancesResponse,
  OutstandingBillDTO,
  LedgerListResponse,
} from '@/shared/types/billing'

function parseMonthlyRow(raw: unknown): MonthlyBreakdownRow {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    month: String(o.month ?? ''),
    charges: typeof o.charges === 'number' ? o.charges : 0,
    payments: typeof o.payments === 'number' ? o.payments : 0,
    refunds: typeof o.refunds === 'number' ? o.refunds : 0,
    net: typeof o.net === 'number' ? o.net : 0,
    entries_count: typeof o.entries_count === 'number' ? o.entries_count : 0,
  }
}

/** GET /api/billing/reports/overview */
export function fetchOverview(params: ReportDateRangeParams): Promise<OverviewResponse> {
  return api.get('/api/billing/reports/overview', { params }).then(({ data }) => {
    const o = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
    return {
      period: parsePeriod(o.period),
      accommodation: typeof o.accommodation === 'number' ? o.accommodation : 0,
      rule_adjustments: typeof o.rule_adjustments === 'number' ? o.rule_adjustments : 0,
      manual_adjustments: typeof o.manual_adjustments === 'number' ? o.manual_adjustments : 0,
      service_charges: typeof o.service_charges === 'number' ? o.service_charges : 0,
      total_charges: typeof o.total_charges === 'number' ? o.total_charges : 0,
      payments: typeof o.payments === 'number' ? o.payments : 0,
      refunds: typeof o.refunds === 'number' ? o.refunds : 0,
      corrections: typeof o.corrections === 'number' ? o.corrections : 0,
      total_outstanding: typeof o.total_outstanding === 'number' ? o.total_outstanding : 0,
    }
  })
}

/** GET /api/billing/reports/ledger */
export function fetchReportLedger(params: LedgerReportParams): Promise<LedgerListResponse> {
  return api.get('/api/billing/reports/ledger', { params }).then(({ data }) => {
    const o = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
    return {
      entries: Array.isArray(o.entries) ? o.entries.map(parseReportLedgerEntry) : [],
    }
  })
}

/** GET /api/billing/reports/ledger/daily */
export function fetchDailyBreakdown(
  params: ReportDateRangeParams,
): Promise<DailyBreakdownResponse> {
  return api.get('/api/billing/reports/ledger/daily', { params }).then(({ data }) => {
    const o = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
    return {
      period: parsePeriod(o.period),
      days: Array.isArray(o.days) ? o.days.map(parseDailyRow) : [],
    }
  })
}

/** GET /api/billing/reports/ledger/monthly */
export function fetchMonthlyBreakdown(
  params: ReportDateRangeParams,
): Promise<MonthlyBreakdownResponse> {
  return api.get('/api/billing/reports/ledger/monthly', { params }).then(({ data }) => {
    const o = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
    return {
      period: parsePeriod(o.period),
      months: Array.isArray(o.months) ? o.months.map(parseMonthlyRow) : [],
    }
  })
}

/** GET /api/billing/reports/outstanding */
export function fetchOutstandingBalances(): Promise<OutstandingBalancesResponse> {
  return api.get('/api/billing/reports/outstanding').then(({ data }) => {
    const o = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
    const parseBill = (raw: unknown): OutstandingBillDTO => {
      const b = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
      return {
        bill_id: String(b.bill_id ?? ''),
        booking_id: String(b.booking_id ?? ''),
        guest_id: String(b.guest_id ?? ''),
        status: String(b.status ?? ''),
        opened_at: String(b.opened_at ?? ''),
        total_charges: typeof b.total_charges === 'number' ? b.total_charges : 0,
        total_payments: typeof b.total_payments === 'number' ? b.total_payments : 0,
        outstanding: typeof b.outstanding === 'number' ? b.outstanding : 0,
      }
    }
    return {
      bills: Array.isArray(o.bills) ? o.bills.map(parseBill) : [],
      total_outstanding: typeof o.total_outstanding === 'number' ? o.total_outstanding : 0,
    }
  })
}
