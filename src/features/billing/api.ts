import type { RequestOptions } from '@/shared/api/client'
import { typedApi, type Schemas } from '@/shared/api/typed'

export type BillHeader = Schemas['billinghttp.BillHeader']
export type BillStatus = BillHeader['status']
export type BillResponse = Schemas['billinghttp.BillResponse']
export type LedgerEntry = Schemas['billinghttp.EntryDTO']
export type LedgerEntryType = LedgerEntry['entry_type']
export type RecordPaymentPayload = Schemas['billinghttp.PaymentRequest']
export type RecordRefundPayload = Schemas['billinghttp.RefundRequest']
export type AddAdjustmentPayload = Schemas['billinghttp.AdjustmentRequest']
export type MutationEntryResponse = Schemas['billinghttp.PaymentResponse']
export type AdjustmentResponse = Schemas['billinghttp.AdjustmentResponse']
export type ReportPeriod = Schemas['billinghttp.PeriodDTO']
export type ReportLedgerEntry = Schemas['billinghttp.LedgerEntryDTO']
export type LedgerListResponse = Schemas['billinghttp.LedgerListResponse']
export type OverviewResponse = Schemas['billinghttp.OverviewResponse']
export type DailyBreakdownRow = Schemas['billinghttp.DailyBreakdownRow']
export type DailyBreakdownResponse = Schemas['billinghttp.DailyBreakdownResponse']
export type MonthlyBreakdownRow = Schemas['billinghttp.MonthlyBreakdownRow']
export type MonthlyBreakdownResponse = Schemas['billinghttp.MonthlyBreakdownResponse']
export type OutstandingBillDTO = Schemas['billinghttp.OutstandingBillDTO']
export type OutstandingBalancesResponse = Schemas['billinghttp.OutstandingBalancesResponse']

/** Known keys of a ledger entry's `metadata`; which ones are set depends on `entry_type`. */
export type LedgerEntryMetadata = LedgerEntry['metadata']

// ---------------------------------------------------------------------------
// Folio
// ---------------------------------------------------------------------------

/**
 * Bill header, all ledger entries, and outstanding balance.
 * 404 when no bill exists (bill opens at check-in).
 */
export function fetchGuestBill(
  bookingId: string,
  options: RequestOptions = {},
): Promise<BillResponse> {
  return typedApi
    .get('/api/billing/bookings/{bookingId}/bill', { path: { bookingId }, signal: options.signal })
    .then(({ data }) => data)
}

export function recordPayment(
  bookingId: string,
  payload: RecordPaymentPayload,
): Promise<MutationEntryResponse> {
  return typedApi
    .post('/api/billing/bookings/{bookingId}/payments', { path: { bookingId }, body: payload })
    .then(({ data }) => data)
}

export function recordRefund(
  bookingId: string,
  payload: RecordRefundPayload,
): Promise<MutationEntryResponse> {
  return typedApi
    .post('/api/billing/bookings/{bookingId}/refunds', { path: { bookingId }, body: payload })
    .then(({ data }) => data)
}

export function addAdjustment(
  bookingId: string,
  payload: AddAdjustmentPayload,
): Promise<AdjustmentResponse> {
  return typedApi
    .post('/api/billing/bookings/{bookingId}/adjustments', { path: { bookingId }, body: payload })
    .then(({ data }) => data)
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export interface ReportDateRangeParams {
  from: string
  to: string
  /** Comma-separated entry types; ledger, daily and monthly reports only. */
  entry_type?: string
}

export interface LedgerReportParams extends ReportDateRangeParams {
  limit?: number
  offset?: number
}

/** `entry_type` only when it is set, so the request carries no empty parameter. */
function withEntryType(params: ReportDateRangeParams) {
  return params.entry_type
    ? { from: params.from, to: params.to, entry_type: params.entry_type }
    : { from: params.from, to: params.to }
}

export function fetchOverview(
  params: { from: string; to: string },
  options: RequestOptions = {},
): Promise<OverviewResponse> {
  return typedApi
    .get('/api/billing/reports/overview', {
      query: { from: params.from, to: params.to },
      signal: options.signal,
    })
    .then(({ data }) => data)
}

export function fetchReportLedger(
  params: LedgerReportParams,
  options: RequestOptions = {},
): Promise<LedgerListResponse> {
  return typedApi
    .get('/api/billing/reports/ledger', {
      query: { ...withEntryType(params), limit: params.limit, offset: params.offset },
      signal: options.signal,
    })
    .then(({ data }) => data)
}

export function fetchDailyBreakdown(
  params: ReportDateRangeParams,
  options: RequestOptions = {},
): Promise<DailyBreakdownResponse> {
  return typedApi
    .get('/api/billing/reports/ledger/daily', {
      query: withEntryType(params),
      signal: options.signal,
    })
    .then(({ data }) => data)
}

export function fetchMonthlyBreakdown(
  params: ReportDateRangeParams,
  options: RequestOptions = {},
): Promise<MonthlyBreakdownResponse> {
  return typedApi
    .get('/api/billing/reports/ledger/monthly', {
      query: withEntryType(params),
      signal: options.signal,
    })
    .then(({ data }) => data)
}

export function fetchOutstandingBalances(
  options: RequestOptions = {},
): Promise<OutstandingBalancesResponse> {
  return typedApi
    .get('/api/billing/reports/outstanding', { signal: options.signal })
    .then(({ data }) => data)
}
