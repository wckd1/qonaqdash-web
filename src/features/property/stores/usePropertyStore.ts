import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as propertyApi from '@/features/property/api'
import type { Hotel, Room, RoomType } from '@/shared/types/property'

function hasSearchQuery(params: { q?: string }) {
  return Boolean(params.q?.trim())
}

export const usePropertyStore = defineStore('property', () => {
  const hotel = ref<Hotel | null>(null)
  const roomTypes = ref<RoomType[]>([])
  const rooms = ref<Room[]>([])

  /** True when `roomTypes` was last filled by a successful unfiltered fetch. */
  const fullRoomTypesHydrated = ref(false)
  /** True when `rooms` was last filled by a successful unfiltered fetch. */
  const fullRoomsHydrated = ref(false)

  let hotelFetched = false

  async function fetchHotel() {
    if (hotelFetched) return hotel.value
    hotel.value = await propertyApi.fetchHotel()
    hotelFetched = true
    return hotel.value
  }

  async function updateHotel(
    name: string,
    currency: string,
    check_in_hour: string,
    check_out_hour: string,
  ) {
    hotel.value = await propertyApi.updateHotel({ name, currency, check_in_hour, check_out_hour })
    return hotel.value
  }

  async function fetchRoomTypes(params: { q?: string } = {}) {
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

  async function createRoomType(name: string, description: string) {
    const created = await propertyApi.createRoomType({
      name,
      description: description || undefined,
    })
    roomTypes.value = [...roomTypes.value, created]
    return created
  }

  async function updateRoomType(id: string, name: string, description: string) {
    const updated = await propertyApi.updateRoomType(id, {
      name,
      description: description || undefined,
    })
    roomTypes.value = roomTypes.value.map((t) => (t.id === id ? updated : t))
    return updated
  }

  /** Soft-delete room type; fails with 409 if active rooms still use it. */
  async function deleteRoomType(id: string) {
    await propertyApi.deleteRoomType(id)
    roomTypes.value = roomTypes.value.filter((t) => t.id !== id)
    rooms.value = rooms.value.filter((r) => r.room_type_id !== id)
  }

  async function fetchRooms(params: { q?: string } = {}) {
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

  async function createRoom(roomTypeId: string, number: string) {
    const created = await propertyApi.createRoom(roomTypeId, number)
    rooms.value = [...rooms.value, created]
    return created
  }

  async function updateRoom(
    id: string,
    payload: { room_type_id: string; number: string; status: string },
  ) {
    const updated = await propertyApi.updateRoom(id, payload)
    rooms.value = rooms.value.map((r) => (r.id === id ? updated : r))
    return updated
  }

  /** Soft-delete room (removed from catalog lists). */
  async function deleteRoom(id: string) {
    await propertyApi.deleteRoom(id)
    rooms.value = rooms.value.filter((r) => r.id !== id)
  }

  return {
    hotel,
    roomTypes,
    rooms,
    fetchHotel,
    updateHotel,
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
