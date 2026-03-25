/** Guest list row (GET /api/guests). */
export interface Guest {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
}

/**
 * GET/PUT /api/guests/:id — flat JSONForms `data` only (no schema/uischema).
 * Merge with `GET /api/guests/form?target=view|edit` on the client.
 */
export type GuestDetailData = GuestJsonFormDataPartial & { id?: string }

/** Runtime `GET …/form?target=` — schema + uischema only (optional empty `data`). */
export interface GuestFormSchemaResponse {
  schema?: unknown
  uischema?: unknown
  data?: GuestJsonFormDataPartial
}

/** Core guest JSONForm `data` fields (camelCase in UI). */
export interface GuestJsonFormFields {
  firstName: string
  lastName: string
  phone?: string
  email?: string
}

/** Runtime guest `data` may include extra keys from custom schema. */
export type GuestJsonFormData = GuestJsonFormFields & { [key: string]: unknown }

/** Partial guest form `data` while loading or merging template. */
export type GuestJsonFormDataPartial = Partial<GuestJsonFormFields> & { [key: string]: unknown }
