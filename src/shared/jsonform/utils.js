/**
 * Path and schema helpers for custom JSONForm renderers.
 * See docs/custom-jsonform-renderer.md §5.
 */

/**
 * Convert JSONForms scope (JSON Pointer style) to path array.
 * @param {string} scope - e.g. "#/properties/guest/properties/firstName"
 * @returns {string[]} - e.g. ["guest", "firstName"]
 */
export function scopeToPath(scope) {
  if (!scope || typeof scope !== 'string') return []
  const normalized = scope.replace(/^#\/?/, '').replace(/^properties\/?/, '')
  if (!normalized) return []
  return normalized.split('/').filter((p) => p !== 'properties')
}

/**
 * Read value at path (array of keys).
 * @param {Record<string, unknown>} obj
 * @param {string[]} path
 * @returns {unknown}
 */
export function getValueByPath(obj, path) {
  if (!path?.length) return undefined
  return path.reduce((acc, key) => (acc != null ? acc[key] : undefined), obj)
}

/**
 * Write value at path (array of keys). Mutates obj; creates nested objects as needed.
 * @param {Record<string, unknown>} obj
 * @param {string[]} path
 * @param {unknown} value
 */
export function setValueByPath(obj, path, value) {
  if (!path?.length) return
  let target = obj
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]
    if (target[key] == null || typeof target[key] !== 'object') {
      target[key] = {}
    }
    target = target[key]
  }
  target[path[path.length - 1]] = value
}

/**
 * Resolve JSON Schema entry for path (array of keys). Walks schema.properties only.
 * @param {Record<string, unknown>} schema - Root or fragment (e.g. item schema)
 * @param {string[]} path
 * @returns {Record<string, unknown> | undefined}
 */
export function getSchemaEntry(schema, path) {
  if (!schema || !path?.length) return undefined
  let node = schema
  for (const key of path) {
    node = node?.properties?.[key]
    if (node == null) return undefined
  }
  return node
}

/**
 * Format ISO date-time string for display (locale-aware). Date-only uses format "date".
 * @param {string} isoString - ISO 8601 date or date-time (e.g. 2026-03-15 or 2026-03-15T14:00:00Z)
 * @param {string} [locale='ru-RU']
 * @param {{ type: 'date' | 'date-time' }} [options] - schema format: date = DD.MM.YYYY, date-time = DD.MM.YYYY HH:mm
 * @returns {string} Formatted string or original if not parseable
 */
export function formatDateTime(isoString, locale = 'ru-RU', options = { type: 'date-time' }) {
  if (isoString == null || typeof isoString !== 'string') return String(isoString ?? '')
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return isoString
  if (options.type === 'date') {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  }
  const datePart = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
  const timePart = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
  return `${datePart} ${timePart}`
}
