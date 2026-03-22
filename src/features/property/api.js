import api from '@/shared/api/client'

/**
 * @typedef {{ id: string, name: string }} Hotel
 */

/**
 * Current JWT hotel profile (display name).
 * @returns {Promise<Hotel>}
 */
export function fetchHotel() {
  return api.get('/api/property/hotel').then(({ data }) => data)
}

/**
 * @param {string} name - Display name (trimmed server-side; required non-empty).
 * @returns {Promise<Hotel>}
 */
export function updateHotel(name) {
  return api.put('/api/property/hotel', { name }).then(({ data }) => data)
}

/**
 * @typedef {{ id: string, name: string, description?: string }} RoomType
 * @typedef {{ id: string, number: string, room_type_id: string, room_type_name?: string, status?: string }} Room
 */

/**
 * @param {{ q?: string }} [params] - Optional search query; backend filters by type name/description or room number.
 * @returns {Promise<RoomType[]>}
 */
export function fetchRoomTypes(params = {}) {
  const config = params.q?.trim()
    ? { params: { q: params.q.trim() } }
    : {}
  return api.get('/api/property/room-types', config).then(({ data }) => data.room_types ?? data ?? [])
}

/**
 * @param {string} name
 * @param {string} [description]
 * @returns {Promise<RoomType>}
 */
export function createRoomType(name, description = '') {
  return api
    .post('/api/property/room-types', { name, description: description || undefined })
    .then(({ data }) => data)
}

/**
 * @param {string} id
 * @param {{ name: string, description?: string }} body
 * @returns {Promise<RoomType>}
 */
export function updateRoomType(id, body) {
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
export function deleteRoomType(id) {
  return api.delete(`/api/property/room-types/${id}`).then(() => undefined)
}

/**
 * @param {{ q?: string }} [params] - Optional search query; backend filters by room number.
 * @returns {Promise<Room[]>}
 */
export function fetchRooms(params = {}) {
  const config = params.q?.trim()
    ? { params: { q: params.q.trim() } }
    : {}
  return api.get('/api/property/rooms', config).then(({ data }) => data.rooms ?? data ?? [])
}

/**
 * @param {string} roomTypeId
 * @param {string} number
 * @returns {Promise<Room>}
 */
export function createRoom(roomTypeId, number) {
  return api
    .post('/api/property/rooms', { room_type_id: roomTypeId, number })
    .then(({ data }) => data)
}

/**
 * @param {string} id
 * @param {{ room_type_id: string, number: string, status: string }} body
 * @returns {Promise<Room>}
 */
export function updateRoom(id, body) {
  return api
    .put(`/api/property/rooms/${id}`, {
      room_type_id: body.room_type_id,
      number: body.number,
      status: body.status,
    })
    .then(({ data }) => data)
}

/**
 * Soft-deletes the room (hidden from list / availability; historical references keep resolving).
 * @param {string} id
 * @returns {Promise<void>}
 */
export function deleteRoom(id) {
  return api.delete(`/api/property/rooms/${id}`).then(() => undefined)
}

/**
 * Rooms available for the given date range (e.g. for booking form room picker).
 * Backend returns rooms that can be assigned; frontend uses this to populate roomID options when checkIn/checkOut change.
 * @param {Date | string | null} from - Start date (inclusive)
 * @param {Date | string | null} to - End date (exclusive)
 * @param {{ excludeBookingId?: string }} [options] - With both dates set, pass booking id to send query `exclude` (rooms occupied only by that booking stay available; ignored without `from`+`to` per API).
 * @returns {Promise<Room[]>}
 */
export function fetchAvailableRooms(from, to, options = {}) {
  const params = {}
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
  if (
    params.from &&
    params.to &&
    typeof ex === 'string' &&
    ex.trim() !== ''
  ) {
    params.exclude = ex.trim()
  }
  return api
    .get('/api/property/rooms/available', { params })
    .then(({ data }) => (Array.isArray(data) ? data : data?.rooms ?? []))
}
