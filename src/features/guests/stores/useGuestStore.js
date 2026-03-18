import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as guestsApi from '@/features/guests/api'

export const useGuestStore = defineStore('guests', () => {
  const guests = ref([])
  const currentGuest = ref(null)

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
   * @returns {Promise<{ schema: object, uischema: object, data: object }>}
   */
  async function fetchGuestForm() {
    return guestsApi.fetchGuestForm()
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
    createGuest,
    updateGuest,
    clearCurrentGuest,
  }
})
