import api from '@/shared/api/client'

/**
 * @typedef {{ id: string, name: string, description?: string }} RoomType
 * @typedef {{ id: string, number: string, room_type_id: string, room_type_name?: string, status?: string }} Room
 */

/**
 * @returns {Promise<RoomType[]>}
 */
export function fetchRoomTypes() {
  return api.get('/api/property/room-types').then(({ data }) => data.room_types ?? data ?? [])
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
 * @returns {Promise<Room[]>}
 */
export function fetchRooms() {
  return api.get('/api/property/rooms').then(({ data }) => data.rooms ?? data ?? [])
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
