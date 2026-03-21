<template>
  <Teleport to="body">
    <div
      v-if="cellMenu"
      ref="cellMenuEl"
      class="reservation-cell-menu"
      role="menu"
      aria-label="Grid cell actions"
      :style="{ top: `${cellMenu.y}px`, left: `${cellMenu.x}px` }"
    >
      <button type="button" class="reservation-cell-menu-item" role="menuitem" @click="onPickCreateBooking">
        Create booking
      </button>
    </div>
  </Teleport>

  <div class="reservation-grid-root" :class="{ 'reservation-grid-root--selecting': selectPointerDown }">
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
            v-for="day in days"
            :key="day.getTime()"
            class="reservation-grid-head"
            :class="{ 'reservation-grid-head--today': isSameDay(day, today) }"
          >
            <span class="reservation-grid-head-day">{{ format(day, 'd') }}</span>
            <span class="reservation-grid-head-mon">{{ format(day, 'MMM', { locale: enUS }) }}</span>
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
                :key="`${row.room.id}-${day.getTime()}`"
                type="button"
                class="reservation-grid-cell"
                :class="{
                  'reservation-grid-cell--today': isSameDay(day, today),
                  'reservation-grid-cell--drag-select': rangeHighlightKeys.has(
                    `${row.room.id}-${startOfDay(day).getTime()}`,
                  ),
                }"
                :aria-label="`Room ${row.room.number}, ${formatLocalYmd(day)} — select or open actions`"
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
          >
            <span class="reservation-bar-text">{{ bar.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { format, startOfDay, isSameDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { listDaysInclusive, formatLocalYmd } from '@/features/bookings/utils/gridDates'

const props = defineProps({
  /** Sorted room rows (Y-axis). */
  rooms: { type: Array, default: () => [] },
  /** Raw grid API rows; only those with room_id in `rooms` are drawn. */
  entries: { type: Array, default: () => [] },
  /** First visible column (local start-of-day). */
  rangeFrom: { type: Date, required: true },
  /** Last visible column (local start-of-day). */
  rangeTo: { type: Date, required: true },
})

const router = useRouter()

const emit = defineEmits(['select-booking'])

const headerHeight = 52
const cellHeight = 64
const typeHeaderHeight = 44
const yLabelWidth = 118
const dayMs = 86400000

const gridRef = ref(null)
const gridInnerWidth = ref(0)
const cellMenu = ref(null)
const cellMenuEl = ref(null)

/** True while primary button is held after starting a cell drag-select. */
const selectPointerDown = ref(false)
/** @type {import('vue').Ref<{ roomId: string, startDay: Date, endDay: Date } | null>} */
const dragSelectState = ref(null)

/** Cells to highlight: active drag and/or open context menu range (menu stays visible after drag ends). */
const rangeHighlightKeys = computed(() => {
  const set = new Set()
  const addSpan = (roomId, a, b) => {
    const low = Math.min(a.getTime(), b.getTime())
    const high = Math.max(a.getTime(), b.getTime())
    for (let t = low; t <= high; t += dayMs) {
      set.add(`${roomId}-${t}`)
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

const today = new Date()

const days = computed(() => listDaysInclusive(props.rangeFrom, props.rangeTo))

/**
 * Body rows: type section headers + room rows (rooms must already be sorted by type).
 * @returns {Array<{ kind: 'type-header', key: string, title: string } | { kind: 'room', key: string, room: object }>}
 */
const gridRows = computed(() => {
  const rows = []
  let prevTypeKey = undefined
  for (const room of props.rooms) {
    const tid = room.room_type_id ?? '__none__'
    if (tid !== prevTypeKey) {
      const name = (room.room_type_name && String(room.room_type_name).trim()) || 'Other'
      rows.push({ kind: 'type-header', key: `th-${tid}`, title: name })
      prevTypeKey = tid
    }
    rows.push({ kind: 'room', key: `r-${room.id}`, room })
  }
  return rows
})

/** Pixel offset from top of grid body (below date header) to each room row top. */
const roomTopOffsetById = computed(() => {
  const map = new Map()
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

const rangeOriginMs = computed(() => startOfDay(props.rangeFrom).getTime())

function barGeometry(checkIn, checkOut) {
  const rawStart = (checkIn.getTime() - rangeOriginMs.value) / dayMs
  const rawEnd = (checkOut.getTime() - rangeOriginMs.value) / dayMs
  const maxDay = days.value.length
  const visStart = Math.max(0, Math.min(maxDay, rawStart))
  const visEnd = Math.max(0, Math.min(maxDay, rawEnd))
  const span = visEnd - visStart
  if (span <= 0) return null
  const left = yLabelWidth + visStart * colWidth.value
  const width = Math.max(6, span * colWidth.value)
  return { left, width }
}

function statusClass(status) {
  const s = (status || '').toLowerCase()
  if (s === 'confirmed') return 'reservation-bar--confirmed'
  if (s === 'checked_in') return 'reservation-bar--checked-in'
  if (s === 'checked_out') return 'reservation-bar--checked-out'
  if (s === 'canceled' || s === 'cancelled') return 'reservation-bar--canceled'
  return 'reservation-bar--default'
}

const barLayouts = computed(() => {
  const cw = colWidth.value
  if (!cw || !props.rooms.length) return []

  const layouts = []
  const tops = roomTopOffsetById.value
  for (const e of props.entries) {
    const rid = e.room_id
    if (rid == null) continue
    const rowTop = tops.get(rid)
    if (rowTop === undefined) continue

    const checkIn = new Date(e.check_in)
    const checkOut = new Date(e.check_out)
    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) continue

    const geom = barGeometry(checkIn, checkOut)
    if (!geom) continue
    const { left, width } = geom
    const top = rowTop + 4
    const fn = (e.guest_first_name || '').trim()
    const ln = (e.guest_last_name || '').trim()
    const label = [fn, ln].filter(Boolean).join(' ') || 'Booking'
    layouts.push({
      key: `${e.booking_id}-${rid}-${e.check_in}`,
      bookingId: e.booking_id,
      panelBooking: {
        id: e.booking_id,
        check_in: e.check_in,
        check_out: e.check_out,
        status: e.status,
        guest: {
          first_name: e.guest_first_name ?? '',
          last_name: e.guest_last_name ?? '',
        },
      },
      left,
      width,
      top,
      label,
      statusClass: statusClass(e.status),
      ariaLabel: `Booking ${label}, ${e.status}`,
    })
  }
  return layouts
})

function onBarClick(bar) {
  emit('select-booking', bar.panelBooking)
}

function closeCellMenu() {
  cellMenu.value = null
}

function cancelDragSelect() {
  selectPointerDown.value = false
  dragSelectState.value = null
  window.removeEventListener('mouseup', onWindowMouseUp, true)
}

function openCellMenuAt(x, y, roomId, rangeFirst, rangeLast) {
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
    if (nx + rect.width > window.innerWidth - pad) nx = Math.max(pad, window.innerWidth - rect.width - pad)
    if (ny + rect.height > window.innerHeight - pad) ny = Math.max(pad, window.innerHeight - rect.height - pad)
    if (nx < pad) nx = pad
    if (ny < pad) ny = pad
    cellMenu.value = { ...state, x: nx, y: ny }
  })
}

function openCellMenuFromContext(event, roomId, day) {
  cancelDragSelect()
  closeCellMenu()
  const d = startOfDay(day)
  openCellMenuAt(event.clientX, event.clientY, roomId, d, d)
}

function onCellMouseDown(event, roomId, day) {
  if (event.button !== 0) return
  closeCellMenu()
  selectPointerDown.value = true
  const d = startOfDay(day)
  dragSelectState.value = { roomId, startDay: d, endDay: d }
  window.addEventListener('mouseup', onWindowMouseUp, true)
}

function onCellMouseEnter(roomId, day) {
  if (!selectPointerDown.value || !dragSelectState.value) return
  if (roomId !== dragSelectState.value.roomId) return
  dragSelectState.value.endDay = startOfDay(day)
}

function onWindowMouseUp(event) {
  if (event.button !== 0) return
  window.removeEventListener('mouseup', onWindowMouseUp, true)
  const state = dragSelectState.value
  selectPointerDown.value = false
  dragSelectState.value = null
  if (!state) return
  const a = state.startDay.getTime()
  const b = state.endDay.getTime()
  const first = a <= b ? state.startDay : state.endDay
  const last = a <= b ? state.endDay : state.startDay
  openCellMenuAt(event.clientX, event.clientY, state.roomId, first, last)
}

function onPickCreateBooking() {
  if (!cellMenu.value) return
  const { roomId, rangeFirst, rangeLast } = cellMenu.value
  closeCellMenu()
  goToNewBooking(roomId, rangeFirst, rangeLast)
}

/**
 * @param {Date} firstDay - First selected column (check-in day, 14:00).
 * @param {Date} lastDay - Last selected column: departure day for multi-day span (12:00 that day);
 *   if same as firstDay, one night → checkout next day 12:00.
 */
function goToNewBooking(roomId, firstDay, lastDay) {
  const first = startOfDay(firstDay)
  const last = startOfDay(lastDay)
  const checkIn = new Date(first)
  checkIn.setHours(14, 0, 0, 0)
  let checkOut
  if (first.getTime() === last.getTime()) {
    checkOut = new Date(last)
    checkOut.setDate(checkOut.getDate() + 1)
    checkOut.setHours(12, 0, 0, 0)
  } else {
    checkOut = new Date(last)
    checkOut.setHours(12, 0, 0, 0)
  }

  router.push({
    name: 'booking-new',
    query: {
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      roomId,
    },
  })
}

function onDocumentPointerDown(event) {
  if (!cellMenu.value) return
  const el = cellMenuEl.value
  if (el?.contains(event.target)) return
  closeCellMenu()
}

function onDocumentKeydown(event) {
  if (event.key === 'Escape') {
    if (selectPointerDown.value) {
      cancelDragSelect()
      return
    }
    closeCellMenu()
  }
}

let ro = null

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
  border-radius: var(--radius-sm);
  cursor: pointer;
}

/* No ring on mouse focus; keyboard still gets a token-aligned focus ring */
.reservation-cell-menu-item:focus {
  outline: none;
}

.reservation-cell-menu-item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 0.0625rem var(--border-focus);
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
