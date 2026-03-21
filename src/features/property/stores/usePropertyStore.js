import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as propertyApi from '@/features/property/api'

/**
 * @param {{ q?: string }} params
 */
function hasSearchQuery(params) {
  return Boolean(params.q?.trim())
}

export const usePropertyStore = defineStore('property', () => {
  const roomTypes = ref([])
  const rooms = ref([])

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

  return {
    roomTypes,
    rooms,
    fetchRoomTypes,
    createRoomType,
    fetchRooms,
    createRoom,
  }
})
