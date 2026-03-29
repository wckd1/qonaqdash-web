<template>
  <div class="dashboard-view">
    <header class="page-header">
      <h1 id="dashboard-title">{{ t('dashboard.title') }}</h1>
      <router-link :to="{ name: 'booking-new' }" class="btn-add-outline">
        <svg
          class="btn-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        {{ t('dashboard.new_booking') }}
      </router-link>
    </header>

    <section class="dashboard-view__toolbar">
      <div class="content-toolbar" role="toolbar" :aria-label="t('dashboard.range_toolbar')">
        <div class="toolbar-cluster toolbar-cluster--start">
          <label class="toolbar-field">
            <span class="toolbar-field-label">{{ t('dashboard.period') }}</span>
            <select
              class="toolbar-picker"
              :value="periodPickerSelectValue"
              @change="onPeriodSelect"
            >
              <option v-if="!periodPickerSelectValue" value="" disabled hidden>
                {{ t('dashboard.preset_custom') }}
              </option>
              <option v-if="needsExtraPeriodOption" value="__other" disabled>
                {{ t('dashboard.preset_days', { count: effectiveSpanDays }) }}
              </option>
              <option v-for="n in periodQuickOptions" :key="n" :value="String(n)">
                {{ t('dashboard.preset_days', { count: n }) }}
              </option>
            </select>
          </label>
        </div>
        <div class="toolbar-cluster toolbar-cluster--center">
          <div class="toolbar-group toolbar-group--inline">
            <button
              type="button"
              class="toolbar-btn toolbar-btn--icon"
              :aria-label="t('dashboard.range_prev')"
              @click="shiftRange(-1)"
            >
              <svg
                class="toolbar-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <input
              v-model="fromStr"
              class="toolbar-input"
              type="date"
              :aria-label="t('dashboard.from')"
              :max="toStr"
              @change="onDateFieldChange"
            />
            <span class="toolbar-sep" aria-hidden="true">–</span>
            <input
              v-model="toStr"
              class="toolbar-input"
              type="date"
              :aria-label="t('dashboard.to')"
              :min="fromStr"
              @change="onDateFieldChange"
            />
            <button
              type="button"
              class="toolbar-btn toolbar-btn--icon"
              :aria-label="t('dashboard.range_next')"
              @click="shiftRange(1)"
            >
              <svg
                class="toolbar-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
        <div class="toolbar-cluster toolbar-cluster--end">
          <button type="button" class="toolbar-btn" @click="jumpToday">
            {{ t('dashboard.today') }}
          </button>
        </div>
      </div>
    </section>

    <section class="dashboard-view__body" aria-labelledby="dashboard-title">
      <div class="dashboard-view__viewport">
        <p v-if="loadError" class="error-message">{{ loadError }}</p>
        <div v-else-if="!loading && sortedRooms.length === 0" class="empty-state-widget">
          <div class="empty-state-widget__icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h3 class="empty-state-widget__title">{{ t('dashboard.empty_title') }}</h3>
          <p class="empty-state-widget__description">{{ t('dashboard.empty_description') }}</p>
          <div class="empty-state-widget__actions">
            <router-link :to="{ name: 'rooms' }" class="primary" role="button">{{
              t('dashboard.empty_action')
            }}</router-link>
          </div>
        </div>
        <p v-else-if="loading" class="loading-state">{{ t('dashboard.loading_grid') }}</p>
        <ReservationGrid
          v-else
          :rooms="sortedRooms"
          :entries="gridEntries"
          :range-from="rangeFromDate"
          :range-to="rangeToDate"
          @select-booking="selectedBooking = $event"
          @booking-updated="onGridBookingUpdated"
        />
      </div>
      <BookingSidePanel
        :booking="selectedBooking"
        @close="selectedBooking = null"
        @booking-updated="onGridBookingUpdated"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { addDays, differenceInCalendarDays, startOfDay, startOfToday, subDays } from 'date-fns'
import { usePropertyStore } from '@/features/property/stores/usePropertyStore'
import { fetchBookingGrid, type BookingItem } from '@/features/bookings/api'
import type { GridPanelBooking } from '@/features/bookings/panelTypes'
import ReservationGrid from '@/features/bookings/components/ReservationGrid.vue'
import BookingSidePanel from '@/features/bookings/components/BookingSidePanel.vue'
import { parseLocalYmd, formatLocalYmd } from '@/features/bookings/utils/gridDates'
import { formatUnknownApiError } from '@/shared/i18n/apiError'

/** Saved range; period length is derived from from/to. */
const STORAGE_RANGE = 'qonaqdash.dashboard.gridCustomRange'
/** Last chosen period length (days), for defaults when no saved range. */
const STORAGE_LAST_PERIOD = 'qonaqdash.dashboard.gridLastPeriod'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const propertyStore = usePropertyStore()
const { rooms, roomTypes } = storeToRefs(propertyStore)

const fromStr = ref('')
const toStr = ref('')
const loading = ref(true)
const loadError = ref('')
const gridEntries = ref<BookingItem[]>([])
/** Grid selection: panel stays on dashboard (no navigation to bookings list). */
const selectedBooking = ref<GridPanelBooking | null>(null)

async function onGridBookingUpdated() {
  await loadGridData()
  const sel = selectedBooking.value
  if (!sel?.id) return
  const entry = gridEntries.value.find((e) => e.id === sel.id)
  if (!entry) return
  selectedBooking.value = {
    ...sel,
    status: entry.status,
    guest: {
      first_name: entry.guest.first_name ?? '',
      last_name: entry.guest.last_name ?? '',
    },
    stay: {
      check_in: entry.stay.check_in,
      check_out: entry.stay.check_out,
    },
  }
}

function isValidYmd(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
}

function isValidRange(from: unknown, to: unknown): boolean {
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
function rangeForPeriod(dayCount: number) {
  const today = startOfToday()
  const n = Math.max(2, dayCount)
  const from = startOfDay(subDays(today, 1))
  const to = startOfDay(addDays(today, n - 2))
  return { from: formatLocalYmd(from), to: formatLocalYmd(to) }
}

/** Quick picks in the period dropdown only; any other length still appears as an extra option. */
const periodQuickOptions = Object.freeze([7, 14, 30])

function readLastPeriodDays() {
  const last = parseInt(localStorage.getItem(STORAGE_LAST_PERIOD) || '', 10)
  if (!Number.isNaN(last) && last >= 2) return last
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
  const r = rangeForPeriod(readLastPeriodDays())
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
      const ai = order.get(a.room_type_id) ?? 999
      const bi = order.get(b.room_type_id) ?? 999
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
    loadError.value = t('dashboard.invalid_range')
    gridEntries.value = []
    return
  }
  loading.value = true
  try {
    await Promise.all([propertyStore.fetchRoomTypes(), propertyStore.fetchRooms()])
    gridEntries.value = await fetchBookingGrid({ from: fromStr.value, to: toStr.value })
  } catch (err: unknown) {
    gridEntries.value = []
    loadError.value = formatUnknownApiError(err) || t('dashboard.load_failed')
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

function onPeriodSelect(ev: Event) {
  const target = ev.target
  if (!(target instanceof HTMLSelectElement)) return
  const v = target.value
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
    loadError.value = t('dashboard.valid_dates_hint')
    return
  }
  const fromD = parseLocalYmd(fromStr.value)
  const toD = parseLocalYmd(toStr.value)
  if (Number.isNaN(fromD.getTime()) || Number.isNaN(toD.getTime())) {
    loadError.value = t('dashboard.valid_dates_hint')
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
  let n = readLastPeriodDays()
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
function shiftRange(direction: number) {
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

<style scoped>
/* Home grid only: layout shell + content toolbar. Promote to main.css only if a second screen reuses the same markup. */
.dashboard-view {
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  box-sizing: border-box;
}

.dashboard-view__toolbar {
  flex: 0 0 auto;
  width: 100%;
  box-sizing: border-box;
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
  overflow: visible;
}

.dashboard-view__body {
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  gap: var(--content-area-gap);
  background: transparent;
  border: none;
  box-shadow: none;
  padding-bottom: var(--space-md);
  box-sizing: border-box;
}

.dashboard-view__viewport {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--content-area-gap);
  overflow-y: auto;
}

.content-toolbar {
  --toolbar-control-height: 2.25rem;
  --toolbar-cluster-gap: var(--space-md);

  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  column-gap: var(--toolbar-cluster-gap);
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: var(--space-sm) var(--space-md);
  background: var(--surface-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.toolbar-cluster {
  display: flex;
  align-items: center;
  min-width: 0;
}

.toolbar-cluster--start {
  justify-content: flex-start;
  justify-self: start;
  width: fit-content;
  max-width: 100%;
}

.toolbar-field {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  margin: 0;
  max-width: 100%;
}

.toolbar-field-label {
  flex-shrink: 0;
  font-size: var(--text-caption-size);
  font-weight: var(--text-label-weight);
  color: var(--ink-tertiary);
}

.toolbar-cluster--center {
  justify-content: center;
}

.toolbar-cluster--end {
  justify-content: flex-end;
}

.toolbar-group {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  min-width: 0;
}

.toolbar-group--inline {
  flex-wrap: nowrap;
  gap: var(--space-sm);
}

.toolbar-picker {
  box-sizing: border-box;
  margin: 0;
  min-height: var(--toolbar-control-height);
  height: var(--toolbar-control-height);
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

.toolbar-picker:hover {
  border-color: var(--border-emphasis);
}

.toolbar-picker:focus {
  border-color: var(--border-focus);
  outline: none;
  box-shadow: 0 0 0 0.0625rem var(--border-focus);
}

.toolbar-btn {
  margin: 0;
  flex: 0 0 auto;
  min-height: var(--toolbar-control-height);
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

.toolbar-btn:hover {
  color: var(--ink-primary);
  border-color: var(--border-emphasis);
  background: var(--pico-card-background-color);
}

.toolbar-btn:focus {
  border-color: var(--border-focus);
  outline: none;
  box-shadow: 0 0 0 0.0625rem var(--border-focus);
}

.toolbar-btn--icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  width: var(--toolbar-control-height);
  min-width: var(--toolbar-control-height);
}

.toolbar-icon {
  display: block;
  width: 1.125rem;
  height: 1.125rem;
}

.toolbar-input {
  box-sizing: border-box;
  margin: 0;
  min-height: var(--toolbar-control-height);
  height: var(--toolbar-control-height);
  padding: 0 0.5rem;
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

.toolbar-input:hover {
  border-color: var(--border-emphasis);
}

.toolbar-input:focus {
  border-color: var(--border-focus);
  outline: none;
  box-shadow: 0 0 0 0.0625rem var(--border-focus);
}

.toolbar-input::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.55;
  margin-inline-start: 0.125rem;
}

.toolbar-sep {
  flex-shrink: 0;
  font-size: var(--text-caption-size);
  color: var(--ink-tertiary);
  user-select: none;
  line-height: var(--toolbar-control-height);
}
</style>
