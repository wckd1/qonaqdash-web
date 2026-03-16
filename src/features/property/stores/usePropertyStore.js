import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as propertyApi from '@/features/property/api'

export const usePropertyStore = defineStore('property', () => {
  const roomTypes = ref([])
  const rooms = ref([])

  async function fetchRoomTypes() {
    roomTypes.value = await propertyApi.fetchRoomTypes()
  }

  async function createRoomType(name, description = '') {
    const created = await propertyApi.createRoomType(name, description)
    roomTypes.value = [...roomTypes.value, created]
    return created
  }

  async function fetchRooms() {
    rooms.value = await propertyApi.fetchRooms()
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
