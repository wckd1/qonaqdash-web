import { ref, watch, computed, onScopeDispose, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@pinia/colada'
import { stayQuoteQuery } from '@/features/pricing/queries'
import type {
  CalculateQuoteRequest,
  StayQuoteResponse,
  ManualAdjustmentInput,
} from '@/shared/types/commercial'
import { formatUnknownApiError } from '@/shared/i18n/apiError'

const DEBOUNCE_MS = 500

interface QuoteRoomLike {
  room_type?: string | null
  [key: string]: unknown
}

/** Request used while there is nothing to quote; the query is disabled then. */
const NO_REQUEST: CalculateQuoteRequest = { check_in: '', check_out: '', rooms: [] }

/**
 * Debounced booking quote.
 *
 * Watches check-in, check-out, rooms, form data, guest ID, and manual
 * adjustments for changes; after a 500 ms debounce it asks for
 * POST /api/pricing/quote. Each request is its own query entry, so a late
 * response for an earlier form state never replaces the current quote, and a
 * superseded request is aborted.
 */
export function useBookingQuote(
  checkIn: MaybeRefOrGetter<string>,
  checkOut: MaybeRefOrGetter<string>,
  rooms: MaybeRefOrGetter<QuoteRoomLike[]>,
  bookingData: MaybeRefOrGetter<Record<string, unknown>>,
  guestId?: MaybeRefOrGetter<string | undefined>,
  manualAdjustments?: MaybeRefOrGetter<ManualAdjustmentInput[]>,
  /** Existing booking id — send as `booking_id` on POST /api/pricing/quote. */
  bookingId?: MaybeRefOrGetter<string | undefined>,
) {
  function validRoomTypeIds(): string[] {
    return toValue(rooms)
      .map((r) => r.room_type)
      .filter((v): v is string => typeof v === 'string' && v !== '')
  }

  const canQuote = computed(() => {
    const ci = toValue(checkIn)
    const co = toValue(checkOut)
    if (!ci || !co) return false
    if (Number.isNaN(new Date(ci).getTime()) || Number.isNaN(new Date(co).getTime())) return false
    return validRoomTypeIds().length > 0
  })

  function buildRequest(): CalculateQuoteRequest {
    const gid = guestId ? toValue(guestId) : undefined
    const ma = manualAdjustments ? toValue(manualAdjustments) : undefined
    const bid = bookingId ? toValue(bookingId) : undefined
    return {
      check_in: toValue(checkIn),
      check_out: toValue(checkOut),
      rooms: validRoomTypeIds().map((room_type_id) => ({ room_type_id })),
      booking_data: toValue(bookingData),
      guest_id: gid || undefined,
      manual_adjustments: ma?.length ? ma : undefined,
      booking_id: bid || undefined,
    }
  }

  /** Request the quote is shown for; follows the form after the debounce. */
  const request = ref<CalculateQuoteRequest | null>(null)
  const debouncing = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  watch(
    () => {
      const ci = toValue(checkIn)
      const co = toValue(checkOut)
      const rts = validRoomTypeIds().join('|')
      const bd = JSON.stringify(toValue(bookingData))
      const gid = guestId ? (toValue(guestId) ?? '') : ''
      const ma = manualAdjustments ? JSON.stringify(toValue(manualAdjustments)) : '[]'
      const bid = bookingId ? (toValue(bookingId) ?? '') : ''
      return `${ci}::${co}::${rts}::${bd}::${gid}::${ma}::${bid}`
    },
    () => {
      if (timer != null) {
        clearTimeout(timer)
        timer = null
      }

      if (!canQuote.value) {
        request.value = null
        debouncing.value = false
        return
      }

      debouncing.value = true
      timer = setTimeout(() => {
        timer = null
        debouncing.value = false
        request.value = buildRequest()
      }, DEBOUNCE_MS)
    },
    { immediate: true },
  )

  // Keep the last quote on screen while the next one loads.
  const quoteQuery = useQuery(() => ({
    ...stayQuoteQuery(request.value ?? NO_REQUEST),
    enabled: !!request.value,
    placeholderData: (previous) => previous,
  }))

  const quote = computed<StayQuoteResponse | null>(() =>
    canQuote.value && request.value && !quoteQuery.error.value
      ? (quoteQuery.data.value ?? null)
      : null,
  )
  const quoteLoading = computed(
    () => canQuote.value && (debouncing.value || quoteQuery.isLoading.value),
  )
  const quoteError = computed(() =>
    canQuote.value && !debouncing.value && request.value && quoteQuery.error.value
      ? formatUnknownApiError(quoteQuery.error.value) || 'quote_failed'
      : '',
  )

  onScopeDispose(() => {
    if (timer != null) clearTimeout(timer)
  })

  return { quote, quoteLoading, quoteError, canQuote }
}
