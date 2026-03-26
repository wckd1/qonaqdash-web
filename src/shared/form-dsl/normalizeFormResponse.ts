/**
 * Normalize API response to { definition, data } for FormView / FormEdit.
 * Definition always comes from the API (or cached runtime GET …/form), never from the client.
 */

import type { FormNode } from '@/shared/types/forms'

/**
 * Fill template `data` from API payload: only keys already in `templateData` are written.
 * Values are taken from `payload.data` if present, else the payload root; each key also tries a snake_case alias.
 */
export function overlayTemplateDataFromPayload(
  apiPayload: Record<string, unknown> | null | undefined,
  templateData: Record<string, unknown> = {},
): Record<string, unknown> {
  const base = { ...templateData }
  if (!apiPayload || typeof apiPayload !== 'object') return base

  const src =
    apiPayload.data != null &&
    typeof apiPayload.data === 'object' &&
    !Array.isArray(apiPayload.data)
      ? (apiPayload.data as Record<string, unknown>)
      : apiPayload

  for (const key of Object.keys(base)) {
    if (Object.prototype.hasOwnProperty.call(src, key) && src[key] !== undefined) {
      base[key] = src[key]
      continue
    }
    const snake = key.replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`)
    if (
      snake !== key &&
      Object.prototype.hasOwnProperty.call(src, snake) &&
      src[snake] !== undefined
    ) {
      base[key] = src[snake]
    }
  }
  return base
}

/** Normalized form envelope: definition + data. */
export interface NormalizedFormEnvelope {
  definition: FormNode
  data: Record<string, unknown>
}

/**
 * Normalize guest form response from API.
 */
export function normalizeGuestFormResponse(
  response: Record<string, unknown> | null | undefined,
): NormalizedFormEnvelope | null {
  if (!response?.definition) return null
  return {
    definition: response.definition as FormNode,
    data: (response.data as Record<string, unknown>) ?? {},
  }
}

/**
 * Guest detail: full form from GET /api/guests/:id, or runtime template + entity merge.
 */
export function composeGuestFormFromEntity(
  guestEntity: Record<string, unknown> | null | undefined,
  template: { definition?: FormNode; data?: Record<string, unknown> } | null | undefined,
): NormalizedFormEnvelope | null {
  if (!guestEntity) return null
  const fromApi = normalizeGuestFormResponse(guestEntity)
  if (fromApi) return fromApi
  if (!template?.definition) return null
  const templateData =
    template.data && typeof template.data === 'object' && !Array.isArray(template.data)
      ? template.data
      : {}
  const templateKeys = Object.keys(templateData)
  const data =
    templateKeys.length > 0
      ? overlayTemplateDataFromPayload(guestEntity, templateData)
      : guestEntity && typeof guestEntity === 'object'
        ? { ...guestEntity }
        : {}
  return {
    definition: template.definition,
    data,
  }
}

/**
 * Normalize booking form response from API.
 */
export function normalizeBookingFormResponse(
  response: Record<string, unknown> | null | undefined,
): NormalizedFormEnvelope | null {
  if (!response?.definition) return null
  return {
    definition: response.definition as FormNode,
    data: (response.data as Record<string, unknown>) ?? {},
  }
}
