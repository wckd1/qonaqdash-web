import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as propertyApi from '@/features/property/api'

export const usePropertyStore = defineStore('property', () => {
  const roomTypes = ref([])
  const rooms = ref([])

  /**
   * @param {{ q?: string }} [params] - Optional search; when present, backend returns filtered room types.
   */
  async function fetchRoomTypes(params = {}) {
    roomTypes.value = await propertyApi.fetchRoomTypes(params)
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
    rooms.value = await propertyApi.fetchRooms(params)
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
