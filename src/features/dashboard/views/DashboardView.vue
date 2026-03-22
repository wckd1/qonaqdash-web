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
      <div class="dashboard-range-cluster dashboard-range-cluster--start">
        <label class="dashboard-range-field">
          <span class="dashboard-range-field-label">{{ t('dashboard.period') }}</span>
          <select class="dashboard-preset-select" :value="periodPickerSelectValue" @change="onPeriodSelect">
            <option v-if="!periodPickerSelectValue" value="" disabled hidden>{{ t('dashboard.presetCustom') }}</option>
            <option
              v-if="needsExtraPeriodOption"
              value="__other"
              disabled
            >
              {{ t('dashboard.presetDays', { count: effectiveSpanDays }) }}
            </option>
            <option v-for="n in periodQuickOptions" :key="n" :value="String(n)">
              {{ t('dashboard.presetDays', { count: n }) }}
            </option>
          </select>
        </label>
      </div>
      <div class="dashboard-range-cluster dashboard-range-cluster--center">
        <div class="dashboard-range-sector dashboard-range-sector--nav-dates">
          <button
            type="button"
            class="dashboard-range-nav"
            :aria-label="t('dashboard.rangePrev')"
            @click="shiftRange(-1)"
          >
            <svg class="dashboard-range-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <input
            v-model="fromStr"
            class="dashboard-date-input"
            type="date"
            :aria-label="t('dashboard.from')"
            :max="toStr"
            @change="onDateFieldChange"
          />
          <span class="dashboard-range-sep" aria-hidden="true">–</span>
          <input
            v-model="toStr"
            class="dashboard-date-input"
            type="date"
            :aria-label="t('dashboard.to')"
            :min="fromStr"
            @change="onDateFieldChange"
          />
          <button
            type="button"
            class="dashboard-range-nav"
            :aria-label="t('dashboard.rangeNext')"
            @click="shiftRange(1)"
          >
            <svg class="dashboard-range-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
      <div class="dashboard-range-cluster dashboard-range-cluster--end">
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
import { addDays, differenceInCalendarDays, startOfDay, startOfToday, subDays } from 'date-fns'
import { usePropertyStore } from '@/features/property/stores/usePropertyStore'
import { fetchBookingGrid } from '@/features/bookings/api'
import ReservationGrid from '@/features/bookings/components/ReservationGrid.vue'
import BookingSidePanel from '@/features/bookings/components/BookingSidePanel.vue'
import { parseLocalYmd, formatLocalYmd } from '@/features/bookings/utils/gridDates'
import { formatApiError } from '@/shared/i18n/apiError'

/** Saved range; period length is derived from from/to. */
const STORAGE_RANGE = 'qonaqdash.dashboard.gridCustomRange'
/** Default period when no saved range (and legacy `gridPreset` fallback). */
const STORAGE_LAST_PERIOD = 'qonaqdash.dashboard.gridLastPeriod'
const STORAGE_PRESET_LEGACY = 'qonaqdash.dashboard.gridPreset'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const propertyStore = usePropertyStore()
const { rooms, roomTypes } = storeToRefs(propertyStore)

const fromStr = ref('')
const toStr = ref('')
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
 * Window for a period length: one day before today, then today, then future days.
 * Today is always the 2nd column; `dayCount` is the inclusive span (min 2).
 */
function rangeForPeriod(dayCount) {
  const today = startOfToday()
  const n = Math.max(2, dayCount)
  const from = startOfDay(subDays(today, 1))
  const to = startOfDay(addDays(today, n - 2))
  return { from: formatLocalYmd(from), to: formatLocalYmd(to) }
}

/** Quick picks in the period dropdown only; any other length still appears as an extra option. */
const periodQuickOptions = Object.freeze([7, 14, 30])

function readFallbackPeriodDays() {
  const last = parseInt(localStorage.getItem(STORAGE_LAST_PERIOD) || '', 10)
  if (!Number.isNaN(last) && last >= 2) return last
  const legacy = parseInt(localStorage.getItem(STORAGE_PRESET_LEGACY) || '', 10)
  if (!Number.isNaN(legacy) && legacy >= 2) return legacy
  return 14
}

function readInitialRange() {
  const qf = route.query.from
  const qt = route.query.to
  if (typeof qf === 'string' && typeof qt === 'string' && isValidRange(qf, qt)) {
    return { from: qf, to: qt }
  }
  try {
    const raw = localStorage.getItem(STORAGE_RANGE)
    if (raw) {
      const j = JSON.parse(raw)
      if (j?.from && j?.to && isValidRange(j.from, j.to)) {
        return { from: j.from, to: j.to }
      }
    }
  } catch {
    /* ignore */
  }
  const r = rangeForPeriod(readFallbackPeriodDays())
  return { from: r.from, to: r.to }
}

const effectiveSpanDays = computed(() => {
  if (!isValidRange(fromStr.value, toStr.value)) return null
  const fromD = startOfDay(parseLocalYmd(fromStr.value))
  const toD = startOfDay(parseLocalYmd(toStr.value))
  return differenceInCalendarDays(toD, fromD) + 1
})

const needsExtraPeriodOption = computed(() => {
  const span = effectiveSpanDays.value
  return span != null && span >= 1 && !periodQuickOptions.includes(span)
})

/** Bound value for `<select>`: quick lengths only; custom span uses disabled `__other` row. */
const periodPickerSelectValue = computed(() => {
  const span = effectiveSpanDays.value
  if (span == null || span < 1) return ''
  if (needsExtraPeriodOption.value) return '__other'
  return String(span)
})

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
    loadError.value = formatApiError(err.response?.data?.error) || t('dashboard.loadFailed')
  } finally {
    loading.value = false
  }
}

function syncRouteQuery() {
  router.replace({ name: 'dashboard', query: { from: fromStr.value, to: toStr.value } })
}

function persistRangeToStorage() {
  try {
    localStorage.setItem(STORAGE_RANGE, JSON.stringify({ from: fromStr.value, to: toStr.value }))
    if (isValidRange(fromStr.value, toStr.value)) {
      const fromD = startOfDay(parseLocalYmd(fromStr.value))
      const toD = startOfDay(parseLocalYmd(toStr.value))
      const span = differenceInCalendarDays(toD, fromD) + 1
      if (span >= 2) {
        localStorage.setItem(STORAGE_LAST_PERIOD, String(span))
      }
    }
  } catch {
    /* ignore */
  }
}

function onPeriodSelect(ev) {
  const v = ev.target.value
  if (!v || v === '__other') return
  const n = parseInt(v, 10)
  if (Number.isNaN(n) || n < 2) return
  applyPeriodLength(n)
}

/** Sets dates to the standard window for this inclusive period length (anchored on today). */
function applyPeriodLength(n) {
  const { from, to } = rangeForPeriod(n)
  fromStr.value = from
  toStr.value = to
  persistRangeToStorage()
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
  persistRangeToStorage()
  syncRouteQuery()
  loadGridData()
}

function jumpToday() {
  let n = readFallbackPeriodDays()
  if (isValidRange(fromStr.value, toStr.value)) {
    const fromD = startOfDay(parseLocalYmd(fromStr.value))
    const toD = startOfDay(parseLocalYmd(toStr.value))
    n = Math.max(2, differenceInCalendarDays(toD, fromD) + 1)
  }
  const { from, to } = rangeForPeriod(n)
  fromStr.value = from
  toStr.value = to
  persistRangeToStorage()
  syncRouteQuery()
  loadGridData()
}

/** Shift the visible window by the current inclusive period length. */
function shiftRange(direction) {
  loadError.value = ''
  if (!isValidRange(fromStr.value, toStr.value)) return
  const fromD = startOfDay(parseLocalYmd(fromStr.value))
  const toD = startOfDay(parseLocalYmd(toStr.value))
  const span = differenceInCalendarDays(toD, fromD) + 1
  if (span < 1) return
  const delta = direction * span
  fromStr.value = formatLocalYmd(addDays(fromD, delta))
  toStr.value = formatLocalYmd(addDays(toD, delta))
  persistRangeToStorage()
  syncRouteQuery()
  loadGridData()
}

onMounted(() => {
  const init = readInitialRange()
  fromStr.value = init.from
  toStr.value = init.to
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
        persistRangeToStorage()
        loadGridData()
      }
    }
  },
)
</script>
