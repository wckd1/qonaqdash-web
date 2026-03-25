import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Guest, GuestDetailData } from '@/features/guests/api'
import * as guestsApi from '@/features/guests/api'

type GuestFormTemplate = { schema: object; uischema: object; data: object }

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
  const guests = ref<Guest[]>([])
  const currentGuest = ref<GuestDetailData | null>(null)

  /** Session cache: GET /api/guests/form?target=edit (create flow, default runtime). */
  const guestFormTemplate = ref<GuestFormTemplate | null>(null)
  /** Session cache: GET /api/guests/form?target=view (detail / panel). */
  const guestFormRuntimeView = ref<GuestFormTemplate | null>(null)

  /**
   * @param {{ q?: string }} [params] - Optional search query for server-side filtering.
   */
  async function fetchGuests(params = {}) {
    guests.value = await guestsApi.fetchGuests(params)
  }

  /**
   * @param {string} id
   * @returns {Promise<GuestDetailData>}
   */
  async function fetchGuest(id) {
    const guest = await guestsApi.fetchGuest(id)
    currentGuest.value = guest
    return guest
  }

  /**
   * @param {{ force?: boolean, target?: 'edit' | 'view' }} [options] - `target=edit` for create; `view` for read-only detail.
   * @returns {Promise<{ schema: object, uischema: object, data: object }>}
   */
  async function fetchGuestForm(options: { force?: boolean; target?: 'edit' | 'view' } = {}) {
    const target = options.target ?? 'edit'
    const slot = target === 'view' ? guestFormRuntimeView : guestFormTemplate
    if (!options.force && slot.value != null) {
      return JSON.parse(JSON.stringify(slot.value))
    }
    const res = await guestsApi.fetchGuestForm({ target })
    const snap = snapshotGuestForm(res)
    slot.value = snap
    return JSON.parse(JSON.stringify(snap))
  }

  /**
   * Manage → guest form (JSONForm build). Always hits GET …/form/schema.
   * @returns {Promise<{ schema: object, uischema: object, data: object }>}
   */
  async function fetchGuestFormSchema() {
    const res = await guestsApi.fetchGuestFormSchema()
    return {
      schema: JSON.parse(JSON.stringify(res.schema ?? {})),
      uischema: JSON.parse(JSON.stringify(res.uischema ?? {})),
      data: JSON.parse(JSON.stringify(res.data ?? {})),
    }
  }

  /**
   * After PUT …/form/schema from settings: invalidate runtime GET …/form caches; re-seed if response is complete.
   * @param {{ schema?: object, uischema?: object, data?: object }} res
   */
  function replaceGuestFormTemplate(res) {
    guestFormTemplate.value = null
    guestFormRuntimeView.value = null
    if (res?.schema != null && res?.uischema != null) {
      guestFormTemplate.value = snapshotGuestForm(res)
    }
  }

  /**
   * @param {Record<string, unknown>} data - camelCase form data (firstName, lastName, email, phone)
   * @returns {Promise<GuestDetailData>}
   */
  async function createGuest(data) {
    return guestsApi.createGuest(data)
  }

  /**
   * @param {string} id
   * @param {Record<string, unknown>} data - camelCase form data
   * @returns {Promise<GuestDetailData>}
   */
  async function updateGuest(id, data) {
    const updated = await guestsApi.updateGuest(id, data)
    currentGuest.value = updated
    return updated
  }

  /**
   * @param {string} id
   */
  async function deleteGuest(id) {
    await guestsApi.deleteGuest(id)
    guests.value = guests.value.filter((g) => g.id !== id)
    const cg = currentGuest.value
    if (cg && typeof cg === 'object') {
      const row = cg as Record<string, unknown>
      const curId = typeof row.id === 'string' ? row.id : undefined
      if (curId === id) currentGuest.value = null
    }
  }

  function clearCurrentGuest() {
    currentGuest.value = null
  }

  return {
    guests,
    currentGuest,
    guestFormTemplate,
    guestFormRuntimeView,
    fetchGuests,
    fetchGuest,
    fetchGuestForm,
    fetchGuestFormSchema,
    replaceGuestFormTemplate,
    createGuest,
    updateGuest,
    deleteGuest,
    clearCurrentGuest,
  }
})
