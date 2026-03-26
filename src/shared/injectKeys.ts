import type { InjectionKey, Ref } from 'vue'
import type { Room } from '@/shared/types/property'
import type { FormNode } from '@/shared/types/forms'

/** Guest typeahead: API rows from `GET /api/guests?q=`. */
export type GuestSearchRow = {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
}

export type GuestSearchFn = (q: string) => Promise<GuestSearchRow[]>

export const guestSearchKey: InjectionKey<GuestSearchFn> = Symbol('guestSearch')

export const availableRoomsKey: InjectionKey<Ref<Room[]>> = Symbol('availableRooms')

/** FormDSL builder context (manage → form definition UI). */
export interface FormBuildContext {
  readonly variant: string
  openAddMenu: (parent: FormNode) => void
  openConfigure: (control: FormNode) => void
  removeNode: (target: FormNode) => void
  toggleLayoutNode: (target: FormNode) => void
  touch: () => void
}

export const formBuildKey: InjectionKey<FormBuildContext> = Symbol('formBuild')

export interface GuestPickerAnchorContext {
  setPickerAnchor: (el: HTMLElement | null) => void
  clearPickerAnchor: (el: HTMLElement | null) => void
}

export const guestPickerAnchorKey: InjectionKey<GuestPickerAnchorContext> =
  Symbol('guestPickerAnchor')
