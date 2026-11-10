import {
  defineQueryOptions,
  useInfiniteQuery,
  useMutation,
  useQueryCache,
  type QueryCache,
} from '@pinia/colada'
import { invalidateKeys } from '@/shared/api/queryCache'
import { httpErrorResponse } from '@/shared/unknownError'
import { getApiErrorCode } from '@/shared/i18n/apiError'
import * as billingApi from '@/features/billing/api'
import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'

/** Report filter as it goes into a key: plain JSON, no `undefined` values. */
function reportParams(params: billingApi.ReportDateRangeParams) {
  return { from: params.from, to: params.to, entry_type: params.entry_type ?? '' }
}

/** Back to the request shape: an empty entry type is not sent. */
function requestParams(params: billingApi.ReportDateRangeParams): billingApi.ReportDateRangeParams {
  return { from: params.from, to: params.to, entry_type: params.entry_type || undefined }
}

export const billingKeys = {
  all: ['billing'] as const,
  bill: (bookingId: string) => ['billing', 'bill', bookingId] as const,
  /** Every report; a ledger change touches all of them. */
  reports: ['billing', 'reports'] as const,
  /** The overview has no entry type filter, so only the period is in its key. */
  overview: (params: { from: string; to: string }) =>
    ['billing', 'reports', 'overview', { from: params.from, to: params.to }] as const,
  ledger: (params: billingApi.ReportDateRangeParams) =>
    ['billing', 'reports', 'ledger', reportParams(params)] as const,
  daily: (params: billingApi.ReportDateRangeParams) =>
    ['billing', 'reports', 'daily', reportParams(params)] as const,
  monthly: (params: billingApi.ReportDateRangeParams) =>
    ['billing', 'reports', 'monthly', reportParams(params)] as const,
  outstanding: ['billing', 'reports', 'outstanding'] as const,
}

/**
 * Bill of a booking; `null` while the booking has none (`billing.bill_not_found`,
 * it opens at check-in). A booking the caller cannot see (`billing.booking_not_found`)
 * is an error.
 */
export const billQuery = defineQueryOptions((bookingId: string) => ({
  key: billingKeys.bill(bookingId),
  query: async ({ signal }) => {
    try {
      return await billingApi.fetchGuestBill(bookingId, { signal })
    } catch (err: unknown) {
      const res = httpErrorResponse(err)
      if (res?.status === 404 && getApiErrorCode(res.data) === 'billing.bill_not_found') return null
      throw err
    }
  },
}))

export const overviewQuery = defineQueryOptions((params: { from: string; to: string }) => ({
  key: billingKeys.overview(params),
  query: ({ signal }) => billingApi.fetchOverview(params, { signal }),
}))

export const dailyBreakdownQuery = defineQueryOptions(
  (params: billingApi.ReportDateRangeParams) => ({
    key: billingKeys.daily(params),
    query: ({ signal }) => billingApi.fetchDailyBreakdown(requestParams(params), { signal }),
  }),
)

export const monthlyBreakdownQuery = defineQueryOptions(
  (params: billingApi.ReportDateRangeParams) => ({
    key: billingKeys.monthly(params),
    query: ({ signal }) => billingApi.fetchMonthlyBreakdown(requestParams(params), { signal }),
  }),
)

export const outstandingBalancesQuery = defineQueryOptions({
  key: billingKeys.outstanding,
  query: ({ signal }) => billingApi.fetchOutstandingBalances({ signal }),
})

export const LEDGER_PAGE_SIZE = 50

/** Ledger entries of a period, loaded page by page (`offset`). */
export function useReportLedgerQuery(
  params: MaybeRefOrGetter<billingApi.ReportDateRangeParams>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useInfiniteQuery<billingApi.LedgerListResponse, unknown, number>(() => {
    const current = toValue(params)
    return {
      key: billingKeys.ledger(current),
      enabled: toValue(enabled),
      initialPageParam: 0,
      query: ({ pageParam, signal }) =>
        billingApi.fetchReportLedger(
          { ...requestParams(current), limit: LEDGER_PAGE_SIZE, offset: pageParam },
          { signal },
        ),
      // A full page means there may be more entries.
      getNextPageParam: (lastPage, _allPages, lastPageParam) =>
        lastPage.entries.length >= LEDGER_PAGE_SIZE
          ? lastPageParam + lastPage.entries.length
          : null,
    }
  })
}

/** Keys a ledger entry of a booking changes: its bill, the reports and the booking balance. */
function invalidateAfterLedgerEntry(queryCache: QueryCache, bookingId: string) {
  return invalidateKeys(queryCache, [
    billingKeys.bill(bookingId),
    billingKeys.reports,
    ['bookings'],
  ])
}

export function useRecordPaymentMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (vars: { bookingId: string; payload: billingApi.RecordPaymentPayload }) =>
      billingApi.recordPayment(vars.bookingId, vars.payload),
    onSuccess: (_data, vars) => invalidateAfterLedgerEntry(queryCache, vars.bookingId),
  })
}

export function useRecordRefundMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (vars: { bookingId: string; payload: billingApi.RecordRefundPayload }) =>
      billingApi.recordRefund(vars.bookingId, vars.payload),
    onSuccess: (_data, vars) => invalidateAfterLedgerEntry(queryCache, vars.bookingId),
  })
}

export function useAddAdjustmentMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (vars: { bookingId: string; payload: billingApi.AddAdjustmentPayload }) =>
      billingApi.addAdjustment(vars.bookingId, vars.payload),
    onSuccess: (_data, vars) => invalidateAfterLedgerEntry(queryCache, vars.bookingId),
  })
}
