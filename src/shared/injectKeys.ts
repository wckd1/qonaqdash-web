import type { InjectionKey, Ref } from 'vue'
import type { EntryKey, UseQueryOptions } from '@pinia/colada'
import type { Schemas } from '@/shared/api/typed'
import type { FormNode } from '@/shared/types/forms'

/** Guest typeahead: API rows from `GET /api/guests?q=`. */
export type GuestSearchRow = {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  blocked?: boolean
}

/**
 * Guest typeahead: query options of the guest search for a search text. The
 * host view provides them, so FormDSL does not depend on the guests feature.
 */
export type GuestSearchQuery = (q: string) => {
  key: EntryKey
  query: UseQueryOptions<GuestSearchRow[]>['query']
}

export const guestSearchKey: InjectionKey<GuestSearchQuery> = Symbol('guestSearch')

/** Rooms free for the stay being edited (`GET /api/property/rooms/available`). */
export const availableRoomsKey: InjectionKey<Ref<Schemas['propertyhttp.AvailableRoomResponse'][]>> =
  Symbol('availableRooms')

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

/** Per-field HTML constraints (min/max) provided by the host view for datetime/date inputs. */
export type FieldConstraints = Record<string, { min?: string; max?: string }>
export const fieldConstraintsKey: InjectionKey<Ref<FieldConstraints>> = Symbol('fieldConstraints')
