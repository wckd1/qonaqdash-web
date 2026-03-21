/**
 * Path and schema helpers for custom JSONForm renderers.
 * See docs/custom-jsonform-renderer.md §5.
 */

/**
 * Fallback heading when a Group has no `label` (API often sends only `id`, e.g. main / booking / guest).
 * @param {string | undefined} id
 * @returns {string}
 */
export function humanizeGroupId(id) {
  if (id == null || id === '') return 'Group'
  const known = { main: 'Main', booking: 'Booking', guest: 'Guest' }
  if (known[id]) return known[id]
  return String(id)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * `id` values assigned when adding a Group in the WYSIWYG builder (`field_<alnum>`).
 * @param {unknown} id
 * @returns {boolean}
 */
export function isGeneratedFormBuilderGroupId(id) {
  return typeof id === 'string' && /^field_[a-z0-9]+$/i.test(id)
}

/**
 * @param {{ label?: string, id?: string }} uischema - Group element
 * @returns {string} Empty when there is no user `label` and the id is a builder-generated `field_*` or the core guest-form group `main` (do not show a fake "Main" title).
 */
export function resolveGroupTitle(uischema) {
  const label = uischema?.label
  if (typeof label === 'string' && label.trim()) return label.trim()
  const id = uischema?.id
  if (isGeneratedFormBuilderGroupId(id)) return ''
  if (id === 'main') return ''
  return humanizeGroupId(id)
}

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
 * Build a default object from a JSON Schema object fragment (e.g. schema.properties.guest).
 * Each property gets its schema default or empty string. Used for "clear selection" to reset guest section.
 * @param {Record<string, unknown>} [schema] - Object schema with properties
 * @returns {Record<string, unknown>}
 */
export function getDefaultObjectFromSchema(schema) {
  if (!schema?.properties || typeof schema.properties !== 'object') return {}
  const out = {}
  for (const key of Object.keys(schema.properties)) {
    const prop = schema.properties[key]
    if (prop && typeof prop === 'object' && 'default' in prop) {
      out[key] = prop.default
    } else {
      out[key] = ''
    }
  }
  return out
}

/**
 * Build oneOf array for roomID from API room list. Use when room options are loaded via available-rooms endpoint.
 * @param {Array<{ id: string, number?: string, room_type_id?: string, room_type_name?: string }>} rooms - From fetchAvailableRooms
 * @param {Array<{ const?: string | null, title?: string }>} [nullOption] - Optional null option from schema (e.g. [{ const: null, title: 'Любой' }])
 * @returns {Array<{ const: string | null, title: string, roomType?: string }>}
 */
export function buildRoomOneOfFromRooms(rooms, nullOption) {
  const base =
    Array.isArray(nullOption) && nullOption.length > 0 ? nullOption : [{ const: null, title: '' }]
  if (!Array.isArray(rooms) || rooms.length === 0) return base
  const roomOpts = rooms.map((r) => ({
    const: r.id,
    title: r.number ?? r.id,
    /** Must match `booking.rooms[].roomType` (room type UUID from schema). */
    roomType: r.room_type_id,
    roomTypeName: r.room_type_name,
  }))
  return [...base, ...roomOpts]
}

/**
 * Filter room oneOf options for a single row in booking.rooms: by roomType and exclude already-selected room IDs in other rows.
 * @param {Record<string, unknown>} fullData - Full form data (has booking.rooms)
 * @param {Record<string, unknown>} rowItem - Current row (roomType, roomID)
 * @param {number} [currentIndex] - Index of current row in booking.rooms
 * @param {Array<{ const?: string | null, title?: string, roomType?: string, roomTypeName?: string }>} oneOf - Schema oneOf or from buildRoomOneOfFromRooms
 * @returns {{ value: string | null, label: string }[]}
 */
export function getFilteredRoomSelectOptions(fullData, rowItem, currentIndex, oneOf) {
  const rooms = fullData?.booking?.rooms
  if (!Array.isArray(rooms) || !Array.isArray(oneOf) || oneOf.length === 0) {
    return oneOf.map((opt) => ({
      value: opt.const ?? null,
      label: opt.title ?? String(opt.const ?? ''),
    }))
  }
  const currentRoomType = rowItem?.roomType
  const selectedInOtherRows = new Set(
    rooms
      .filter((_, idx) => idx !== currentIndex)
      .map((r) => r?.roomID)
      .filter((id) => id != null),
  )
  return oneOf
    .filter(
      (opt) =>
        (opt.const == null || opt.const === rowItem?.roomID || !selectedInOtherRows.has(opt.const)) &&
        (!currentRoomType ||
          opt.roomType === undefined ||
          opt.roomType === currentRoomType ||
          opt.roomTypeName === currentRoomType),
    )
    .map((opt) => ({
      value: opt.const ?? null,
      label: opt.title ?? String(opt.const ?? ''),
    }))
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
