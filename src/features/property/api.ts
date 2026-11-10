import type { RequestOptions } from '@/shared/api/client'
import { typedApi, type Schemas } from '@/shared/api/typed'

export type Hotel = Schemas['propertyhttp.HotelResponse']
export type UpdateHotelBody = Schemas['propertyhttp.UpdateHotelRequest']
export type RoomType = Schemas['propertyhttp.RoomTypeResponse']
export type Room = Schemas['propertyhttp.RoomResponse']
export type RoomAvailabilityStatus = Room['availability_status']
export type RoomHousekeepingStatus = Room['housekeeping_status']
export type RoomMaintenanceStatus = Room['maintenance_status']
export type AvailableRoom = Schemas['propertyhttp.AvailableRoomResponse']
export type AvailableRoomState = AvailableRoom['state']
export type RoomActivityEntry = Schemas['propertyhttp.RoomActivityEntryResponse']

/** `q` only when it is not blank. */
function searchQuery(q: string | undefined): { q?: string } {
  return q?.trim() ? { q: q.trim() } : {}
}

/** Current JWT hotel profile (display name, currency, default hours). */
export function fetchHotel(options: RequestOptions = {}): Promise<Hotel> {
  return typedApi.get('/api/property/hotel', { signal: options.signal }).then(({ data }) => data)
}

export function updateHotel(body: UpdateHotelBody): Promise<Hotel> {
  return typedApi
    .put('/api/property/hotel', {
      body: {
        name: body.name,
        currency: body.currency,
        check_in_hour: body.check_in_hour,
        check_out_hour: body.check_out_hour,
      },
    })
    .then(({ data }) => data)
}

/** Room types; `q` filters by type name/description or room number on the backend. */
export function fetchRoomTypes(
  params: { q?: string } = {},
  options: RequestOptions = {},
): Promise<RoomType[]> {
  return typedApi
    .get('/api/property/room-types', { query: searchQuery(params.q), signal: options.signal })
    .then(({ data }) => data)
}

export function createRoomType(body: { name: string; description?: string }): Promise<RoomType> {
  return typedApi
    .post('/api/property/room-types', {
      body: { name: body.name, description: body.description || undefined },
    })
    .then(({ data }) => data)
}

export function updateRoomType(
  id: string,
  body: { name: string; description?: string },
): Promise<RoomType> {
  return typedApi
    .put('/api/property/room-types/{id}', {
      path: { id },
      body: { name: body.name, description: body.description || undefined },
    })
    .then(({ data }) => data)
}

/** Soft-deletes the room type (allowed only when no active rooms use it). */
export function deleteRoomType(id: string): Promise<void> {
  return typedApi.delete('/api/property/room-types/{id}', { path: { id } }).then(() => undefined)
}

/** Rooms; `q` filters by room number on the backend. */
export function fetchRooms(
  params: { q?: string } = {},
  options: RequestOptions = {},
): Promise<Room[]> {
  return typedApi
    .get('/api/property/rooms', { query: searchQuery(params.q), signal: options.signal })
    .then(({ data }) => data)
}

export function fetchRoom(id: string, options: RequestOptions = {}): Promise<Room> {
  return typedApi
    .get('/api/property/rooms/{id}', { path: { id }, signal: options.signal })
    .then(({ data }) => data)
}

export function createRoom(roomTypeId: string, number: string): Promise<Room> {
  return typedApi
    .post('/api/property/rooms', { body: { room_type_id: roomTypeId, number } })
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
  return typedApi
    .put('/api/property/rooms/{id}', {
      path: { id },
      body: { room_type_id: body.room_type_id, number: body.number },
    })
    .then(({ data }) => data)
}

/** Set the **availability** axis. `ooo` removes the room from availability. */
export function changeRoomAvailability(id: string, status: RoomAvailabilityStatus): Promise<Room> {
  return typedApi
    .put('/api/property/rooms/{id}/availability', { path: { id }, body: { status } })
    .then(({ data }) => data)
}

/** Set the **housekeeping** axis. Backend returns 204. */
export function changeRoomHousekeeping(id: string, status: RoomHousekeepingStatus): Promise<void> {
  return typedApi
    .put('/api/property/rooms/{id}/housekeeping', { path: { id }, body: { status } })
    .then(() => undefined)
}

/**
 * Set the **maintenance** axis. `under_maintenance` requires `planned_end`
 * (RFC 3339). `none` clears `planned_end` server-side. Backend returns 204.
 */
export function changeRoomMaintenance(
  id: string,
  body: { status: RoomMaintenanceStatus; planned_end?: string | null },
): Promise<void> {
  const payload: Schemas['propertyhttp.ChangeRoomMaintenanceRequest'] = { status: body.status }
  if (body.planned_end != null && body.planned_end !== '') payload.planned_end = body.planned_end
  return typedApi
    .put('/api/property/rooms/{id}/maintenance', { path: { id }, body: payload })
    .then(() => undefined)
}

/** Append-only room event history (audit). */
export function fetchRoomActivity(
  id: string,
  options: RequestOptions = {},
): Promise<RoomActivityEntry[]> {
  return typedApi
    .get('/api/property/rooms/{id}/activity', { path: { id }, signal: options.signal })
    .then(({ data }) => data)
}

/** Soft-deletes the room (hidden from list / availability; historical references keep resolving). */
export function deleteRoom(id: string): Promise<void> {
  return typedApi.delete('/api/property/rooms/{id}', { path: { id } }).then(() => undefined)
}

/** `dd.MM.yyyy` in local time, as `GET /api/property/rooms/available` expects. */
function availabilityDate(value: Date | string | null): string | undefined {
  if (value == null) return undefined
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return undefined
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}.${d.getFullYear()}`
}

/**
 * Rooms available for the given date range (e.g. for booking form room picker).
 * Backend returns rooms that can be assigned plus operational `state` /
 * `warnings` so the UI can surface dirty / required-maintenance warnings
 * without hiding the room.
 *
 * @param from - Start date (inclusive)
 * @param to - End date (exclusive)
 * @param options.excludeBookingId - With both dates set, rooms occupied only by that booking stay available.
 */
export function fetchAvailableRooms(
  from: Date | string | null,
  to: Date | string | null,
  options: { excludeBookingId?: string } & RequestOptions = {},
): Promise<AvailableRoom[]> {
  const query: { from?: string; to?: string; exclude?: string } = {
    from: availabilityDate(from),
    to: availabilityDate(to),
  }
  const ex = options.excludeBookingId?.trim()
  if (query.from && query.to && ex) query.exclude = ex
  return typedApi
    .get('/api/property/rooms/available', { query, signal: options.signal })
    .then(({ data }) => data)
}
