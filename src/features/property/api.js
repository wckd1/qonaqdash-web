import api from '@/shared/api/client'

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
 * Rooms available for the given date range (e.g. for booking form room picker).
 * Backend returns rooms that can be assigned; frontend uses this to populate roomID options when checkIn/checkOut change.
 * @param {Date | string | null} from - Start date (inclusive)
 * @param {Date | string | null} to - End date (exclusive)
 * @returns {Promise<Room[]>}
 */
export function fetchAvailableRooms(from, to) {
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
  return api
    .get('/api/property/rooms/available', { params })
    .then(({ data }) => (Array.isArray(data) ? data : data?.rooms ?? []))
}
