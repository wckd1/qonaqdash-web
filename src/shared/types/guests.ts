import type { FormNode } from './forms'

/** Guest list row (GET /api/guests). */
export interface Guest {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
}

/**
 * GET/PUT /api/guests/:id — flat data only.
 * Merge with `GET /api/guests/form?target=view|edit` on the client.
 */
export type GuestDetailData = GuestFormDataPartial & { id?: string }

/** Runtime `GET …/form?target=` — FormDSL definition + canonical `hash` (optional empty `data`). */
export interface GuestFormDefinitionResponse {
  definition?: FormNode
  hash?: string
  data?: GuestFormDataPartial
}

/** Core guest form `data` fields. */
export interface GuestFormFields {
  first_name: string
  last_name: string
  phone?: string
  email?: string
}

/** Runtime guest `data` may include extra keys from custom form definition. */
export type GuestFormData = GuestFormFields & { [key: string]: unknown }

/** Partial guest form `data` while loading or merging template. */
export type GuestFormDataPartial = Partial<GuestFormFields> & { [key: string]: unknown }
