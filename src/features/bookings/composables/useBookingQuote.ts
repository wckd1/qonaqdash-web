import { ref, watch, computed, onScopeDispose, toValue, type MaybeRefOrGetter } from 'vue'
import { fetchStayQuote } from '@/features/pricing/api'
import type { StayQuoteResponse } from '@/shared/types/commercial'
import { formatUnknownApiError } from '@/shared/i18n/apiError'

const DEBOUNCE_MS = 500

interface QuoteRoomLike {
  room_type?: string | null
  [key: string]: unknown
}

/**
 * Debounced, abort-safe booking quote composable.
 *
 * Watches check-in, check-out, rooms, and form data for changes;
 * after a 500 ms debounce it calls POST /api/property/pricing/quote.
 * Stale responses are discarded via sequential request IDs and AbortController.
 */
export function useBookingQuote(
  checkIn: MaybeRefOrGetter<string>,
  checkOut: MaybeRefOrGetter<string>,
  rooms: MaybeRefOrGetter<QuoteRoomLike[]>,
  bookingData: MaybeRefOrGetter<Record<string, unknown>>,
) {
  const quote = ref<StayQuoteResponse | null>(null)
  const quoteLoading = ref(false)
  const quoteError = ref('')

  let timer: ReturnType<typeof setTimeout> | null = null
  let ctl: AbortController | null = null
  let seqId = 0

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

  watch(
    () => {
      const ci = toValue(checkIn)
      const co = toValue(checkOut)
      const rts = validRoomTypeIds().join('|')
      const bd = JSON.stringify(toValue(bookingData))
      return `${ci}::${co}::${rts}::${bd}`
    },
    () => {
      if (timer != null) {
        clearTimeout(timer)
        timer = null
      }

      if (!canQuote.value) {
        quote.value = null
        quoteError.value = ''
        quoteLoading.value = false
        return
      }

      quoteLoading.value = true
      quoteError.value = ''
      timer = setTimeout(doFetch, DEBOUNCE_MS)
    },
    { immediate: true },
  )

  async function doFetch() {
    if (ctl) ctl.abort()
    ctl = new AbortController()
    const id = ++seqId

    const ci = toValue(checkIn)
    const co = toValue(checkOut)
    const rts = validRoomTypeIds()

    try {
      const result = await fetchStayQuote(
        {
          check_in: ci,
          check_out: co,
          rooms: rts.map((room_type_id) => ({ room_type_id })),
          booking_data: toValue(bookingData),
        },
        ctl.signal,
      )
      if (id !== seqId) return
      quote.value = result
      quoteError.value = ''
    } catch (err: unknown) {
      if (id !== seqId) return
      if (err instanceof DOMException && err.name === 'AbortError') return
      const code = (err as { code?: string })?.code
      if (code === 'ERR_CANCELED') return

      quote.value = null
      quoteError.value = formatUnknownApiError(err) || 'quote_failed'
    } finally {
      if (id === seqId) quoteLoading.value = false
    }
  }

  onScopeDispose(() => {
    if (timer != null) clearTimeout(timer)
    if (ctl) ctl.abort()
  })

  return { quote, quoteLoading, quoteError, canQuote }
}
