import { defineQueryOptions, useMutation, useQueryCache } from '@pinia/colada'
import { invalidateKeys } from '@/shared/api/queryCache'
import * as propertyApi from '@/features/property/api'
import type {
  Hotel,
  RoomAvailabilityStatus,
  RoomHousekeepingStatus,
  RoomMaintenanceStatus,
} from '@/features/property/api'

/** Search text as it goes into a key: trimmed, so `' a'` and `'a'` share an entry. */
function searchParam(q: string | undefined): { q: string } {
  return { q: q?.trim() ?? '' }
}

/** Range of `fetchAvailableRooms`, as plain JSON for the key. */
export interface AvailableRoomsParams {
  from: string
  to: string
  excludeBookingId?: string
}

export const propertyKeys = {
  all: ['property'] as const,
  hotel: ['property', 'hotel'] as const,
  roomTypes: ['property', 'room-types'] as const,
  roomTypeList: (q?: string) => ['property', 'room-types', 'list', searchParam(q)] as const,
  /** Rooms in any form: lists, details, activity and availability. */
  rooms: ['property', 'rooms'] as const,
  roomList: (q?: string) => ['property', 'rooms', 'list', searchParam(q)] as const,
  roomDetail: (id: string) => ['property', 'rooms', 'detail', id] as const,
  roomActivity: (id: string) => ['property', 'rooms', 'activity', id] as const,
  availableRooms: (params: AvailableRoomsParams) =>
    [
      'property',
      'rooms',
      'available',
      { from: params.from, to: params.to, exclude: params.excludeBookingId ?? '' },
    ] as const,
}

export const hotelQuery = defineQueryOptions({
  key: propertyKeys.hotel,
  query: ({ signal }) => propertyApi.fetchHotel({ signal }),
})

/** Room types; without `q` the full list. */
export const roomTypeListQuery = defineQueryOptions((q?: string) => ({
  key: propertyKeys.roomTypeList(q),
  query: ({ signal }) => propertyApi.fetchRoomTypes(searchParam(q), { signal }),
}))

/** Rooms; without `q` the full list. */
export const roomListQuery = defineQueryOptions((q?: string) => ({
  key: propertyKeys.roomList(q),
  query: ({ signal }) => propertyApi.fetchRooms(searchParam(q), { signal }),
}))

export const roomDetailQuery = defineQueryOptions((id: string) => ({
  key: propertyKeys.roomDetail(id),
  query: ({ signal }) => propertyApi.fetchRoom(id, { signal }),
}))

export const roomActivityQuery = defineQueryOptions((id: string) => ({
  key: propertyKeys.roomActivity(id),
  query: ({ signal }) => propertyApi.fetchRoomActivity(id, { signal }),
}))

export const availableRoomsQuery = defineQueryOptions((params: AvailableRoomsParams) => ({
  key: propertyKeys.availableRooms(params),
  query: ({ signal }) =>
    propertyApi.fetchAvailableRooms(params.from, params.to, {
      excludeBookingId: params.excludeBookingId,
      signal,
    }),
}))

/**
 * Keys a change of a room's operational state touches outside the rooms
 * themselves: the reservation grid shows room states, and housekeeping and
 * maintenance statuses follow the tasks of the room.
 */
const ROOM_STATE_DEPENDENT_KEYS = [['bookings', 'grid'], ['tasks']] as const

export function useUpdateHotelMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (body: Omit<Hotel, 'id'>) => propertyApi.updateHotel(body),
    // Other screens read currency and check-in/out hours from the hotel query.
    onSuccess: () => invalidateKeys(queryCache, [propertyKeys.hotel]),
  })
}

export function useCreateRoomTypeMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (body: { name: string; description?: string }) =>
      propertyApi.createRoomType({ name: body.name, description: body.description || undefined }),
    onSuccess: () => invalidateKeys(queryCache, [propertyKeys.roomTypes]),
  })
}

export function useUpdateRoomTypeMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (vars: { id: string; name: string; description?: string }) =>
      propertyApi.updateRoomType(vars.id, {
        name: vars.name,
        description: vars.description || undefined,
      }),
    onSuccess: () => invalidateKeys(queryCache, [propertyKeys.roomTypes, propertyKeys.rooms]),
  })
}

/** Soft-delete room type; fails with 409 if active rooms still use it. */
export function useDeleteRoomTypeMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (id: string) => propertyApi.deleteRoomType(id),
    onSuccess: () => invalidateKeys(queryCache, [propertyKeys.roomTypes, propertyKeys.rooms]),
  })
}

export function useCreateRoomMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (vars: { roomTypeId: string; number: string }) =>
      propertyApi.createRoom(vars.roomTypeId, vars.number),
    onSuccess: () => invalidateKeys(queryCache, [propertyKeys.rooms, ['bookings', 'grid']]),
  })
}

export function useUpdateRoomMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (vars: { id: string; room_type_id: string; number: string }) =>
      propertyApi.updateRoom(vars.id, { room_type_id: vars.room_type_id, number: vars.number }),
    onSuccess: () => invalidateKeys(queryCache, [propertyKeys.rooms, ['bookings', 'grid']]),
  })
}

/** Soft-delete room (removed from catalog lists). */
export function useDeleteRoomMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (id: string) => propertyApi.deleteRoom(id),
    onSuccess: async (_data, id) => {
      // The screen of the removed room is left right after; refetching it would only show a 404.
      await queryCache.invalidateQueries({ key: propertyKeys.roomDetail(id) }, false)
      await queryCache.invalidateQueries({ key: propertyKeys.roomActivity(id) }, false)
      await invalidateKeys(queryCache, [
        ['property', 'rooms', 'list'],
        ['property', 'rooms', 'available'],
        ['bookings', 'grid'],
      ])
    },
  })
}

export function useChangeRoomAvailabilityMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (vars: { id: string; status: RoomAvailabilityStatus }) =>
      propertyApi.changeRoomAvailability(vars.id, vars.status),
    onSuccess: () => invalidateKeys(queryCache, [propertyKeys.rooms, ...ROOM_STATE_DEPENDENT_KEYS]),
  })
}

export function useChangeRoomHousekeepingMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (vars: { id: string; status: RoomHousekeepingStatus }) =>
      propertyApi.changeRoomHousekeeping(vars.id, vars.status),
    onSuccess: () => invalidateKeys(queryCache, [propertyKeys.rooms, ...ROOM_STATE_DEPENDENT_KEYS]),
  })
}

export function useChangeRoomMaintenanceMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (vars: { id: string; status: RoomMaintenanceStatus; planned_end?: string | null }) =>
      propertyApi.changeRoomMaintenance(vars.id, {
        status: vars.status,
        planned_end: vars.planned_end,
      }),
    onSuccess: () => invalidateKeys(queryCache, [propertyKeys.rooms, ...ROOM_STATE_DEPENDENT_KEYS]),
  })
}
