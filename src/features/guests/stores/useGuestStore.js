import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as guestsApi from '@/features/guests/api'

/**
 * @param {{ schema?: object, uischema?: object, data?: object }} res
 * @returns {{ schema: object, uischema: object, data: object }}
 */
function snapshotGuestForm(res) {
  return {
    schema: JSON.parse(JSON.stringify(res.schema ?? {})),
    uischema: JSON.parse(JSON.stringify(res.uischema ?? {})),
    data: JSON.parse(JSON.stringify(res.data ?? {})),
  }
}

export const useGuestStore = defineStore('guests', () => {
  const guests = ref([])
  const currentGuest = ref(null)

  /** Session cache for GET /api/guests/form (deep-cloned snapshots). */
  const guestFormTemplate = ref(null)

  /**
   * @param {{ q?: string }} [params] - Optional search query for server-side filtering.
   */
  async function fetchGuests(params = {}) {
    guests.value = await guestsApi.fetchGuests(params)
  }

  /**
   * @param {string} id
   * @returns {Promise<import('@/features/guests/api').Guest | import('@/features/guests/api').GuestDetailResponse>}
   */
  async function fetchGuest(id) {
    const guest = await guestsApi.fetchGuest(id)
    currentGuest.value = guest
    return guest
  }

  /**
   * @param {{ force?: boolean }} [options] - force=true always hits the network.
   * @returns {Promise<{ schema: object, uischema: object, data: object }>}
   */
  async function fetchGuestForm(options = {}) {
    if (!options.force && guestFormTemplate.value != null) {
      return JSON.parse(JSON.stringify(guestFormTemplate.value))
    }
    const res = await guestsApi.fetchGuestForm()
    guestFormTemplate.value = snapshotGuestForm(res)
    return JSON.parse(JSON.stringify(guestFormTemplate.value))
  }

  /**
   * Call after a successful form definition PUT from settings so the session cache matches the server.
   * @param {{ schema?: object, uischema?: object, data?: object }} res
   */
  function replaceGuestFormTemplate(res) {
    guestFormTemplate.value = snapshotGuestForm(res)
  }

  /**
   * @param {Record<string, unknown>} data - camelCase form data (firstName, lastName, email, phone)
   * @returns {Promise<import('@/features/guests/api').GuestDetailResponse>}
   */
  async function createGuest(data) {
    return guestsApi.createGuest(data)
  }

  /**
   * @param {string} id
   * @param {Record<string, unknown>} data - camelCase form data
   * @returns {Promise<import('@/features/guests/api').GuestDetailResponse>}
   */
  async function updateGuest(id, data) {
    const updated = await guestsApi.updateGuest(id, data)
    currentGuest.value = updated
    return updated
  }

  function clearCurrentGuest() {
    currentGuest.value = null
  }

  return {
    guests,
    currentGuest,
    fetchGuests,
    fetchGuest,
    fetchGuestForm,
    replaceGuestFormTemplate,
    createGuest,
    updateGuest,
    clearCurrentGuest,
  }
})
