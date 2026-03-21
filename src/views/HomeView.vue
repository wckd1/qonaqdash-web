<template>
  <div class="dashboard-page">
    <header class="page-header">
      <h1>Dashboard</h1>
      <router-link :to="{ name: 'booking-new' }" class="btn-add-booking">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New booking
      </router-link>
    </header>

    <div class="dashboard-range-bar" role="toolbar" aria-label="Reservation grid range">
      <div class="dashboard-range-sector dashboard-range-sector--preset">
        <label class="dashboard-range-field">
          <span class="dashboard-range-field-label">Range</span>
          <select class="dashboard-preset-select" :value="activePreset ?? ''" @change="onPresetSelect">
            <option value="" disabled hidden>Custom</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
          </select>
        </label>
      </div>
      <span class="dashboard-range-vr" aria-hidden="true" />
      <div class="dashboard-range-sector dashboard-range-sector--dates">
        <label class="dashboard-date-inline">
          <span class="dashboard-date-inline-label">From</span>
          <input
            v-model="fromStr"
            class="dashboard-date-input"
            type="date"
            :max="toStr"
            @change="onDateFieldChange"
          />
        </label>
        <span class="dashboard-range-sep" aria-hidden="true">–</span>
        <label class="dashboard-date-inline">
          <span class="dashboard-date-inline-label">To</span>
          <input
            v-model="toStr"
            class="dashboard-date-input"
            type="date"
            :min="fromStr"
            @change="onDateFieldChange"
          />
        </label>
      </div>
      <span class="dashboard-range-vr" aria-hidden="true" />
      <div class="dashboard-range-sector dashboard-range-sector--today">
        <button type="button" class="dashboard-today" @click="jumpToday">Today</button>
      </div>
    </div>

    <p v-if="loadError" class="error-message">{{ loadError }}</p>
    <p v-else-if="!loading && sortedRooms.length === 0" class="dashboard-empty">
      No rooms yet. Add rooms under Settings to see the reservation grid.
    </p>
    <p v-else-if="loading" class="loading-state">Loading grid…</p>
    <ReservationGrid
      v-else
      :rooms="sortedRooms"
      :entries="gridEntries"
      :range-from="rangeFromDate"
      :range-to="rangeToDate"
      @select-booking="selectedBooking = $event"
    />
    <BookingSidePanel :booking="selectedBooking" @close="selectedBooking = null" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { addDays, startOfDay, startOfToday, subDays } from 'date-fns'
import { usePropertyStore } from '@/features/property/stores/usePropertyStore'
import { fetchBookingGrid } from '@/features/bookings/api'
import ReservationGrid from '@/features/bookings/components/ReservationGrid.vue'
import BookingSidePanel from '@/features/bookings/components/BookingSidePanel.vue'
import { parseLocalYmd, formatLocalYmd } from '@/features/bookings/utils/gridDates'

const STORAGE_PRESET = 'qonaqdash.dashboard.gridPreset'
const STORAGE_CUSTOM = 'qonaqdash.dashboard.gridCustomRange'

const route = useRoute()
const router = useRouter()
const propertyStore = usePropertyStore()
const { rooms, roomTypes } = storeToRefs(propertyStore)

const fromStr = ref('')
const toStr = ref('')
const activePreset = ref('14')
const loading = ref(true)
const loadError = ref('')
const gridEntries = ref([])
const selectedBooking = ref(null)

function isValidYmd(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
}

function isValidRange(from, to) {
  if (!isValidYmd(from) || !isValidYmd(to)) return false
  const a = parseLocalYmd(from)
  const b = parseLocalYmd(to)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return false
  return a <= b
}

/**
 * Preset window: one day of context before today, then today, then future days.
 * Today is always the 2nd column; `dayCount` is the total inclusive span (min 2).
 */
function rangeForPreset(dayCount) {
  const today = startOfToday()
  const n = Math.max(2, dayCount)
  const from = startOfDay(subDays(today, 1))
  const to = startOfDay(addDays(today, n - 2))
  return { from: formatLocalYmd(from), to: formatLocalYmd(to) }
}

function readInitialRange() {
  const qf = route.query.from
  const qt = route.query.to
  if (typeof qf === 'string' && typeof qt === 'string' && isValidRange(qf, qt)) {
    return { from: qf, to: qt, preset: null }
  }
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM)
    if (raw) {
      const j = JSON.parse(raw)
      if (j?.from && j?.to && isValidRange(j.from, j.to)) {
        return { from: j.from, to: j.to, preset: null }
      }
    }
  } catch {
    /* ignore */
  }
  const stored = parseInt(localStorage.getItem(STORAGE_PRESET) || '14', 10)
  const n = [7, 14, 30].includes(stored) ? stored : 14
  const r = rangeForPreset(n)
  return { from: r.from, to: r.to, preset: String(n) }
}

const sortedRooms = computed(() => {
  const order = new Map(roomTypes.value.map((t, i) => [t.id, i]))
  const typeNameById = new Map(roomTypes.value.map((t) => [t.id, t.name]))
  return [...rooms.value]
    .map((r) => ({
      ...r,
      room_type_name: r.room_type_name || typeNameById.get(r.room_type_id) || '',
    }))
    .sort((a, b) => {
      const ai = order.has(a.room_type_id) ? order.get(a.room_type_id) : 999
      const bi = order.has(b.room_type_id) ? order.get(b.room_type_id) : 999
      if (ai !== bi) return ai - bi
      return String(a.number).localeCompare(String(b.number), undefined, { numeric: true })
    })
})

const rangeFromDate = computed(() => {
  if (!isValidRange(fromStr.value, toStr.value)) return startOfToday()
  return startOfDay(parseLocalYmd(fromStr.value))
})

const rangeToDate = computed(() => {
  if (!isValidRange(fromStr.value, toStr.value)) return startOfToday()
  return startOfDay(parseLocalYmd(toStr.value))
})

async function loadGridData() {
  loadError.value = ''
  if (!isValidRange(fromStr.value, toStr.value)) {
    loadError.value = 'Invalid date range.'
    gridEntries.value = []
    return
  }
  loading.value = true
  try {
    await Promise.all([propertyStore.fetchRoomTypes(), propertyStore.fetchRooms()])
    gridEntries.value = await fetchBookingGrid({ from: fromStr.value, to: toStr.value })
  } catch (err) {
    gridEntries.value = []
    loadError.value = err.response?.data?.error ?? 'Failed to load dashboard.'
  } finally {
    loading.value = false
  }
}

function syncRouteQuery() {
  router.replace({ path: '/', query: { from: fromStr.value, to: toStr.value } })
}

function syncActivePresetFromRange() {
  for (const n of [7, 14, 30]) {
    const r = rangeForPreset(n)
    if (fromStr.value === r.from && toStr.value === r.to) {
      activePreset.value = String(n)
      return
    }
  }
  activePreset.value = null
}

function persistRangeToStorage() {
  if (activePreset.value && ['7', '14', '30'].includes(activePreset.value)) {
    localStorage.setItem(STORAGE_PRESET, activePreset.value)
    localStorage.removeItem(STORAGE_CUSTOM)
  } else {
    try {
      localStorage.setItem(STORAGE_CUSTOM, JSON.stringify({ from: fromStr.value, to: toStr.value }))
    } catch {
      /* ignore */
    }
  }
}

function onPresetSelect(ev) {
  const v = ev.target.value
  if (!v) return
  applyPreset(parseInt(v, 10))
}

function applyPreset(n) {
  const { from, to } = rangeForPreset(n)
  fromStr.value = from
  toStr.value = to
  activePreset.value = String(n)
  localStorage.setItem(STORAGE_PRESET, String(n))
  localStorage.removeItem(STORAGE_CUSTOM)
  syncRouteQuery()
  loadGridData()
}

function onDateFieldChange() {
  loadError.value = ''
  if (!isValidYmd(fromStr.value) || !isValidYmd(toStr.value)) {
    loadError.value = 'Enter valid dates.'
    return
  }
  const fromD = parseLocalYmd(fromStr.value)
  const toD = parseLocalYmd(toStr.value)
  if (Number.isNaN(fromD.getTime()) || Number.isNaN(toD.getTime())) {
    loadError.value = 'Enter valid dates.'
    return
  }
  if (toD < fromD) {
    toStr.value = fromStr.value
  }
  syncActivePresetFromRange()
  persistRangeToStorage()
  syncRouteQuery()
  loadGridData()
}

function jumpToday() {
  const ap = parseInt(String(activePreset.value || ''), 10)
  const ls = parseInt(localStorage.getItem(STORAGE_PRESET) || '14', 10)
  const n = [7, 14, 30].includes(ap) ? ap : [7, 14, 30].includes(ls) ? ls : 14
  const { from, to } = rangeForPreset(n)
  fromStr.value = from
  toStr.value = to
  activePreset.value = String(n)
  localStorage.setItem(STORAGE_PRESET, String(n))
  localStorage.removeItem(STORAGE_CUSTOM)
  syncRouteQuery()
  loadGridData()
}

onMounted(() => {
  const init = readInitialRange()
  fromStr.value = init.from
  toStr.value = init.to
  if (init.preset != null) activePreset.value = init.preset
  else activePreset.value = null
  syncActivePresetFromRange()
  syncRouteQuery()
  loadGridData()
})

watch(
  () => [route.query.from, route.query.to],
  ([qf, qt]) => {
    if (route.name !== 'home') return
    if (typeof qf === 'string' && typeof qt === 'string' && isValidRange(qf, qt)) {
      if (qf !== fromStr.value || qt !== toStr.value) {
        fromStr.value = qf
        toStr.value = qt
        syncActivePresetFromRange()
        persistRangeToStorage()
        loadGridData()
      }
    }
  },
)
</script>

<style scoped>
.dashboard-page {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--content-area-gap);
}

.dashboard-range-bar {
  --dashboard-control-h: 2.25rem;

  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
  padding: var(--space-sm) var(--space-md);
  background: var(--surface-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.dashboard-range-sector {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  min-width: 0;
}

.dashboard-range-sector--dates {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: min(100%, 20rem);
  flex-wrap: nowrap;
  gap: var(--space-sm);
}

.dashboard-range-field {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  margin: 0;
}

.dashboard-range-field-label {
  flex-shrink: 0;
  font-size: var(--text-caption-size);
  font-weight: var(--text-label-weight);
  color: var(--ink-tertiary);
}

.dashboard-preset-select {
  box-sizing: border-box;
  margin: 0;
  min-height: var(--dashboard-control-h);
  height: var(--dashboard-control-h);
  padding: 0 var(--space-sm);
  padding-inline-end: 1.75rem;
  font-size: var(--text-caption-size);
  font-weight: var(--text-label-weight);
  font-family: var(--font-body);
  line-height: 1.2;
  color: var(--ink-primary);
  background: var(--pico-form-element-background-color);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  min-width: 6.5rem;
  max-width: 100%;
}

.dashboard-preset-select:hover {
  border-color: var(--border-emphasis);
}

.dashboard-preset-select:focus {
  border-color: var(--border-focus);
  outline: none;
  box-shadow: 0 0 0 0.0625rem var(--border-focus);
}

.dashboard-range-vr {
  flex: 0 0 auto;
  width: 1px;
  height: 1.375rem;
  background: var(--border-subtle);
}

.dashboard-today {
  margin: 0;
  flex: 0 0 auto;
  min-height: var(--dashboard-control-h);
  padding: 0 var(--space-sm);
  font-size: var(--text-caption-size);
  font-weight: var(--text-label-weight);
  line-height: 1;
  color: var(--ink-secondary);
  background: transparent;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition:
    background 0.12s ease,
    border-color 0.12s ease,
    color 0.12s ease;
}

.dashboard-today:hover {
  color: var(--ink-primary);
  border-color: var(--border-emphasis);
  background: var(--pico-card-background-color);
}

.dashboard-date-inline {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  margin: 0;
  min-width: 0;
}

.dashboard-date-inline-label {
  flex-shrink: 0;
  font-size: var(--text-caption-size);
  font-weight: var(--text-label-weight);
  color: var(--ink-tertiary);
}

.dashboard-date-input {
  box-sizing: border-box;
  margin: 0;
  min-height: var(--dashboard-control-h);
  height: var(--dashboard-control-h);
  padding: 0 0.5rem;
  /* Reserve space for native calendar icon (Chrome / Safari) */
  padding-inline-end: 1.85rem;
  font-size: var(--text-caption-size);
  font-family: var(--font-body);
  line-height: 1.2;
  color: var(--ink-primary);
  background: var(--pico-form-element-background-color);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  min-width: 10.5rem;
  max-width: 100%;
}

.dashboard-date-input:hover {
  border-color: var(--border-emphasis);
}

.dashboard-date-input:focus {
  border-color: var(--border-focus);
  outline: none;
  box-shadow: 0 0 0 0.0625rem var(--border-focus);
}

.dashboard-date-input::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.55;
  margin-inline-start: 0.125rem;
}

.dashboard-range-sep {
  flex-shrink: 0;
  font-size: var(--text-caption-size);
  color: var(--ink-tertiary);
  user-select: none;
  line-height: var(--dashboard-control-h);
}

.error-message {
  color: var(--semantic-error);
  font-size: var(--text-body-size);
  margin: 0;
}

.loading-state {
  color: var(--ink-tertiary);
  font-size: var(--text-body-size);
  margin: 0;
}

.dashboard-empty {
  color: var(--ink-secondary);
  font-size: var(--text-body-size);
  margin: 0;
}
</style>
