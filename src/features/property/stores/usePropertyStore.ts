import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as propertyApi from '@/features/property/api'
import type { Room, RoomType } from '@/shared/types/property'

/**
 * @param {{ q?: string }} params
 */
function hasSearchQuery(params) {
  return Boolean(params.q?.trim())
}

export const usePropertyStore = defineStore('property', () => {
  const roomTypes = ref<RoomType[]>([])
  const rooms = ref<Room[]>([])

  /** True when `roomTypes` was last filled by a successful unfiltered fetch. */
  const fullRoomTypesHydrated = ref(false)
  /** True when `rooms` was last filled by a successful unfiltered fetch. */
  const fullRoomsHydrated = ref(false)

  /**
   * @param {{ q?: string }} [params] - Optional search; when present, backend returns filtered room types.
   */
  async function fetchRoomTypes(params = {}) {
    const filtered = hasSearchQuery(params)
    if (!filtered && fullRoomTypesHydrated.value) {
      return
    }
    roomTypes.value = await propertyApi.fetchRoomTypes(params)
    if (filtered) {
      fullRoomTypesHydrated.value = false
      fullRoomsHydrated.value = false
    } else {
      fullRoomTypesHydrated.value = true
    }
  }

  async function createRoomType(name, description = '') {
    const created = await propertyApi.createRoomType(name, description)
    roomTypes.value = [...roomTypes.value, created]
    return created
  }

  /**
   * @param {string} id
   * @param {string} name
   * @param {string} [description]
   */
  async function updateRoomType(id, name, description = '') {
    const updated = await propertyApi.updateRoomType(id, {
      name,
      description: description || undefined,
    })
    roomTypes.value = roomTypes.value.map((t) => (t.id === id ? updated : t))
    return updated
  }

  /** Soft-delete room type; fails with 409 if active rooms still use it. */
  async function deleteRoomType(id) {
    await propertyApi.deleteRoomType(id)
    roomTypes.value = roomTypes.value.filter((t) => t.id !== id)
    rooms.value = rooms.value.filter((r) => r.room_type_id !== id)
  }

  /**
   * @param {{ q?: string }} [params] - Optional search; when present, backend returns filtered rooms (by number).
   */
  async function fetchRooms(params = {}) {
    const filtered = hasSearchQuery(params)
    if (!filtered && fullRoomsHydrated.value) {
      return
    }
    rooms.value = await propertyApi.fetchRooms(params)
    if (filtered) {
      fullRoomTypesHydrated.value = false
      fullRoomsHydrated.value = false
    } else {
      fullRoomsHydrated.value = true
    }
  }

  async function createRoom(roomTypeId, number) {
    const created = await propertyApi.createRoom(roomTypeId, number)
    rooms.value = [...rooms.value, created]
    return created
  }

  /**
   * @param {string} id
   * @param {{ room_type_id: string, number: string, status: string }} payload
   */
  async function updateRoom(id, payload) {
    const updated = await propertyApi.updateRoom(id, payload)
    rooms.value = rooms.value.map((r) => (r.id === id ? updated : r))
    return updated
  }

  /** Soft-delete room (removed from catalog lists). */
  async function deleteRoom(id) {
    await propertyApi.deleteRoom(id)
    rooms.value = rooms.value.filter((r) => r.id !== id)
  }

  return {
    roomTypes,
    rooms,
    fetchRoomTypes,
    createRoomType,
    updateRoomType,
    deleteRoomType,
    fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom,
  }
})
