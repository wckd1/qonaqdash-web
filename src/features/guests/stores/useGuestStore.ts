import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FormRef, Guest, GuestDetailData } from '@/features/guests/api'
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
  /** `_form` from last `fetchGuest` / `updateGuest` — drives runtime form cache key. */
  const currentGuestFormRef = ref<FormRef | null>(null)

  /** Last `hash` from `GET …/form?target=edit` (create) — sent as `If-None-Match` on each create open. */
  const guestCreateFormHash = ref<string | null>(null)

  /** Session cache: GET /api/guests/form?target=edit (create flow). */
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
    const { data, formRef } = await guestsApi.fetchGuest(id)
    currentGuest.value = data
    currentGuestFormRef.value = formRef
    return data
  }

  /**
   * @param {{ force?: boolean, target?: 'edit' | 'view', definitionHash?: string | null }} [options] -
   *   Pass `definitionHash` from `_form.hash` on detail. Create (`edit` without hash) always revalidates via `GET` + `If-None-Match`.
   * @returns {Promise<{ schema: object, uischema: object, data: object }>}
   */
  async function fetchGuestForm(
    options: {
      force?: boolean
      target?: 'edit' | 'view'
      definitionHash?: string | null
    } = {},
  ) {
    const target = options.target ?? 'edit'
    const slot = target === 'view' ? guestFormRuntimeView : guestFormTemplate
    const hashOpt = options.definitionHash
    const isCreateEdit =
      target === 'edit' && (hashOpt === undefined || hashOpt === null || hashOpt === '')

    const res = await guestsApi.fetchGuestForm({
      target,
      force: options.force,
      definitionHash: hashOpt ?? null,
      revalidate: isCreateEdit && !options.force,
      ifNoneMatch: isCreateEdit && !options.force ? guestCreateFormHash.value : null,
    })
    if (isCreateEdit && typeof res.hash === 'string' && res.hash.trim()) {
      guestCreateFormHash.value = res.hash.trim()
    }
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
   * After PUT …/form/schema from settings: invalidate hash-keyed runtime cache; re-seed edit slot if complete.
   * @param {{ schema?: object, uischema?: object, data?: object }} res
   */
  function replaceGuestFormTemplate(res) {
    guestsApi.invalidateGuestRuntimeFormCache()
    guestCreateFormHash.value = null
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
    const { data: profile, formRef } = await guestsApi.updateGuest(id, data)
    currentGuest.value = profile
    currentGuestFormRef.value = formRef
    return profile
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
      if (curId === id) {
        currentGuest.value = null
        currentGuestFormRef.value = null
      }
    }
  }

  function clearCurrentGuest() {
    currentGuest.value = null
    currentGuestFormRef.value = null
  }

  return {
    guests,
    currentGuest,
    currentGuestFormRef,
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
