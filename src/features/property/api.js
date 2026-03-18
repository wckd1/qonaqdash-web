import api from '@/shared/api/client'

/**
 * @typedef {{ id: string, name: string, description?: string }} RoomType
 * @typedef {{ id: string, number: string, room_type_id: string, room_type_name?: string, status?: string }} Room
 */

/**
 * @param {{ q?: string }} [params] - Optional search query; backend filters by type name/description or room number (see backend-change-requests).
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
 * @param {{ q?: string }} [params] - Optional search query; backend filters by room number (see backend-change-requests).
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
