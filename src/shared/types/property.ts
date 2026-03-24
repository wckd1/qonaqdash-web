/** Property / rooms REST shapes (shared across features and JSONForm inject). */

export interface Hotel {
  id: string
  name: string
}

export interface RoomType {
  id: string
  name: string
  description?: string
}

export interface Room {
  id: string
  number: string
  room_type_id: string
  room_type_name?: string
  status?: string
}
