import { ref, watch, reactive } from 'vue'

const GUEST_SEARCH_MIN_LENGTH = 2
const DEBOUNCE_MS = 300

/**
 * Build search query from guest section fields (firstName, lastName, phone, email).
 * @param {Record<string, unknown>} guest
 * @returns {string}
 */
function buildQuery(guest) {
  if (!guest || typeof guest !== 'object') return ''
  const first = guest.firstName ?? guest.first_name
  const last = guest.lastName ?? guest.last_name
  const phone = guest.phone
  const email = guest.email
  const parts = [first, last, phone, email].filter((v) => v != null && String(v).trim() !== '')
  return parts.map((v) => String(v).trim()).join(' ').trim()
}

/**
 * Map API guest (snake_case) to form guest (camelCase) with id.
 * @param {{ id: string, first_name?: string, last_name?: string, email?: string, phone?: string }} apiGuest
 * @returns {{ id: string, firstName: string, lastName: string, email: string, phone: string }}
 */
export function apiGuestToFormGuest(apiGuest) {
  if (!apiGuest) return {}
  return {
    id: apiGuest.id,
    firstName: apiGuest.first_name ?? '',
    lastName: apiGuest.last_name ?? '',
    email: apiGuest.email ?? '',
    phone: apiGuest.phone ?? '',
  }
}

/**
 * Guest typeahead for booking form guest section. Watches guest fields, runs debounced search, exposes results and select.
 * @param {() => Record<string, unknown>} getFormData - Returns current form data (has .guest)
 * @param {(q: string) => Promise<Array<{ id: string, first_name?: string, last_name?: string, email?: string, phone?: string }>>} searchGuests - e.g. (q) => fetchGuests({ q })
 * @returns Reactive search state + `select` (refs unwrap in templates when accessed on this object).
 */
export function useGuestSearch(getFormData, searchGuests) {
  const query = ref('')
  const results = ref([])
  const loading = ref(false)
  /** True between typing a valid query and debounce firing / request finishing */
  const debouncing = ref(false)

  let debounceTimer = null
  watch(
    () => buildQuery(getFormData()?.guest),
    (newQuery) => {
      clearTimeout(debounceTimer)
      if (!newQuery || newQuery.length < GUEST_SEARCH_MIN_LENGTH) {
        debouncing.value = false
        query.value = ''
        results.value = []
        return
      }
      debouncing.value = true
      debounceTimer = setTimeout(async () => {
        debouncing.value = false
        query.value = newQuery
        loading.value = true
        results.value = []
        try {
          const list = await searchGuests(newQuery)
          results.value = list ?? []
        } catch {
          results.value = []
        } finally {
          loading.value = false
        }
      }, DEBOUNCE_MS)
    },
    { immediate: true },
  )

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
    results.value = []
    return next
  }

  /**
   * Wrap in reactive so template access like `searchContext.loading` unwraps refs
   * (plain objects with refs do not auto-unwrap in templates — Ref is always truthy).
   */
  return reactive({ query, results, loading, debouncing, select })
}
