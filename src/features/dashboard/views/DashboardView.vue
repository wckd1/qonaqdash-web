<template>
  <header class="page-header">
    <h1 id="dashboard-title">{{ t('dashboard.title') }}</h1>
    <router-link :to="{ name: 'booking-new' }" class="btn-add-outline">
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      {{ t('dashboard.newBooking') }}
    </router-link>
  </header>

  <section class="dashboard-toolbar">
    <div class="dashboard-range-bar" role="toolbar" :aria-label="t('dashboard.rangeToolbar')">
      <div class="dashboard-range-sector dashboard-range-sector--preset">
        <label class="dashboard-range-field">
          <span class="dashboard-range-field-label">{{ t('dashboard.range') }}</span>
          <select class="dashboard-preset-select" :value="activePreset ?? ''" @change="onPresetSelect">
            <option value="" disabled hidden>{{ t('dashboard.presetCustom') }}</option>
            <option value="7">{{ t('dashboard.presetDays', { count: 7 }) }}</option>
            <option value="14">{{ t('dashboard.presetDays', { count: 14 }) }}</option>
            <option value="30">{{ t('dashboard.presetDays', { count: 30 }) }}</option>
          </select>
        </label>
      </div>
      <span class="dashboard-range-vr" aria-hidden="true" />
      <div class="dashboard-range-sector dashboard-range-sector--dates">
        <label class="dashboard-date-inline">
          <span class="dashboard-date-inline-label">{{ t('dashboard.from') }}</span>
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
          <span class="dashboard-date-inline-label">{{ t('dashboard.to') }}</span>
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
        <button type="button" class="dashboard-today" @click="jumpToday">{{ t('dashboard.today') }}</button>
      </div>
    </div>
  </section>

  <section class="dashboard-body" aria-labelledby="dashboard-title">
    <div class="dashboard-body__viewport">
      <p v-if="loadError" class="error-message">{{ loadError }}</p>
      <p v-else-if="!loading && sortedRooms.length === 0" class="dashboard-empty">
        {{ t('dashboard.emptyRooms') }}
      </p>
      <p v-else-if="loading" class="loading-state">{{ t('dashboard.loadingGrid') }}</p>
      <ReservationGrid
        v-else
        :rooms="sortedRooms"
        :entries="gridEntries"
        :range-from="rangeFromDate"
        :range-to="rangeToDate"
        @select-booking="selectedBooking = $event"
      />
    </div>
    <BookingSidePanel :booking="selectedBooking" @close="selectedBooking = null" />
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
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

const { t } = useI18n()
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
    loadError.value = t('dashboard.invalidRange')
    gridEntries.value = []
    return
  }
  loading.value = true
  try {
    await Promise.all([propertyStore.fetchRoomTypes(), propertyStore.fetchRooms()])
    gridEntries.value = await fetchBookingGrid({ from: fromStr.value, to: toStr.value })
  } catch (err) {
    gridEntries.value = []
    loadError.value = err.response?.data?.error ?? t('dashboard.loadFailed')
  } finally {
    loading.value = false
  }
}

function syncRouteQuery() {
  router.replace({ name: 'dashboard', query: { from: fromStr.value, to: toStr.value } })
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
    loadError.value = t('dashboard.validDatesHint')
    return
  }
  const fromD = parseLocalYmd(fromStr.value)
  const toD = parseLocalYmd(toStr.value)
  if (Number.isNaN(fromD.getTime()) || Number.isNaN(toD.getTime())) {
    loadError.value = t('dashboard.validDatesHint')
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
    if (route.name !== 'dashboard') return
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
