import { computed, ref, watch, reactive } from 'vue'
import { useQuery } from '@pinia/colada'
import type { GuestSearchQuery, GuestSearchRow } from '@/shared/injectKeys'

const GUEST_SEARCH_MIN_LENGTH = 2
const DEBOUNCE_MS = 300

/**
 * Build search query from guest section fields (first_name, last_name, phone, email).
 * @param {Record<string, unknown>} guest
 * @returns {string}
 */
export function buildGuestSearchQuery(guest) {
  if (!guest || typeof guest !== 'object') return ''
  const first = guest.first_name
  const last = guest.last_name
  const phone = guest.phone
  const email = guest.email
  const parts = [first, last, phone, email].filter((v) => v != null && String(v).trim() !== '')
  return parts
    .map((v) => String(v).trim())
    .join(' ')
    .trim()
}

/**
 * Map API guest to form guest with id.
 * @param {{ id: string, first_name?: string, last_name?: string, email?: string, phone?: string }} apiGuest
 * @returns {{ id: string, first_name: string, last_name: string, email: string, phone: string }}
 */
export function apiGuestToFormGuest(apiGuest) {
  if (!apiGuest) return {}
  return {
    id: apiGuest.id,
    first_name: apiGuest.first_name ?? '',
    last_name: apiGuest.last_name ?? '',
    email: apiGuest.email ?? '',
    phone: apiGuest.phone ?? '',
  }
}

/**
 * Guest typeahead for booking form guest section. Watches guest fields, runs a
 * debounced search query, exposes results and select.
 * @param {() => Record<string, unknown>} getFormData - Returns current form data (has .guest)
 * @param searchQuery - Query options of the guest search for a text, e.g. `guestListQuery`
 * @returns Reactive search state + `select` (refs unwrap in templates when accessed on this object).
 */
export function useGuestSearch(getFormData, searchQuery: GuestSearchQuery) {
  /** Search text the results are for; set when the debounce fires. */
  const query = ref('')
  /** True between typing a valid query and debounce firing */
  const debouncing = ref(false)
  /** Results closed by `select` or `dismiss` until the next search. */
  const dismissed = ref(false)

  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  watch(
    () => buildGuestSearchQuery(getFormData()?.guest),
    (newQuery) => {
      if (debounceTimer !== undefined) clearTimeout(debounceTimer)
      if (!newQuery || newQuery.length < GUEST_SEARCH_MIN_LENGTH) {
        debouncing.value = false
        query.value = ''
        return
      }
      debouncing.value = true
      debounceTimer = window.setTimeout(() => {
        debouncing.value = false
        dismissed.value = false
        query.value = newQuery
      }, DEBOUNCE_MS)
    },
    { immediate: true },
  )

  // Results are cached per search text, so a late response for an earlier
  // text never replaces the results of the current one.
  const search = useQuery(() => ({
    ...searchQuery(query.value),
    enabled: query.value.length >= GUEST_SEARCH_MIN_LENGTH,
  }))
  const active = computed(() => !!query.value && !dismissed.value)
  const results = computed<GuestSearchRow[]>(() =>
    active.value && !search.error.value ? (search.data.value ?? []) : [],
  )
  const loading = computed(() => active.value && search.isLoading.value)

  /**
   * Returns new form data with guest section filled from API guest. Caller should emit('update:modelValue', data).
   * Clears local query/results after call.
   */
  function select(apiGuest) {
    if (!apiGuest?.id) return null
    const guest = apiGuestToFormGuest(apiGuest)
    const next = JSON.parse(JSON.stringify(getFormData() ?? {}))
    if (!next.guest) next.guest = {}
    Object.assign(next.guest, guest)
    query.value = ''
    dismissed.value = true
    return next
  }

  /** Close typeahead UI: cancel pending search, drop in-flight state and results. */
  function dismiss() {
    if (debounceTimer !== undefined) clearTimeout(debounceTimer)
    debounceTimer = undefined
    debouncing.value = false
    dismissed.value = true
  }

  /**
   * Wrap in reactive so template access like `searchContext.loading` unwraps refs
   * (plain objects with refs do not auto-unwrap in templates — Ref is always truthy).
   */
  return reactive({ query, results, loading, debouncing, select, dismiss })
}
