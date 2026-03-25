import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FormRef, FormNode } from '@/shared/types/forms'
import type { Guest, GuestDetailData } from '@/features/guests/api'
import * as guestsApi from '@/features/guests/api'

type GuestFormTemplate = { definition: FormNode; data: Record<string, unknown> }

function snapshotGuestForm(res: { definition?: unknown; data?: unknown }): GuestFormTemplate {
  return {
    definition: JSON.parse(JSON.stringify(res.definition ?? {})),
    data: JSON.parse(JSON.stringify(res.data ?? {})),
  }
}

export const useGuestStore = defineStore('guests', () => {
  const guests = ref<Guest[]>([])
  const currentGuest = ref<GuestDetailData | null>(null)
  const currentGuestFormRef = ref<FormRef | null>(null)

  const guestCreateFormHash = ref<string | null>(null)

  const guestFormTemplate = ref<GuestFormTemplate | null>(null)
  const guestFormRuntimeView = ref<GuestFormTemplate | null>(null)

  async function fetchGuests(params = {}) {
    guests.value = await guestsApi.fetchGuests(params)
  }

  async function fetchGuest(id: string) {
    const { data, formRef } = await guestsApi.fetchGuest(id)
    currentGuest.value = data
    currentGuestFormRef.value = formRef
    return data
  }

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

  async function fetchGuestFormSchema() {
    const res = await guestsApi.fetchGuestFormSchema()
    return {
      definition: JSON.parse(JSON.stringify(res.definition ?? {})),
      data: JSON.parse(JSON.stringify(res.data ?? {})),
    }
  }

  function replaceGuestFormTemplate(res: { definition?: unknown; data?: unknown }) {
    guestsApi.invalidateGuestRuntimeFormCache()
    guestCreateFormHash.value = null
    guestFormTemplate.value = null
    guestFormRuntimeView.value = null
    if (res?.definition != null) {
      guestFormTemplate.value = snapshotGuestForm(res)
    }
  }

  async function createGuest(data: Record<string, unknown>) {
    return guestsApi.createGuest(data)
  }

  async function updateGuest(id: string, data: Record<string, unknown>) {
    const { data: profile, formRef } = await guestsApi.updateGuest(id, data)
    currentGuest.value = profile
    currentGuestFormRef.value = formRef
    return profile
  }

  async function deleteGuest(id: string) {
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
