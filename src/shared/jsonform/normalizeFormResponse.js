/**
 * Normalize API response to { schema, uischema, data } for JsonFormView.
 * Schema and uischema always come from the API (or cached runtime GET …/form), never from the client.
 */

/**
 * @param {string} camelKey
 * @returns {string}
 */
function camelToSnake(camelKey) {
  return camelKey.replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`)
}

/**
 * Fill template `data` from API payload: only keys already in `templateData` are written.
 * Values are taken from `payload.data` if present, else the payload root; each key also tries a snake_case alias.
 * @param {Record<string, unknown> | null | undefined} apiPayload
 * @param {Record<string, unknown>} [templateData]
 * @returns {Record<string, unknown>}
 */
export function overlayTemplateDataFromPayload(apiPayload, templateData = {}) {
  const base = { ...templateData }
  if (!apiPayload || typeof apiPayload !== 'object') return base

  const src =
    apiPayload.data != null && typeof apiPayload.data === 'object' && !Array.isArray(apiPayload.data)
      ? /** @type {Record<string, unknown>} */ (apiPayload.data)
      : /** @type {Record<string, unknown>} */ (apiPayload)

  for (const key of Object.keys(base)) {
    if (Object.prototype.hasOwnProperty.call(src, key) && src[key] !== undefined) {
      base[key] = src[key]
      continue
    }
    const snake = camelToSnake(key)
    if (snake !== key && Object.prototype.hasOwnProperty.call(src, snake) && src[snake] !== undefined) {
      base[key] = src[snake]
    }
  }
  return base
}

/**
 * @param {Record<string, unknown> | null | undefined} response - API FormResponse
 * @returns {{ schema: object, uischema: object, data: object } | null}
 */
export function normalizeGuestFormResponse(response) {
  if (!response?.schema || !response?.uischema) return null
  return {
    schema: response.schema,
    uischema: response.uischema,
    data: response.data ?? {},
  }
}

/**
 * Guest detail: full FormResponse from GET /api/guests/:id, or runtime template + entity merge.
 * @param {Record<string, unknown> | null | undefined} guestEntity
 * @param {{ schema?: object, uischema?: object, data?: object } | null} template - e.g. store guestFormTemplate
 * @returns {{ schema: object, uischema: object, data: object } | null}
 */
export function composeGuestFormFromEntity(guestEntity, template) {
  if (!guestEntity) return null
  const fromApi = normalizeGuestFormResponse(guestEntity)
  if (fromApi) return fromApi
  if (!template?.schema || !template?.uischema) return null
  return {
    schema: template.schema,
    uischema: template.uischema,
    data: overlayTemplateDataFromPayload(guestEntity, template.data ?? {}),
  }
}

/**
 * @param {Record<string, unknown>} response - API response (FormResponse or flat booking)
 * @returns {{ schema: object, uischema: object, data: object } | null} - null if not form response
 */
export function normalizeBookingFormResponse(response) {
  if (!response?.schema || !response?.uischema) return null
  return {
    schema: response.schema,
    uischema: response.uischema,
    data: response.data ?? {},
  }
}
