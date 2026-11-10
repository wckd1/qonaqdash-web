<template>
  <Teleport to="body">
    <div
      v-if="cellMenu"
      ref="cellMenuEl"
      class="reservation-cell-menu"
      role="menu"
      :aria-label="t('grid.cell_menu_aria')"
      :style="{ top: `${cellMenu.y}px`, left: `${cellMenu.x}px` }"
    >
      <button
        type="button"
        class="reservation-cell-menu-item"
        role="menuitem"
        @click="onPickCreateBooking"
      >
        {{ t('grid.create_booking') }}
      </button>
    </div>
  </Teleport>

  <Teleport to="body">
    <div
      v-if="barMenu"
      ref="barMenuEl"
      class="reservation-cell-menu reservation-bar-menu"
      role="menu"
      :aria-label="t('grid.bar_menu_aria')"
      :style="{ top: `${barMenu.y}px`, left: `${barMenu.x}px` }"
    >
      <BookingStatusActions
        :booking-id="barMenu.bookingId"
        :status="barMenu.status"
        :outstanding-balance-minor="barMenu.outstandingBalanceMinor"
        layout="menu"
        @updated="onBarBookingStatusUpdated"
      />
    </div>
  </Teleport>

  <div
    class="reservation-grid-root"
    :class="{ 'reservation-grid-root--selecting': selectPointerDown }"
  >
    <div class="reservation-grid-scroll">
      <div class="reservation-grid-stage">
        <div
          ref="gridRef"
          class="reservation-grid-bg"
          :style="gridTemplateColumnsStyle"
          role="presentation"
        >
          <div class="reservation-grid-corner" aria-hidden="true" />
          <div
            v-for="head in dayHeads"
            :key="head.day"
            class="reservation-grid-head"
            :class="{ 'reservation-grid-head--today': head.day === today }"
          >
            <span class="reservation-grid-head-day">{{ head.dayOfMonth }}</span>
            <span class="reservation-grid-head-mon">{{ head.month }}</span>
          </div>

          <template v-for="row in gridRows" :key="row.key">
            <template v-if="row.kind === 'type-header'">
              <div class="reservation-grid-type-row" :title="row.title">
                {{ row.title }}
              </div>
            </template>
            <template v-else>
              <div class="reservation-grid-label reservation-grid-label--room-only">
                <span class="reservation-grid-label-num">{{ row.room.number }}</span>
              </div>
              <button
                v-for="day in days"
                :key="`${row.room.id}-${day}`"
                type="button"
                class="reservation-grid-cell"
                :class="{
                  'reservation-grid-cell--today': day === today,
                  'reservation-grid-cell--past': day < today,
                  'reservation-grid-cell--drag-select': rangeHighlightKeys.has(
                    `${row.room.id}-${day}`,
                  ),
                }"
                :disabled="day < today"
                :aria-label="cellAriaLabel(row.room.number, day)"
                @mousedown.left.prevent="onCellMouseDown($event, row.room.id, day)"
                @mouseenter="onCellMouseEnter(row.room.id, day)"
                @contextmenu.prevent="openCellMenuFromContext($event, row.room.id, day)"
              />
            </template>
          </template>
        </div>

        <div class="reservation-bars-layer" :style="barsLayerStyle">
          <button
            v-for="bar in barLayouts"
            :key="bar.key"
            type="button"
            class="reservation-bar"
            :class="bar.statusClass"
            :style="{
              top: `${bar.top}px`,
              left: `${bar.left}px`,
              width: `${bar.width}px`,
              height: `${cellHeight - 8}px`,
            }"
            :aria-label="bar.ariaLabel"
            @click.stop="onBarClick(bar)"
            @contextmenu.prevent.stop="openBarMenuFromContext($event, bar)"
          >
            <span class="reservation-bar-text">{{ bar.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import type { BookingItem } from '@/features/bookings/api'
import type { AvailableRoom } from '@/features/property/api'
import {
  addDays,
  daysBetween,
  eachLocalDate,
  formatLocalDateToParts,
  type LocalDate,
} from '@/shared/lib/localDate'
import { useHotelTime } from '@/shared/composables/useHotelTime'
import BookingStatusActions from '@/features/bookings/components/BookingStatusActions.vue'
import type { GridPanelBooking } from '@/features/bookings/panelTypes'
import { useQuery } from '@pinia/colada'
import { hotelQuery } from '@/features/property/queries'

/** A grid row: a room of the hotel with its type name (`rooms/available` without a stay). */
type RoomRow = Pick<AvailableRoom, 'id' | 'number' | 'room_type_id' | 'room_type_name'>

type CellMenuState = {
  roomId: string
  rangeFirst: LocalDate
  rangeLast: LocalDate
  x: number
  y: number
}

type BarMenuState = {
  x: number
  y: number
  bookingId: string
  status: string
  outstandingBalanceMinor?: number
}

type DragSelectState = { roomId: string; startDay: LocalDate; endDay: LocalDate }

type GridRow =
  { kind: 'type-header'; key: string; title: string } | { kind: 'room'; key: string; room: RoomRow }

type BarLayout = {
  key: string
  bookingId: string
  panelBooking: GridPanelBooking
  left: number
  width: number
  top: number
  label: string
  statusClass: string
  ariaLabel: string
  outstandingBalanceMinor?: number
}

const props = withDefaults(
  defineProps<{
    rooms: RoomRow[]
    entries: BookingItem[]
    /** First column, a local date of the hotel. */
    rangeFrom: LocalDate
    /** Last column (inclusive), a local date of the hotel. */
    rangeTo: LocalDate
  }>(),
  {
    rooms: () => [],
    entries: () => [],
  },
)

const router = useRouter()

const { t, locale } = useI18n()
const hotelTime = useHotelTime()

const { data: hotel } = useQuery(hotelQuery)

const emit = defineEmits<{
  'select-booking': [booking: GridPanelBooking]
  'booking-updated': []
}>()

const headerHeight = 52
const cellHeight = 64
const typeHeaderHeight = 44
const yLabelWidth = 118
const minutesPerDay = 24 * 60

const gridRef = ref<HTMLElement | null>(null)
const gridInnerWidth = ref(0)
const cellMenu = ref<CellMenuState | null>(null)
const cellMenuEl = ref<HTMLElement | null>(null)
const barMenu = ref<BarMenuState | null>(null)
const barMenuEl = ref<HTMLElement | null>(null)

/** True while primary button is held after starting a cell drag-select. */
const selectPointerDown = ref(false)
const dragSelectState = ref<DragSelectState | null>(null)

/** Days from `a` to `b` inclusive, in either order. */
function daysInclusive(a: LocalDate, b: LocalDate): LocalDate[] {
  const first = a <= b ? a : b
  const last = a <= b ? b : a
  return eachLocalDate(first, addDays(last, 1))
}

/** Cells to highlight: active drag and/or open context menu range (menu stays visible after drag ends). */
const rangeHighlightKeys = computed(() => {
  const set = new Set()
  const addSpan = (roomId: string, a: LocalDate, b: LocalDate) => {
    for (const day of daysInclusive(a, b)) {
      set.add(`${roomId}-${day}`)
    }
  }
  const drag = dragSelectState.value
  if (drag) addSpan(drag.roomId, drag.startDay, drag.endDay)
  const menu = cellMenu.value
  if (menu?.roomId && menu.rangeFirst && menu.rangeLast) {
    addSpan(menu.roomId, menu.rangeFirst, menu.rangeLast)
  }
  return set
})

const today = hotelTime.today()

/** Nights of each booked room: from the check-in date up to the check-out date, not including it. */
const occupiedCellKeys = computed(() => {
  const set = new Set<string>()
  for (const entry of props.entries) {
    const checkInDay = hotelTime.localDateOf(entry.stay.check_in)
    const checkOutDay = hotelTime.localDateOf(entry.stay.check_out)
    if (!checkInDay || !checkOutDay) continue
    const nights = eachLocalDate(checkInDay, checkOutDay)
    for (const room of entry.stay.rooms ?? []) {
      if (!room.room_id) continue
      for (const night of nights) set.add(`${room.room_id}-${night}`)
    }
  }
  return set
})

function isCellOccupied(roomId: string, day: LocalDate): boolean {
  return occupiedCellKeys.value.has(`${roomId}-${day}`)
}

function hasOccupiedInRange(roomId: string, a: LocalDate, b: LocalDate): boolean {
  return daysInclusive(a, b).some((day) => occupiedCellKeys.value.has(`${roomId}-${day}`))
}

const days = computed(() => eachLocalDate(props.rangeFrom, addDays(props.rangeTo, 1)))

/** Column heads: the day of the month over the month name as it reads after a day ("5 мая"). */
const dayHeads = computed(() =>
  days.value.map((day) => {
    const parts = formatLocalDateToParts(day, locale.value, { day: 'numeric', month: 'short' })
    return {
      day,
      dayOfMonth: parts.find((p) => p.type === 'day')?.value ?? String(Number(day.slice(8))),
      month: parts.find((p) => p.type === 'month')?.value ?? '',
    }
  }),
)

/**
 * Body rows: type section headers + room rows (rooms must already be sorted by type).
 * @returns {Array<{ kind: 'type-header', key: string, title: string } | { kind: 'room', key: string, room: object }>}
 */
function cellAriaLabel(roomNumber: string, day: LocalDate) {
  void locale.value
  return t('grid.cell_aria', { number: roomNumber, date: day })
}

const gridRows = computed((): GridRow[] => {
  void locale.value
  const rows: GridRow[] = []
  let prevTypeKey: string | undefined
  for (const room of props.rooms) {
    const tid = room.room_type_id ?? '__none__'
    if (tid !== prevTypeKey) {
      const name =
        (room.room_type_name && String(room.room_type_name).trim()) || t('rooms.other_type')
      rows.push({ kind: 'type-header', key: `th-${tid}`, title: name })
      prevTypeKey = tid
    }
    rows.push({ kind: 'room', key: `r-${room.id}`, room })
  }
  return rows
})

/** Pixel offset from top of grid body (below date header) to each room row top. */
const roomTopOffsetById = computed(() => {
  const map = new Map<string, number>()
  let y = headerHeight
  for (const row of gridRows.value) {
    if (row.kind === 'type-header') {
      y += typeHeaderHeight
    } else {
      map.set(row.room.id, y)
      y += cellHeight
    }
  }
  return map
})

const bodyGridHeightPx = computed(() => {
  let h = 0
  for (const row of gridRows.value) {
    h += row.kind === 'type-header' ? typeHeaderHeight : cellHeight
  }
  return h
})

/** Min width fits stacked "31" + "Dec" without clipping; keeps bar math stable. */
const dayColMin = 44

const gridTemplateColumnsStyle = computed(() => ({
  gridTemplateColumns: `${yLabelWidth}px repeat(${days.value.length}, minmax(${dayColMin}px, 1fr))`,
}))

const barsLayerStyle = computed(() => ({
  height: `${headerHeight + bodyGridHeightPx.value}px`,
}))

const colWidth = computed(() => {
  const n = days.value.length || 1
  const inner = Math.max(0, gridInnerWidth.value - yLabelWidth)
  return inner / n
})

/**
 * Position of a moment in columns from the start of the first column: the
 * column of its local date plus the share of the day on the hotel clock.
 */
function columnPosition(moment: string): number | null {
  const wall = hotelTime.toWallTime(moment)
  if (!wall) return null
  const column = daysBetween(props.rangeFrom, wall.date)
  if (Number.isNaN(column)) return null
  const [hours, minutes] = wall.time.split(':').map(Number)
  return column + (hours * 60 + minutes) / minutesPerDay
}

function barGeometry(checkIn: string, checkOut: string) {
  const rawStart = columnPosition(checkIn)
  const rawEnd = columnPosition(checkOut)
  if (rawStart === null || rawEnd === null) return null
  const maxDay = days.value.length
  const visStart = Math.max(0, Math.min(maxDay, rawStart))
  const visEnd = Math.max(0, Math.min(maxDay, rawEnd))
  const span = visEnd - visStart
  if (span <= 0) return null
  const left = yLabelWidth + visStart * colWidth.value
  const width = Math.max(6, span * colWidth.value)
  return { left, width }
}

function statusClass(status: string | undefined) {
  const s = (status || '').toLowerCase()
  if (s === 'confirmed') return 'reservation-bar--confirmed'
  if (s === 'checked_in') return 'reservation-bar--checked-in'
  if (s === 'checked_out') return 'reservation-bar--checked-out'
  if (s === 'canceled') return 'reservation-bar--canceled'
  return 'reservation-bar--default'
}

const barLayouts = computed((): BarLayout[] => {
  void locale.value
  const cw = colWidth.value
  if (!cw || !props.rooms.length) return []

  const layouts: BarLayout[] = []
  const tops = roomTopOffsetById.value
  for (const e of props.entries) {
    const geom = barGeometry(e.stay.check_in, e.stay.check_out)
    if (!geom) continue
    const { left, width } = geom

    const fn = (e.guest?.first_name || '').trim()
    const ln = (e.guest?.last_name || '').trim()
    const label = [fn, ln].filter(Boolean).join(' ') || t('grid.bar_fallback')

    const panel: GridPanelBooking = {
      id: e.id,
      status: e.status,
      guest: {
        first_name: e.guest?.first_name ?? '',
        last_name: e.guest?.last_name ?? '',
      },
      stay: {
        check_in: e.stay.check_in,
        check_out: e.stay.check_out,
      },
    }

    for (const room of e.stay.rooms ?? []) {
      const rid = room.room_id
      if (rid == null) continue
      const rowTop = tops.get(rid)
      if (rowTop === undefined) continue
      const top = rowTop + 4
      layouts.push({
        key: `${e.id}-${rid}-${e.stay.check_in}`,
        bookingId: e.id,
        panelBooking: panel,
        left,
        width,
        top,
        label,
        statusClass: statusClass(e.status),
        ariaLabel: t('grid.bar_aria', { label, status: e.status }),
        outstandingBalanceMinor:
          typeof e.outstanding_balance === 'number' ? e.outstanding_balance : undefined,
      })
    }
  }
  return layouts
})

function onBarClick(bar: BarLayout) {
  emit('select-booking', bar.panelBooking)
}

function closeBarMenu() {
  barMenu.value = null
}

function openBarMenuAt(
  x: number,
  y: number,
  bookingId: string,
  status: string | undefined,
  outstandingBalanceMinor?: number,
) {
  closeCellMenu()
  barMenu.value = {
    x,
    y,
    bookingId,
    status: status ?? '',
    outstandingBalanceMinor,
  }
  nextTick(() => {
    const el = barMenuEl.value
    const state = barMenu.value
    if (!el || !state) return
    const rect = el.getBoundingClientRect()
    let nx = state.x
    let ny = state.y
    const pad = 8
    if (nx + rect.width > window.innerWidth - pad)
      nx = Math.max(pad, window.innerWidth - rect.width - pad)
    if (ny + rect.height > window.innerHeight - pad)
      ny = Math.max(pad, window.innerHeight - rect.height - pad)
    if (nx < pad) nx = pad
    if (ny < pad) ny = pad
    barMenu.value = { ...state, x: nx, y: ny }
  })
}

function openBarMenuFromContext(event: MouseEvent, bar: BarLayout) {
  cancelDragSelect()
  closeCellMenu()
  openBarMenuAt(
    event.clientX,
    event.clientY,
    bar.bookingId,
    bar.panelBooking?.status,
    bar.outstandingBalanceMinor,
  )
}

function onBarBookingStatusUpdated() {
  closeBarMenu()
  emit('booking-updated')
}

function closeCellMenu() {
  cellMenu.value = null
}

function cancelDragSelect() {
  selectPointerDown.value = false
  dragSelectState.value = null
  window.removeEventListener('mouseup', onWindowMouseUp, true)
}

function openCellMenuAt(
  x: number,
  y: number,
  roomId: string,
  rangeFirst: LocalDate,
  rangeLast: LocalDate,
) {
  closeBarMenu()
  cellMenu.value = {
    roomId,
    rangeFirst,
    rangeLast,
    x,
    y,
  }
  nextTick(() => {
    const el = cellMenuEl.value
    const state = cellMenu.value
    if (!el || !state) return
    const rect = el.getBoundingClientRect()
    let nx = state.x
    let ny = state.y
    const pad = 8
    if (nx + rect.width > window.innerWidth - pad)
      nx = Math.max(pad, window.innerWidth - rect.width - pad)
    if (ny + rect.height > window.innerHeight - pad)
      ny = Math.max(pad, window.innerHeight - rect.height - pad)
    if (nx < pad) nx = pad
    if (ny < pad) ny = pad
    cellMenu.value = { ...state, x: nx, y: ny }
  })
}

function openCellMenuFromContext(event: MouseEvent, roomId: string, day: LocalDate) {
  cancelDragSelect()
  closeCellMenu()
  closeBarMenu()
  if (isCellOccupied(roomId, day)) return
  openCellMenuAt(event.clientX, event.clientY, roomId, day, day)
}

function onCellMouseDown(event: MouseEvent, roomId: string, day: LocalDate) {
  if (event.button !== 0) return
  closeCellMenu()
  closeBarMenu()
  if (isCellOccupied(roomId, day)) return
  selectPointerDown.value = true
  dragSelectState.value = { roomId, startDay: day, endDay: day }
  window.addEventListener('mouseup', onWindowMouseUp, true)
}

function onCellMouseEnter(roomId: string, day: LocalDate) {
  if (!selectPointerDown.value || !dragSelectState.value) return
  if (roomId !== dragSelectState.value.roomId) return
  if (day < today) return
  if (hasOccupiedInRange(roomId, dragSelectState.value.startDay, day)) return
  dragSelectState.value.endDay = day
}

function onWindowMouseUp(event: MouseEvent) {
  if (event.button !== 0) return
  window.removeEventListener('mouseup', onWindowMouseUp, true)
  const state = dragSelectState.value
  selectPointerDown.value = false
  dragSelectState.value = null
  if (!state) return
  const first = state.startDay <= state.endDay ? state.startDay : state.endDay
  const last = state.startDay <= state.endDay ? state.endDay : state.startDay
  openCellMenuAt(event.clientX, event.clientY, state.roomId, first, last)
}

function onPickCreateBooking() {
  if (!cellMenu.value) return
  const { roomId, rangeFirst, rangeLast } = cellMenu.value
  closeCellMenu()
  closeBarMenu()
  goToNewBooking(roomId, rangeFirst, rangeLast)
}

/**
 * @param firstDay - First selected column (check-in day).
 * @param lastDay - Last selected column: departure day for multi-day span;
 *   if same as firstDay, one night → checkout next day.
 */
function goToNewBooking(roomId: string, firstDay: LocalDate, lastDay: LocalDate) {
  const checkInHour = hotel.value?.check_in_hour || '14:00'
  const checkOutHour = hotel.value?.check_out_hour || '12:00'
  const checkOutDay = firstDay === lastDay ? addDays(lastDay, 1) : lastDay

  router.push({
    name: 'booking-new',
    query: {
      checkIn: hotelTime.fromWallTime(firstDay, checkInHour),
      checkOut: hotelTime.fromWallTime(checkOutDay, checkOutHour),
      roomId,
    },
  })
}

function onDocumentPointerDown(event: PointerEvent) {
  const t = event.target as Node | null
  if (cellMenu.value) {
    const el = cellMenuEl.value
    if (!el?.contains(t)) closeCellMenu()
  }
  if (barMenu.value) {
    const el = barMenuEl.value
    if (!el?.contains(t)) closeBarMenu()
  }
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (selectPointerDown.value) {
      cancelDragSelect()
      return
    }
    closeCellMenu()
    closeBarMenu()
  }
}

let ro: ResizeObserver | null = null

function measureGrid() {
  const el = gridRef.value
  if (!el) return
  gridInnerWidth.value = el.clientWidth
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown, true)
  document.addEventListener('keydown', onDocumentKeydown)
  nextTick(() => {
    measureGrid()
    ro = new ResizeObserver(() => measureGrid())
    if (gridRef.value) ro.observe(gridRef.value)
  })
})

watch(
  () => [days.value.length, props.rooms.length, gridRows.value.length, props.entries.length],
  () => nextTick(() => measureGrid()),
)

onBeforeUnmount(() => {
  cancelDragSelect()
  closeBarMenu()
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  document.removeEventListener('keydown', onDocumentKeydown)
  if (ro) {
    ro.disconnect()
    ro = null
  }
})
</script>

<style scoped>
.reservation-cell-menu {
  position: fixed;
  z-index: 400;
  min-width: 11rem;
  padding: var(--space-xs);
  margin: 0;
  overflow: hidden;
  background: var(--pico-card-background-color);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.reservation-cell-menu-item {
  display: block;
  width: 100%;
  margin: 0;
  padding: var(--space-sm) var(--space-md);
  font-size: var(--text-label-size);
  font-weight: var(--text-label-weight);
  text-align: left;
  color: var(--ink-primary);
  background: transparent;
  border: none;
  border-radius: 0;
  cursor: pointer;
}

/* No ring on mouse focus; keyboard still gets a token-aligned focus ring */
.reservation-cell-menu-item:focus {
  outline: none;
}

.reservation-cell-menu-item:focus-visible {
  outline: var(--pico-outline-width) solid var(--border-focus);
  outline-offset: calc(-1 * var(--pico-outline-width));
}

.reservation-cell-menu-item:hover {
  background: color-mix(in srgb, var(--brand-primary) 10%, transparent);
  color: var(--brand-primary);
}

.reservation-grid-root {
  flex: 1;
  min-height: 12rem;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid var(--border-subtle);
  border-radius: var(--content-area-radius);
  background: var(--pico-card-background-color);
  overflow: hidden;
}

.reservation-grid-root--selecting {
  user-select: none;
}

.reservation-grid-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.reservation-grid-stage {
  position: relative;
  width: 100%;
  min-width: min(100%, calc(118px + 44px * 7));
}

.reservation-grid-bg {
  display: grid;
  box-sizing: border-box;
  width: 100%;
}

.reservation-grid-bg > * {
  box-sizing: border-box;
}

.reservation-grid-corner {
  position: sticky;
  left: 0;
  z-index: 3;
  height: v-bind('headerHeight + "px"');
  background: color-mix(in srgb, var(--canvas) 88%, var(--ink-primary));
  border-bottom: 1px solid var(--border-subtle);
  border-right: 1px solid var(--border-subtle);
}

.reservation-grid-head {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  height: v-bind('headerHeight + "px"');
  padding: var(--space-xs) 2px;
  color: var(--ink-secondary);
  background: color-mix(in srgb, var(--canvas) 88%, var(--ink-primary));
  border-bottom: 1px solid var(--border-subtle);
  border-right: 1px solid var(--border-subtle);
  text-align: center;
  line-height: 1.15;
}

.reservation-grid-head-day {
  font-size: var(--text-label-size);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.reservation-grid-head-mon {
  font-size: var(--text-caption-size);
  font-weight: var(--text-label-weight);
  color: var(--ink-tertiary);
  text-transform: capitalize;
  white-space: nowrap;
}

.reservation-grid-head--today .reservation-grid-head-day {
  color: var(--brand-primary);
}

.reservation-grid-head--today .reservation-grid-head-mon {
  color: var(--ink-secondary);
}

.reservation-grid-head--today {
  color: var(--ink-primary);
  background: color-mix(in srgb, var(--brand-primary) 12%, var(--pico-card-background-color));
}

/* Full-width row so long type names are not clipped by the room column */
.reservation-grid-type-row {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  height: v-bind('typeHeaderHeight + "px"');
  min-height: v-bind('typeHeaderHeight + "px"');
  padding: var(--space-sm) var(--space-md) var(--space-sm) var(--space-sm);
  font-size: var(--text-caption-size);
  font-weight: 600;
  font-family: var(--font-display);
  letter-spacing: var(--text-heading-tracking);
  color: var(--ink-secondary);
  background: color-mix(in srgb, var(--control-bg) 74%, var(--ink-primary) 26%);
  border-bottom: 1px solid var(--border-emphasis);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reservation-grid-label {
  position: sticky;
  left: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  min-height: v-bind('cellHeight + "px"');
  padding: var(--space-sm) var(--space-xs);
  background: var(--pico-card-background-color);
  border-bottom: 1px solid var(--border-subtle);
  border-right: 1px solid var(--border-subtle);
}

.reservation-grid-label-num {
  font-size: var(--text-body-size);
  font-weight: 600;
  color: var(--ink-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reservation-grid-label-type {
  font-size: var(--text-caption-size);
  color: var(--ink-tertiary);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reservation-grid-label--room-only {
  justify-content: center;
}

.reservation-grid-label--room-only .reservation-grid-label-num {
  font-size: var(--text-body-size);
}

.reservation-grid-cell {
  min-height: v-bind('cellHeight + "px"');
  margin: 0;
  padding: 0;
  border: none;
  border-bottom: 1px solid var(--border-subtle);
  border-right: 1px solid var(--border-subtle);
  background: var(--pico-card-background-color);
  cursor: pointer;
}

.reservation-grid-cell:hover {
  background: color-mix(in srgb, var(--brand-primary) 6%, var(--pico-card-background-color));
}

.reservation-grid-cell--today {
  background: color-mix(in srgb, var(--brand-primary) 8%, var(--pico-card-background-color));
}

.reservation-grid-cell--past {
  background: color-mix(in srgb, var(--ink-tertiary) 4%, var(--pico-card-background-color));
  cursor: default;
  pointer-events: none;
}

.reservation-grid-cell--drag-select {
  background: color-mix(in srgb, var(--brand-primary) 20%, var(--pico-card-background-color));
}

.reservation-grid-cell--drag-select.reservation-grid-cell--today {
  background: color-mix(in srgb, var(--brand-primary) 26%, var(--pico-card-background-color));
}

.reservation-bars-layer {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  pointer-events: none;
  z-index: 2;
}

.reservation-bar {
  position: absolute;
  pointer-events: auto;
  margin: 0;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  text-align: left;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  min-width: 0;
}

.reservation-bar-text {
  font-size: var(--text-caption-size, 0.75rem);
  font-weight: 500;
  color: var(--ink-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reservation-bar--confirmed {
  background: color-mix(in srgb, var(--status-confirmed) 28%, transparent);
  border: 1px solid var(--status-confirmed);
}

.reservation-bar--checked-in {
  background: color-mix(in srgb, var(--status-checked-in) 28%, transparent);
  border: 1px solid var(--status-checked-in);
}

.reservation-bar--checked-out {
  background: color-mix(in srgb, var(--status-checked-out) 28%, transparent);
  border: 1px solid var(--status-checked-out);
}

.reservation-bar--canceled {
  background: color-mix(in srgb, var(--status-canceled) 28%, transparent);
  border: 1px solid var(--status-canceled);
}

.reservation-bar--default {
  background: color-mix(in srgb, var(--ink-tertiary) 22%, transparent);
  border: 1px solid var(--border-default);
}
</style>
