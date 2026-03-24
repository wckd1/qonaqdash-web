import type { InjectionKey, Ref } from 'vue'
import type { Room } from '@/shared/types/property'

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

/** JSONForm builder context (manage → form schema UI). */
export interface JsonFormBuildContext {
  readonly variant: string
  openAddMenu: (parent: Record<string, unknown>) => void
  openConfigure: (control: Record<string, unknown>) => void
  removeNode: (target: Record<string, unknown>) => void
  toggleLayoutNode: (target: Record<string, unknown>) => void
  touch: () => void
}

export const jsonFormBuildKey: InjectionKey<JsonFormBuildContext> = Symbol('jsonFormBuild')

export interface GuestPickerAnchorContext {
  setPickerAnchor: (el: HTMLElement | null) => void
  clearPickerAnchor: (el: HTMLElement | null) => void
}

export const guestPickerAnchorKey: InjectionKey<GuestPickerAnchorContext> = Symbol(
  'guestPickerAnchor',
)
