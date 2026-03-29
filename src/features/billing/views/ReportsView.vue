<template>
  <div class="reports-view">
    <header class="reports-view__print-header">
      <div class="reports-view__print-brand">{{ APP_NAME }}</div>
      <h1 class="reports-view__print-title">
        {{ hotelName }}
      </h1>
      <p class="reports-view__print-meta">
        {{ activeTabLabel }} · {{ fmtShortDate(fromStr) }} – {{ fmtShortDate(toStr) }}
      </p>
    </header>

    <header class="page-header">
      <h1>{{ t('billing.reports_title') }}</h1>
    </header>

    <div class="content-toolbar" role="toolbar" :aria-label="t('billing.filter_toolbar_aria')">
      <div class="toolbar-cluster toolbar-cluster--start">
        <label class="toolbar-field">
          <span class="toolbar-field-label">{{ t('billing.preset_label') }}</span>
          <select class="toolbar-picker" :value="activePreset" @change="onPresetSelect">
            <option v-for="p in presetOptions" :key="p.id" :value="p.id">
              {{ p.label }}
            </option>
          </select>
        </label>
      </div>
      <div class="toolbar-cluster toolbar-cluster--center">
        <div class="toolbar-group toolbar-group--inline">
          <button
            type="button"
            class="toolbar-btn toolbar-btn--icon"
            :aria-label="t('billing.range_prev')"
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
            :aria-label="t('billing.filter_from')"
            @change="onDateFieldChange"
          />
          <span class="toolbar-sep" aria-hidden="true">–</span>
          <input
            v-model="toStr"
            class="toolbar-input"
            type="date"
            :aria-label="t('billing.filter_to')"
            @change="onDateFieldChange"
          />
          <button
            type="button"
            class="toolbar-btn toolbar-btn--icon"
            :aria-label="t('billing.range_next')"
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
        <button
          type="button"
          class="toolbar-btn"
          :aria-label="t('billing.print')"
          @click="printReport"
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
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          {{ t('billing.print') }}
        </button>
      </div>
    </div>

    <nav class="subnav" :aria-label="t('billing.reports_title')">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="subnav__link"
        :class="{ 'subnav__link--active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div class="reports-view__body">
      <div class="reports-view__viewport">
        <p v-if="loadError" class="error-message">{{ loadError }}</p>
        <div v-else-if="loading" class="loading-state">{{ t('common.loading') }}</div>

        <template v-else>
          <!-- Overview -->
          <section v-if="activeTab === 'overview' && overview" class="reports-view__tab-content">
            <div class="reports-view__overview-panels">
              <section class="pricing-card">
                <div class="pricing-card__header">
                  <h3 class="pricing-card__title">{{ t('billing.overview_charges') }}</h3>
                </div>
                <div class="pricing-card__body">
                  <div class="pricing-card__row">
                    <span>{{ t('billing.revenue_accommodation') }}</span>
                    <span>{{ fmtMoney(overview.accommodation) }}</span>
                  </div>
                  <div class="pricing-card__row">
                    <span>{{ t('billing.revenue_rule_adjustments') }}</span>
                    <span>{{ fmtMoney(overview.rule_adjustments) }}</span>
                  </div>
                  <div class="pricing-card__row">
                    <span>{{ t('billing.revenue_manual_adjustments') }}</span>
                    <span>{{ fmtMoney(overview.manual_adjustments) }}</span>
                  </div>
                  <div class="pricing-card__row">
                    <span>{{ t('billing.revenue_service_charges') }}</span>
                    <span>{{ fmtMoney(overview.service_charges) }}</span>
                  </div>
                  <div class="pricing-card__row">
                    <span>{{ t('billing.revenue_corrections') }}</span>
                    <span>{{ fmtMoney(overview.corrections) }}</span>
                  </div>
                </div>
                <div class="pricing-card__footer">
                  <span>{{ t('billing.overview_total_charges') }}</span>
                  <span>{{ fmtMoney(overview.total_charges) }}</span>
                </div>
              </section>

              <section class="pricing-card">
                <div class="pricing-card__header">
                  <h3 class="pricing-card__title">{{ t('billing.overview_collections') }}</h3>
                </div>
                <div class="pricing-card__body">
                  <div class="pricing-card__row">
                    <span>{{ t('billing.revenue_payments') }}</span>
                    <span>{{ fmtMoney(overview.payments) }}</span>
                  </div>
                  <div class="pricing-card__row">
                    <span>{{ t('billing.revenue_refunds') }}</span>
                    <span>{{ fmtMoney(overview.refunds) }}</span>
                  </div>
                </div>
                <div class="pricing-card__footer">
                  <span>{{ t('billing.overview_outstanding') }}</span>
                  <span>{{ fmtMoney(overview.total_outstanding) }}</span>
                </div>
              </section>
            </div>
          </section>

          <!-- Ledger -->
          <section v-if="activeTab === 'ledger'" class="reports-view__tab-content">
            <div class="reports-view__ledger-filter">
              <label>
                <span>{{ t('billing.ledger_grouping_label') }}</span>
                <select v-model="ledgerGrouping">
                  <option v-for="g in groupingOptions" :key="g.value" :value="g.value">
                    {{ g.label }}
                  </option>
                </select>
              </label>
              <label>
                <span>{{ t('billing.filter_entry_type') }}</span>
                <select v-model="ledgerEntryTypeFilter" @change="onEntryTypeFilterChange">
                  <option value="">{{ t('billing.filter_all_types') }}</option>
                  <option v-for="et in entryTypeOptions" :key="et.value" :value="et.value">
                    {{ et.label }}
                  </option>
                </select>
              </label>
            </div>

            <!-- Entries (flat list) -->
            <template v-if="ledgerGrouping === 'entries'">
              <div v-if="ledgerLoading && !ledgerEntries.length" class="loading-state">
                {{ t('common.loading') }}
              </div>
              <p v-else-if="!ledgerEntries.length" class="reports-view__empty">
                {{ t('billing.ledger_empty') }}
              </p>
              <template v-else>
                <div class="reports-view__table-wrap">
                  <table class="list-table">
                    <thead>
                      <tr>
                        <th scope="col">{{ t('billing.col_description') }}</th>
                        <th scope="col">{{ t('billing.col_date') }}</th>
                        <th scope="col" class="reports-view__col-money">
                          {{ t('billing.col_amount') }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="entry in ledgerEntries" :key="entry.id">
                        <td>
                          <span class="reports-view__entry-title">{{ entryTitle(entry) }}</span>
                          <span v-if="entry.description" class="reports-view__entry-desc">{{
                            entry.description
                          }}</span>
                        </td>
                        <td class="reports-view__cell-date">
                          {{ fmtDateTime(entry.created_at) }}
                        </td>
                        <td
                          class="reports-view__col-money"
                          :class="{
                            'reports-view__cell--credit': entry.balance_delta < 0,
                            'reports-view__cell--debit': entry.balance_delta > 0,
                          }"
                        >
                          {{ fmtDelta(entry.balance_delta) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-if="ledgerLoading" class="loading-state">{{ t('common.loading') }}</div>
                <button
                  v-else-if="ledgerHasMore"
                  type="button"
                  class="btn-secondary reports-view__load-more"
                  @click="loadMoreLedger"
                >
                  {{ t('billing.ledger_load_more') }}
                </button>
              </template>
            </template>

            <!-- Daily breakdown -->
            <template v-if="ledgerGrouping === 'daily'">
              <div v-if="groupingLoading" class="loading-state">{{ t('common.loading') }}</div>
              <p v-else-if="daily && !daily.days.length" class="reports-view__empty">
                {{ t('billing.daily_empty') }}
              </p>
              <div v-else-if="daily" class="reports-view__table-wrap">
                <table class="list-table">
                  <thead>
                    <tr>
                      <th scope="col">{{ t('billing.daily_col_date') }}</th>
                      <template v-if="hasTypeFilter">
                        <th scope="col" class="reports-view__col-money">
                          {{ t('billing.col_amount') }}
                        </th>
                      </template>
                      <template v-else>
                        <th scope="col" class="reports-view__col-money">
                          {{ t('billing.daily_col_charges') }}
                        </th>
                        <th scope="col" class="reports-view__col-money">
                          {{ t('billing.daily_col_payments') }}
                        </th>
                        <th scope="col" class="reports-view__col-money">
                          {{ t('billing.daily_col_refunds') }}
                        </th>
                        <th scope="col" class="reports-view__col-money">
                          {{ t('billing.daily_col_net') }}
                        </th>
                      </template>
                      <th scope="col" class="reports-view__col-number">
                        {{ t('billing.daily_col_entries') }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in daily.days" :key="row.date">
                      <td>{{ fmtShortDate(row.date) }}</td>
                      <template v-if="hasTypeFilter">
                        <td class="reports-view__col-money">{{ fmtMoney(row.net) }}</td>
                      </template>
                      <template v-else>
                        <td class="reports-view__col-money">{{ fmtMoney(row.charges) }}</td>
                        <td class="reports-view__col-money reports-view__cell--credit">
                          {{ fmtMoney(row.payments) }}
                        </td>
                        <td class="reports-view__col-money">{{ fmtMoney(row.refunds) }}</td>
                        <td class="reports-view__col-money">{{ fmtMoney(row.net) }}</td>
                      </template>
                      <td class="reports-view__col-number">{{ row.entries_count }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>

            <!-- Monthly breakdown -->
            <template v-if="ledgerGrouping === 'monthly'">
              <div v-if="groupingLoading" class="loading-state">{{ t('common.loading') }}</div>
              <p v-else-if="monthly && !monthly.months.length" class="reports-view__empty">
                {{ t('billing.monthly_empty') }}
              </p>
              <div v-else-if="monthly" class="reports-view__table-wrap">
                <table class="list-table">
                  <thead>
                    <tr>
                      <th scope="col">{{ t('billing.monthly_col_month') }}</th>
                      <template v-if="hasTypeFilter">
                        <th scope="col" class="reports-view__col-money">
                          {{ t('billing.col_amount') }}
                        </th>
                      </template>
                      <template v-else>
                        <th scope="col" class="reports-view__col-money">
                          {{ t('billing.daily_col_charges') }}
                        </th>
                        <th scope="col" class="reports-view__col-money">
                          {{ t('billing.daily_col_payments') }}
                        </th>
                        <th scope="col" class="reports-view__col-money">
                          {{ t('billing.daily_col_refunds') }}
                        </th>
                        <th scope="col" class="reports-view__col-money">
                          {{ t('billing.daily_col_net') }}
                        </th>
                      </template>
                      <th scope="col" class="reports-view__col-number">
                        {{ t('billing.daily_col_entries') }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in monthly.months" :key="row.month">
                      <td>{{ fmtMonth(row.month) }}</td>
                      <template v-if="hasTypeFilter">
                        <td class="reports-view__col-money">{{ fmtMoney(row.net) }}</td>
                      </template>
                      <template v-else>
                        <td class="reports-view__col-money">{{ fmtMoney(row.charges) }}</td>
                        <td class="reports-view__col-money reports-view__cell--credit">
                          {{ fmtMoney(row.payments) }}
                        </td>
                        <td class="reports-view__col-money">{{ fmtMoney(row.refunds) }}</td>
                        <td class="reports-view__col-money">{{ fmtMoney(row.net) }}</td>
                      </template>
                      <td class="reports-view__col-number">{{ row.entries_count }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </section>

          <!-- Outstanding -->
          <section
            v-if="activeTab === 'outstanding' && outstanding"
            class="reports-view__tab-content"
          >
            <section class="pricing-card reports-view__balance-total">
              <div class="pricing-card__body">
                <div class="pricing-card__row pricing-card__row--total">
                  <span>{{ t('billing.outstanding_total') }}</span>
                  <span>{{ fmtMoney(outstanding.total_outstanding) }}</span>
                </div>
              </div>
            </section>

            <p v-if="!outstanding.bills.length" class="reports-view__empty">
              {{ t('billing.outstanding_empty') }}
            </p>
            <div v-else class="reports-view__table-wrap">
              <table class="list-table reports-view__outstanding-table">
                <thead>
                  <tr>
                    <th scope="col">{{ t('billing.outstanding_col_booking') }}</th>
                    <th scope="col">{{ t('billing.outstanding_col_opened') }}</th>
                    <th scope="col" class="reports-view__col-money">
                      {{ t('billing.outstanding_col_charges') }}
                    </th>
                    <th scope="col" class="reports-view__col-money">
                      {{ t('billing.outstanding_col_payments') }}
                    </th>
                    <th scope="col" class="reports-view__col-money">
                      {{ t('billing.outstanding_col_balance') }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="bill in outstanding.bills" :key="bill.bill_id">
                    <td>
                      <router-link
                        :to="`/bookings/${bill.booking_id}/details`"
                        class="list-table__action"
                      >
                        {{ bill.booking_id.slice(0, 8) }}…
                      </router-link>
                    </td>
                    <td class="reports-view__cell-date">{{ fmtDateTime(bill.opened_at) }}</td>
                    <td class="reports-view__col-money">{{ fmtMoney(bill.total_charges) }}</td>
                    <td class="reports-view__col-money reports-view__cell--credit">
                      {{ fmtMoney(bill.total_payments) }}
                    </td>
                    <td class="reports-view__col-money reports-view__cell--debit">
                      {{ fmtMoney(bill.outstanding) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { usePropertyStore } from '@/features/property/stores/usePropertyStore'
import {
  fetchOverview,
  fetchDailyBreakdown,
  fetchMonthlyBreakdown,
  fetchReportLedger,
  fetchOutstandingBalances,
} from '@/features/billing/api'
import type {
  OverviewResponse,
  DailyBreakdownResponse,
  MonthlyBreakdownResponse,
  ReportLedgerEntry,
  OutstandingBalancesResponse,
} from '@/features/billing/api'
import { formatMoney } from '@/shared/lib/money'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import { APP_NAME } from '@/shared/i18n/documentTitle'

type TabId = 'overview' | 'ledger' | 'outstanding'
type LedgerGrouping = 'entries' | 'daily' | 'monthly'
type PresetId = 'this_month' | 'last_month' | 'last_7' | 'last_30' | 'last_90' | 'custom'

const { t, locale } = useI18n()
const propertyStore = usePropertyStore()
const { hotel } = storeToRefs(propertyStore)

const currencyCode = computed(() => hotel.value?.currency ?? 'USD')

const activeTab = ref<TabId>('overview')
const ledgerGrouping = ref<LedgerGrouping>('entries')

const tabs = computed(() => [
  { id: 'overview' as TabId, label: t('billing.tab_overview') },
  { id: 'ledger' as TabId, label: t('billing.tab_ledger') },
  { id: 'outstanding' as TabId, label: t('billing.tab_outstanding') },
])

const groupingOptions = computed(() => [
  { value: 'entries' as LedgerGrouping, label: t('billing.ledger_grouping_entries') },
  { value: 'daily' as LedgerGrouping, label: t('billing.ledger_grouping_daily') },
  { value: 'monthly' as LedgerGrouping, label: t('billing.ledger_grouping_monthly') },
])

const activeTabLabel = computed(
  () => tabs.value.find((tab) => tab.id === activeTab.value)?.label ?? '',
)

const hotelName = computed(() => hotel.value?.name ?? '')

function printReport() {
  window.print()
}

function toYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function addDaysYmd(ymd: string, days: number): string {
  const d = parseYmd(ymd)
  d.setDate(d.getDate() + days)
  return toYmd(d)
}

function diffDays(from: string, to: string): number {
  const a = parseYmd(from)
  const b = parseYmd(to)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

function computePresetRange(preset: PresetId): { from: string; to: string } {
  const now = new Date()
  const todayStr = toYmd(now)

  switch (preset) {
    case 'this_month': {
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      return { from: toYmd(first), to: toYmd(nextMonth) }
    }
    case 'last_month': {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: toYmd(first), to: toYmd(end) }
    }
    case 'last_7':
      return { from: addDaysYmd(todayStr, -6), to: addDaysYmd(todayStr, 1) }
    case 'last_30':
      return { from: addDaysYmd(todayStr, -29), to: addDaysYmd(todayStr, 1) }
    case 'last_90':
      return { from: addDaysYmd(todayStr, -89), to: addDaysYmd(todayStr, 1) }
    default:
      return { from: todayStr, to: addDaysYmd(todayStr, 1) }
  }
}

const activePreset = ref<PresetId>('this_month')

const presetOptions = computed(() => [
  { id: 'this_month' as PresetId, label: t('billing.preset_this_month') },
  { id: 'last_month' as PresetId, label: t('billing.preset_last_month') },
  { id: 'last_7' as PresetId, label: t('billing.preset_last_7') },
  { id: 'last_30' as PresetId, label: t('billing.preset_last_30') },
  { id: 'last_90' as PresetId, label: t('billing.preset_last_90') },
  { id: 'custom' as PresetId, label: t('billing.preset_custom') },
])

const initialRange = computePresetRange('this_month')
const fromStr = ref(initialRange.from)
const toStr = ref(initialRange.to)

function isValidRange(): boolean {
  return Boolean(fromStr.value && toStr.value && fromStr.value < toStr.value)
}

function onPresetSelect(e: Event) {
  const target = e.target as HTMLSelectElement
  const id = target.value as PresetId
  if (id === 'custom') {
    activePreset.value = 'custom'
    return
  }
  activePreset.value = id
  const range = computePresetRange(id)
  fromStr.value = range.from
  toStr.value = range.to
  onRangeChanged()
}

function onDateFieldChange() {
  activePreset.value = 'custom'
  if (isValidRange()) {
    onRangeChanged()
  }
}

function shiftRange(direction: 1 | -1) {
  let step: number
  switch (activePreset.value) {
    case 'this_month':
    case 'last_month':
      activePreset.value = 'last_30'
      step = 30
      break
    case 'last_7':
      step = 7
      break
    case 'last_30':
      step = 30
      break
    case 'last_90':
      step = 90
      break
    default:
      step = diffDays(fromStr.value, toStr.value)
  }
  if (step <= 0) return

  const newFrom = addDaysYmd(fromStr.value, step * direction)
  fromStr.value = newFrom
  toStr.value = addDaysYmd(newFrom, step)
  onRangeChanged()
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const loading = ref(true)
const loadError = ref('')
const groupingLoading = ref(false)

const overview = ref<OverviewResponse | null>(null)
const daily = ref<DailyBreakdownResponse | null>(null)
const monthly = ref<MonthlyBreakdownResponse | null>(null)
const outstanding = ref<OutstandingBalancesResponse | null>(null)

const ledgerEntries = ref<ReportLedgerEntry[]>([])
const ledgerLoading = ref(false)
const ledgerHasMore = ref(false)
const ledgerEntryTypeFilter = ref('')
const hasTypeFilter = computed(() => ledgerEntryTypeFilter.value !== '')

const loadedKeys = ref(new Set<string>())

const LEDGER_PAGE_SIZE = 50

function dataKey(): string {
  if (activeTab.value === 'ledger') return `ledger:${ledgerGrouping.value}`
  return activeTab.value
}

// ---------------------------------------------------------------------------
// Entry type labels
// ---------------------------------------------------------------------------

const ENTRY_TYPE_KEYS: Record<string, string> = {
  accommodation_night: 'billing.entry_accommodation_night',
  accommodation_correction: 'billing.entry_accommodation_correction',
  rule_adjustment: 'billing.entry_rule_adjustment',
  manual_adjustment: 'billing.entry_manual_adjustment',
  system_adjustment: 'billing.entry_system_adjustment',
  service_charge: 'billing.entry_service_charge',
  payment: 'billing.entry_payment',
  refund: 'billing.entry_refund',
  correction: 'billing.entry_correction',
}

const entryTypeOptions = computed(() =>
  Object.entries(ENTRY_TYPE_KEYS).map(([value, key]) => ({
    value,
    label: t(key),
  })),
)

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function fmtMoney(amount: number): string {
  return formatMoney(amount, currencyCode.value, locale.value)
}

function fmtDelta(amount: number): string {
  const formatted = fmtMoney(Math.abs(amount))
  return amount < 0 ? `−${formatted}` : `+${formatted}`
}

function fmtShortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return iso
  try {
    return new Intl.DateTimeFormat(locale.value, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d)
  } catch {
    return iso
  }
}

function fmtDateTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  try {
    return new Intl.DateTimeFormat(locale.value, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(d)
  } catch {
    return iso
  }
}

function fmtMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  if (!y || !m) return ym
  try {
    const d = new Date(y, m - 1, 1)
    return new Intl.DateTimeFormat(locale.value, { month: 'long', year: 'numeric' }).format(d)
  } catch {
    return ym
  }
}

function entryTitle(entry: ReportLedgerEntry): string {
  const key = ENTRY_TYPE_KEYS[entry.entry_type]
  const label = key ? t(key) : entry.entry_type
  const date = entry.metadata?.date ? fmtShortDate(entry.metadata.date) : ''

  if (
    entry.entry_type === 'accommodation_night' ||
    entry.entry_type === 'accommodation_correction'
  ) {
    return date ? `${label} ${date}` : label
  }

  if (entry.entry_type === 'rule_adjustment') {
    return date ? `${label} ${date}` : label
  }

  return label
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

let loadSeq = 0

function invalidateAll() {
  loadedKeys.value.clear()
  overview.value = null
  daily.value = null
  monthly.value = null
  outstanding.value = null
  ledgerEntries.value = []
  ledgerHasMore.value = false
}

async function ensureDataLoaded() {
  const key = dataKey()
  if (loadedKeys.value.has(key)) return
  if (activeTab.value !== 'outstanding' && !isValidRange()) return

  const seq = ++loadSeq
  const isLedgerGroupSwitch = activeTab.value === 'ledger' && ledgerGrouping.value !== 'entries'

  if (isLedgerGroupSwitch) {
    groupingLoading.value = true
  } else {
    loading.value = true
  }
  loadError.value = ''

  try {
    const params = {
      from: fromStr.value,
      to: toStr.value,
      entry_type: ledgerEntryTypeFilter.value || undefined,
    }
    switch (activeTab.value) {
      case 'overview':
        overview.value = await fetchOverview(params)
        break
      case 'ledger':
        switch (ledgerGrouping.value) {
          case 'entries': {
            ledgerEntries.value = []
            const resp = await fetchReportLedger({
              ...params,
              limit: LEDGER_PAGE_SIZE,
              offset: 0,
            })
            ledgerEntries.value = resp.entries
            ledgerHasMore.value = resp.entries.length >= LEDGER_PAGE_SIZE
            break
          }
          case 'daily':
            daily.value = await fetchDailyBreakdown(params)
            break
          case 'monthly':
            monthly.value = await fetchMonthlyBreakdown(params)
            break
        }
        break
      case 'outstanding':
        outstanding.value = await fetchOutstandingBalances()
        break
    }
    if (seq === loadSeq) loadedKeys.value.add(key)
  } catch (err: unknown) {
    if (seq !== loadSeq) return
    loadError.value = formatUnknownApiError(err) || t('billing.reports_load_failed')
  } finally {
    if (seq === loadSeq) {
      loading.value = false
      groupingLoading.value = false
    }
  }
}

function onRangeChanged() {
  invalidateAll()
  ensureDataLoaded()
}

watch(activeTab, () => {
  loadError.value = ''
  ensureDataLoaded()
})

watch(ledgerGrouping, () => {
  if (activeTab.value === 'ledger') {
    loadError.value = ''
    ensureDataLoaded()
  }
})

function invalidateLedgerKeys() {
  loadedKeys.value.delete('ledger:entries')
  loadedKeys.value.delete('ledger:daily')
  loadedKeys.value.delete('ledger:monthly')
  ledgerEntries.value = []
  ledgerHasMore.value = false
  daily.value = null
  monthly.value = null
}

function onEntryTypeFilterChange() {
  invalidateLedgerKeys()
  ensureDataLoaded()
}

async function loadLedger(reset: boolean) {
  if (reset) {
    ledgerEntries.value = []
    loadedKeys.value.delete('ledger:entries')
  }
  ledgerLoading.value = true
  try {
    const resp = await fetchReportLedger({
      from: fromStr.value,
      to: toStr.value,
      entry_type: ledgerEntryTypeFilter.value || undefined,
      limit: LEDGER_PAGE_SIZE,
      offset: reset ? 0 : ledgerEntries.value.length,
    })
    if (reset) {
      ledgerEntries.value = resp.entries
    } else {
      ledgerEntries.value = [...ledgerEntries.value, ...resp.entries]
    }
    ledgerHasMore.value = resp.entries.length >= LEDGER_PAGE_SIZE
    loadedKeys.value.add('ledger:entries')
  } catch (err: unknown) {
    loadError.value = formatUnknownApiError(err) || t('billing.reports_load_failed')
  } finally {
    ledgerLoading.value = false
  }
}

function loadMoreLedger() {
  loadLedger(false)
}

onMounted(async () => {
  try {
    await propertyStore.fetchHotel()
  } catch {
    /* hotel currency fallback to USD */
  }
  ensureDataLoaded()
})
</script>

<style scoped>
.reports-view {
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  box-sizing: border-box;
}

.reports-view > .subnav {
  flex-shrink: 0;
}

.reports-view__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.reports-view__viewport {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
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
  font-size: var(--text-caption-size);
  font-weight: var(--text-label-weight);
  color: var(--ink-secondary);
  background: var(--surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  background-size: 1rem;
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
  color: var(--ink-secondary);
  background: var(--surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  white-space: nowrap;
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
  font-size: var(--text-caption-size);
  color: var(--ink-secondary);
  background: var(--surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  width: 9rem;
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

.reports-view__tab-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* Overview: 3-panel grid */
.reports-view__overview-panels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: var(--space-md);
}

.reports-view__overview-panels > .pricing-card :deep(.pricing-card__body) {
  margin-bottom: var(--space-md);
}

.reports-view__overview-panels > .pricing-card :deep(.pricing-card__footer) {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-weight: var(--text-heading-weight);
  font-size: var(--text-body-size);
  color: var(--ink-primary);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--border-default);
}

/* Tables */
.reports-view__table-wrap {
  border-radius: var(--content-area-radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  background: var(--pico-card-background-color);
}

.reports-view__col-money {
  text-align: right;
  white-space: nowrap;
}

.reports-view__col-number {
  text-align: right;
  white-space: nowrap;
}

.reports-view__cell-date {
  white-space: nowrap;
  color: var(--ink-tertiary);
}

.reports-view__cell--credit {
  color: var(--semantic-success);
}

.reports-view__cell--debit {
  color: var(--ink-primary);
}

.reports-view__entry-title {
  display: block;
  font-weight: var(--text-label-weight);
}

.reports-view__entry-desc {
  display: block;
  font-size: var(--text-caption-size);
  font-weight: var(--text-caption-weight);
  color: var(--ink-tertiary);
  margin-top: 2px;
}

.reports-view__empty {
  margin: 0;
  padding: var(--space-lg);
  text-align: center;
  color: var(--ink-muted);
  font-size: var(--text-body-size);
}

.reports-view__ledger-filter {
  display: flex;
  gap: var(--space-md);
}

.reports-view__ledger-filter label {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
}

.reports-view__ledger-filter label span {
  font-size: var(--text-label-size);
  font-weight: var(--text-label-weight);
  color: var(--ink-secondary);
}

.reports-view__ledger-filter select {
  margin-bottom: 0;
}

.reports-view__load-more {
  align-self: center;
}

.reports-view__balance-total :deep(.pricing-card__row--total) {
  border-top: none;
  margin-top: 0;
  padding-top: 0;
}

/* Print header: hidden on screen */
.reports-view__print-header {
  display: none;
}

/* Print button icon inline with text */
.toolbar-cluster--end .toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
}

@media print {
  .reports-view {
    overflow: visible !important;
    gap: 0;
  }

  .reports-view__print-header {
    display: block;
    text-align: left;
    padding: var(--space-md) 0 var(--space-lg);
    border-bottom: 2px solid var(--ink-primary);
    margin-bottom: var(--space-lg);
  }

  .reports-view__print-brand {
    font-family: var(--font-brand);
    font-size: var(--text-body-size);
    font-weight: 700;
    letter-spacing: 0.01em;
    color: var(--ink-tertiary);
  }

  .reports-view__print-title {
    margin: var(--space-xs) 0 0;
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: var(--text-heading-weight);
    color: var(--ink-primary);
  }

  .reports-view__print-meta {
    margin: var(--space-xs) 0 0;
    font-size: var(--text-body-size);
    color: var(--ink-secondary);
  }

  .page-header,
  .content-toolbar,
  .subnav {
    display: none !important;
  }

  .reports-view__body,
  .reports-view__viewport {
    overflow: visible !important;
    flex: none;
  }

  .reports-view__tab-content {
    break-inside: avoid;
  }

  .reports-view__table-wrap {
    box-shadow: none;
    border: 1px solid var(--border-default);
  }

  .reports-view__overview-panels {
    grid-template-columns: 1fr;
  }

  .reports-view__overview-panels > .pricing-card {
    box-shadow: none;
    border: none;
    border-bottom: 1px solid var(--border-default);
  }

  .reports-view__overview-panels > .pricing-card:last-child {
    border-bottom: none;
  }

  .reports-view__balance-total {
    box-shadow: none;
    border: none;
  }

  .reports-view__ledger-filter {
    display: none !important;
  }

  .reports-view__cell--credit,
  .reports-view__cell--debit {
    color: inherit !important;
  }

  .reports-view__outstanding-table th:first-child,
  .reports-view__outstanding-table td:first-child {
    display: none;
  }

  .reports-view__balance-total :deep(.pricing-card__row--total) {
    color: inherit;
  }
}
</style>
