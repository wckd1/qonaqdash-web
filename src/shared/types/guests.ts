/** Guest list row (GET /api/guests). */
export interface Guest {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
}

/** GET /api/guests/:id — JSONForm-style or flat entity. */
export interface GuestDetailResponse {
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
