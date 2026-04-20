import api from '@/shared/api/client'
import type {
  AvailableRoom,
  Hotel,
  Room,
  RoomActivityEntry,
  RoomAvailabilityStatus,
  RoomHousekeepingStatus,
  RoomMaintenanceStatus,
  RoomType,
} from '@/shared/types/property'

/**
 * Current JWT hotel profile (display name).
 * @returns {Promise<Hotel>}
 */
export function fetchHotel(): Promise<Hotel> {
  return api.get('/api/property/hotel').then(({ data }) => data)
}

/**
 * @param body.name - Display name (trimmed server-side; required non-empty).
 * @param body.currency - ISO 4217 alpha-3 (required).
 * @param body.check_in_hour - Default check-in time (e.g. "14:00").
 * @param body.check_out_hour - Default check-out time (e.g. "12:00").
 */
export function updateHotel(body: {
  name: string
  currency: string
  check_in_hour: string
  check_out_hour: string
}): Promise<Hotel> {
  return api
    .put('/api/property/hotel', {
      name: body.name,
      currency: body.currency,
      check_in_hour: body.check_in_hour,
      check_out_hour: body.check_out_hour,
    })
    .then(({ data }) => data)
}

/**
 * @param {{ q?: string }} [params] - Optional search query; backend filters by type name/description or room number.
 * @returns {Promise<RoomType[]>}
 */
export function fetchRoomTypes(params: { q?: string } = {}): Promise<RoomType[]> {
  const config = params.q?.trim() ? { params: { q: params.q.trim() } } : {}
  return api
    .get('/api/property/room-types', config)
    .then(({ data }) => data.room_types ?? data ?? [])
}

/**
 * @param body.name - Required non-empty.
 * @param body.description - Optional.
 */
export function createRoomType(body: { name: string; description?: string }): Promise<RoomType> {
  return api
    .post('/api/property/room-types', {
      name: body.name,
      description: body.description || undefined,
    })
    .then(({ data }) => data)
}

/**
 * @param id - Room type UUID.
 * @param body.name - Required non-empty.
 * @param body.description - Optional.
 */
export function updateRoomType(
  id: string,
  body: { name: string; description?: string },
): Promise<RoomType> {
  return api
    .put(`/api/property/room-types/${id}`, {
      name: body.name,
      description: body.description || undefined,
    })
    .then(({ data }) => data)
}

/**
 * Soft-deletes the room type (allowed only when no active rooms use it).
 * @param {string} id
 * @returns {Promise<void>}
 */
export function deleteRoomType(id: string): Promise<void> {
  return api.delete(`/api/property/room-types/${id}`).then(() => undefined)
}

/**
 * @param {{ q?: string }} [params] - Optional search query; backend filters by room number.
 * @returns {Promise<Room[]>}
 */
export function fetchRooms(params: { q?: string } = {}): Promise<Room[]> {
  const config = params.q?.trim() ? { params: { q: params.q.trim() } } : {}
  return api.get('/api/property/rooms', config).then(({ data }) => data.rooms ?? data ?? [])
}

export function fetchRoom(id: string): Promise<Room> {
  return api.get(`/api/property/rooms/${id}`).then(({ data }) => data)
}

/**
 * @param {string} roomTypeId
 * @param {string} number
 * @returns {Promise<Room>}
 */
export function createRoom(roomTypeId: string, number: string): Promise<Room> {
  return api
    .post('/api/property/rooms', { room_type_id: roomTypeId, number })
    .then(({ data }) => data)
}

/**
 * Catalog-only update: room type + number. Use the per-axis endpoints below to
 * change operational state (availability / housekeeping / maintenance).
 */
export function updateRoom(
  id: string,
  body: { room_type_id: string; number: string },
): Promise<Room> {
  return api
    .put(`/api/property/rooms/${id}`, {
      room_type_id: body.room_type_id,
      number: body.number,
    })
    .then(({ data }) => data)
}

/** Set the **availability** axis. `ooo` removes the room from availability. */
export function changeRoomAvailability(id: string, status: RoomAvailabilityStatus): Promise<Room> {
  return api.put(`/api/property/rooms/${id}/availability`, { status }).then(({ data }) => data)
}

/** Set the **housekeeping** axis. Backend returns 204; re-fetch the room to read new state. */
export function changeRoomHousekeeping(id: string, status: RoomHousekeepingStatus): Promise<void> {
  return api.put(`/api/property/rooms/${id}/housekeeping`, { status }).then(() => undefined)
}

/**
 * Set the **maintenance** axis. `under_maintenance` requires `planned_end`
 * (RFC 3339). `none` clears `planned_end` server-side.
 * Backend returns 204; re-fetch the room to read new state.
 */
export function changeRoomMaintenance(
  id: string,
  body: { status: RoomMaintenanceStatus; planned_end?: string | null },
): Promise<void> {
  const payload: Record<string, unknown> = { status: body.status }
  if (body.planned_end != null && body.planned_end !== '') payload.planned_end = body.planned_end
  return api.put(`/api/property/rooms/${id}/maintenance`, payload).then(() => undefined)
}

/** Append-only room event history (audit). */
export function fetchRoomActivity(id: string): Promise<RoomActivityEntry[]> {
  return api
    .get(`/api/property/rooms/${id}/activity`)
    .then(({ data }) => (Array.isArray(data) ? data : (data?.entries ?? [])))
}

/**
 * Soft-deletes the room (hidden from list / availability; historical references keep resolving).
 * @param {string} id
 * @returns {Promise<void>}
 */
export function deleteRoom(id: string): Promise<void> {
  return api.delete(`/api/property/rooms/${id}`).then(() => undefined)
}

/**
 * Rooms available for the given date range (e.g. for booking form room picker).
 * Backend returns rooms that can be assigned plus operational `state` /
 * `warnings` so the UI can surface dirty / required-maintenance warnings
 * without hiding the room.
 *
 * @param {Date | string | null} from - Start date (inclusive)
 * @param {Date | string | null} to - End date (exclusive)
 * @param {{ excludeBookingId?: string }} [options] - With both dates set, pass booking id to send query `exclude` (rooms occupied only by that booking stay available; ignored without `from`+`to` per API).
 */
export function fetchAvailableRooms(
  from: Date | string | null,
  to: Date | string | null,
  options: { excludeBookingId?: string } = {},
): Promise<AvailableRoom[]> {
  const params: Record<string, string> = {}
  if (from != null) {
    const d = typeof from === 'string' ? new Date(from) : from
    if (!Number.isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      params.from = `${day}.${month}.${d.getFullYear()}`
    }
  }
  if (to != null) {
    const d = typeof to === 'string' ? new Date(to) : to
    if (!Number.isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      params.to = `${day}.${month}.${d.getFullYear()}`
    }
  }
  const ex = options.excludeBookingId
  if (params.from && params.to && typeof ex === 'string' && ex.trim() !== '') {
    params.exclude = ex.trim()
  }
  return api
    .get('/api/property/rooms/available', { params })
    .then(({ data }) => (Array.isArray(data) ? data : (data?.rooms ?? [])))
}
