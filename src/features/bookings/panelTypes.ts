/** Shape emitted from `ReservationGrid` when selecting a bar (dashboard / grid). */
export interface GridPanelBooking {
  id: string
  status: string
  guest: { first_name: string; last_name: string }
  stay: { check_in: string; check_out: string }
}

/** Prop for `BookingSidePanel` — list row, grid selection, or `{ id }` while loading. */
export interface BookingSidePanelRef {
  id: string
  status?: string
  guest?: { first_name?: string; last_name?: string; email?: string }
  stay?: { check_in?: string; check_out?: string }
  guest_name?: string
}
