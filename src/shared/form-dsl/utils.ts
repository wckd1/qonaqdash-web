/**
 * Utility helpers for FormDSL renderers.
 */

import { i18n } from '@/i18n'
import { resolveFormCatalogString } from '@/shared/i18n/formCatalog'
import { intlLocaleFromAppLocale } from '@/shared/i18n/resolveLocale'
import type { FormSelectItem } from '@/shared/types/forms'

// ---------------------------------------------------------------------------
// Bind path helpers
// ---------------------------------------------------------------------------

/**
 * Convert dot-path `bind` to path array.
 * @example bindToPath('guest.first_name') // ['guest', 'first_name']
 */
export function bindToPath(bind: string | undefined | null): string[] {
  if (!bind || typeof bind !== 'string') return []
  return bind.split('.').filter(Boolean)
}

/**
 * API often returns `{ field, field_label }` on the same object (e.g. room_type + room_type_label).
 * Given the full dot-bind for the field, returns the dot-bind for the companion display field.
 * @example companionLabelFullBind('booking.rooms.0.room_type', 'room_type') → 'booking.rooms.0.room_type_label'
 */
export function companionLabelFullBind(fullFieldBind: string, fieldBind: string): string {
  if (!fieldBind || !fullFieldBind) return ''
  if (fullFieldBind === fieldBind) return `${fieldBind}_label`
  if (fullFieldBind.endsWith(`.${fieldBind}`)) {
    return `${fullFieldBind.slice(0, -(fieldBind.length + 1))}.${fieldBind}_label`
  }
  return ''
}

/**
 * Read value at dot-path (array of keys).
 */
export function getValueByPath(
  obj: Record<string, unknown> | undefined | null,
  path: string[],
): unknown {
  if (!path?.length || obj == null) return undefined
  return path.reduce<unknown>(
    (acc, key) =>
      acc != null && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined,
    obj,
  )
}

/**
 * Read value by bind string (convenience wrapper).
 */
export function getValueByBind(
  obj: Record<string, unknown> | undefined | null,
  bind: string | undefined | null,
): unknown {
  return getValueByPath(obj, bindToPath(bind))
}

/**
 * Write value at path (array of keys). Mutates obj; creates nested objects as needed.
 */
export function setValueByPath(obj: Record<string, unknown>, path: string[], value: unknown): void {
  if (!path?.length) return
  let target: Record<string, unknown> = obj
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]
    if (target[key] == null || typeof target[key] !== 'object') {
      target[key] = {}
    }
    target = target[key] as Record<string, unknown>
  }
  target[path[path.length - 1]] = value
}

// ---------------------------------------------------------------------------
// Group title
// ---------------------------------------------------------------------------

/**
 * Fallback heading when a Group has no `title`.
 */
export function humanizeGroupId(id: string | undefined): string {
  if (id == null || id === '') return i18n.global.t('form_dsl.groups.generic')
  const knownKeys: Record<string, string> = {
    main: 'form_dsl.groups.main',
    booking: 'form_dsl.groups.booking',
    guest: 'form_dsl.groups.guest',
  }
  if (knownKeys[id]) return i18n.global.t(knownKeys[id])
  return String(id)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * `id` values assigned when adding a Group in the WYSIWYG builder (`field_<alnum>`).
 */
export function isGeneratedFormBuilderGroupId(id: unknown): boolean {
  return typeof id === 'string' && /^field_[a-z0-9]+$/i.test(id)
}

/**
 * Resolve group display title from FormDSL group node.
 * Empty when there is no `title` and the id is builder-generated `field_*` or `main`.
 */
export function resolveGroupTitle(node: { title?: string; id?: string }): string {
  const title = node?.title
  if (typeof title === 'string' && title.trim()) return resolveFormCatalogString(title.trim())
  const id = node?.id
  if (isGeneratedFormBuilderGroupId(id)) return ''
  if (id === 'main') return ''
  return humanizeGroupId(id)
}

// ---------------------------------------------------------------------------
// Room select helpers (booking.rooms)
// ---------------------------------------------------------------------------

/**
 * Build select items for room_id from API room list.
 */
export function buildRoomSelectItemsFromRooms(
  rooms: Array<{ id: string; number?: string; room_type_id?: string; room_type_name?: string }>,
  nullOption?: FormSelectItem[],
): (FormSelectItem & { room_type?: string; room_type_name?: string })[] {
  const base: (FormSelectItem & { room_type?: string; room_type_name?: string })[] =
    Array.isArray(nullOption) && nullOption.length > 0
      ? nullOption.map((o) => ({ ...o }))
      : [{ value: null, label: '' }]
  if (!Array.isArray(rooms) || rooms.length === 0) return base
  const roomOpts = rooms.map((r) => ({
    value: r.id,
    label: r.number ?? r.id,
    room_type: r.room_type_id,
    room_type_name: r.room_type_name,
  }))
  return [...base, ...roomOpts]
}

/**
 * Union of GET …/rooms/available rows and any `booking.rooms[].room_id` already chosen in the form.
 */
export function mergeAvailableRoomsWithFormRoomAssignments(
  availableRooms:
    | Array<{ id: string; number?: string; room_type_id?: string; room_type_name?: string }>
    | undefined,
  formData: Record<string, unknown> | undefined,
): Array<{ id: string; number?: string; room_type_id?: string; room_type_name?: string }> {
  const list = Array.isArray(availableRooms) ? availableRooms : []
  const byId = new Map<
    string,
    { id: string; number?: string; room_type_id?: string; room_type_name?: string }
  >()
  for (const r of list) {
    const id = r?.id != null ? String(r.id) : ''
    if (!id) continue
    byId.set(id, { ...r, id })
  }
  const rows = (formData?.stay as Record<string, unknown> | undefined)?.rooms
  if (!Array.isArray(rows)) return [...byId.values()]
  for (const row of rows) {
    const r = row as Record<string, unknown> | undefined
    const id = r?.room_id
    if (id == null || id === '') continue
    const key = String(id)
    if (byId.has(key)) continue
    const rt = r?.room_type
    byId.set(key, {
      id: key,
      number:
        typeof r?.room_id_label === 'string' && (r.room_id_label as string).trim() !== ''
          ? (r.room_id_label as string)
          : key,
      room_type_id: rt != null && rt !== '' ? String(rt) : '',
      room_type_name:
        typeof r?.room_type_label === 'string' && (r.room_type_label as string).trim() !== ''
          ? (r.room_type_label as string)
          : undefined,
    })
  }
  return [...byId.values()]
}

/**
 * Room assigned to this row may be absent from GET …/rooms/available (still occupied by this booking).
 */
function mergeAssignedRoomIntoSelectOptions(
  mapped: FormSelectItem[],
  rowItem: Record<string, unknown>,
): FormSelectItem[] {
  const assignedId = rowItem?.room_id
  if (assignedId == null || assignedId === '') return mapped
  const hasAssigned = mapped.some((o) => o.value === assignedId)
  if (hasAssigned) return mapped
  const roomLabel =
    typeof rowItem?.room_id_label === 'string' && (rowItem.room_id_label as string).trim() !== ''
      ? (rowItem.room_id_label as string)
      : String(assignedId)
  const nullIdx = mapped.findIndex((o) => o.value === null || o.value === '')
  const insertAt = nullIdx >= 0 ? nullIdx + 1 : 0
  const next = [...mapped]
  next.splice(insertAt, 0, {
    value: assignedId,
    label: resolveFormCatalogString(roomLabel),
  })
  return next
}

/**
 * Filter room select items for a single row in booking.rooms:
 * by room_type and exclude already-selected room IDs in other rows.
 */
export function getFilteredRoomSelectOptions(
  fullData: Record<string, unknown>,
  rowItem: Record<string, unknown>,
  currentIndex: number | undefined,
  items: (FormSelectItem & { room_type?: string; room_type_name?: string })[],
): FormSelectItem[] {
  if (!Array.isArray(items)) return []

  const mapItems = () =>
    items.map((opt) => ({
      value: opt.value ?? null,
      label: resolveFormCatalogString(opt.label ?? String(opt.value ?? '')),
    }))

  const currentRoomType = rowItem?.room_type
  const roomTypeKey =
    currentRoomType == null || currentRoomType === '' ? '' : String(currentRoomType)
  const roomTypeUnset = roomTypeKey === ''
  if (roomTypeUnset) {
    const placeholders = items.filter((opt) => opt.value == null || opt.value === undefined)
    return placeholders.map((opt) => ({
      value: opt.value ?? null,
      label: resolveFormCatalogString(opt.label ?? String(opt.value ?? '')),
    }))
  }

  const stay = fullData?.stay as Record<string, unknown> | undefined
  const rooms = stay?.rooms
  if (!Array.isArray(rooms) || items.length === 0) {
    return mergeAssignedRoomIntoSelectOptions(mapItems(), rowItem)
  }

  const selectedInOtherRows = new Set(
    rooms
      .filter((_, idx) => idx !== currentIndex)
      .map((r: Record<string, unknown>) => r?.room_id)
      .filter((id) => id != null),
  )

  const mapped: FormSelectItem[] = items
    .filter(
      (opt) =>
        (opt.value == null ||
          opt.value === rowItem?.room_id ||
          !selectedInOtherRows.has(opt.value)) &&
        (opt.room_type === undefined ||
          String(opt.room_type ?? '') === roomTypeKey ||
          String(opt.room_type_name ?? '') === roomTypeKey),
    )
    .map((opt) => ({
      value: opt.value ?? null,
      label: resolveFormCatalogString(opt.label ?? String(opt.value ?? '')),
    }))

  return mergeAssignedRoomIntoSelectOptions(mapped, rowItem)
}

// ---------------------------------------------------------------------------
// Date / time formatting
// ---------------------------------------------------------------------------

/**
 * Format ISO date-time string for display (locale-aware).
 */
export function formatDateTime(
  isoString: string | null | undefined,
  localeOverride?: string,
  options: { type: 'date' | 'date-time' } = { type: 'date-time' },
): string {
  if (isoString == null || typeof isoString !== 'string') return String(isoString ?? '')
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return isoString
  const locale = localeOverride ?? intlLocaleFromAppLocale(i18n.global.locale.value as 'en' | 'ru')
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
