/** Property / rooms REST shapes (shared across features and FormDSL inject). */

export interface Hotel {
  id: string
  name: string
  /** ISO 4217 alpha-3 (e.g. `KZT`). */
  currency: string
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
