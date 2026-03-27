<template>
  <section v-if="accommodation" class="accommodation-summary">
    <div class="accommodation-summary__header">
      <h3 class="accommodation-summary__title">{{ t('bookings.accommodation_title') }}</h3>
      <span v-if="formattedQuotedAt" class="accommodation-summary__meta">
        {{ t('bookings.accommodation_quoted_at', { date: formattedQuotedAt }) }}
      </span>
    </div>

    <div class="accommodation-summary__body">
      <div
        v-for="group in roomTypeGroups"
        :key="group.roomTypeId"
        class="accommodation-summary__row"
      >
        <span>
          <template v-if="group.roomCount > 1">{{ group.roomCount }} </template>
          {{ group.label }} &times; {{ t('quote.nights_count', group.nightCount) }}
        </span>
        <span>{{ fmtMoney(group.baseTotal) }}</span>
      </div>

      <template v-if="perNightAdjustments.length">
        <div
          v-for="adj in perNightAdjustments"
          :key="adj.ruleId"
          class="accommodation-summary__row accommodation-summary__row--adjustment"
        >
          <span>{{ adj.ruleName }} &times; {{ t('quote.nights_count', adj.nightCount) }}</span>
          <span :class="{ 'accommodation-summary__amount--negative': adj.total < 0 }">
            {{ fmtMoney(adj.total) }}
          </span>
        </div>
      </template>

      <template v-if="accommodation.total_adjustments.length">
        <div
          v-for="adj in accommodation.total_adjustments"
          :key="adj.rule_id"
          class="accommodation-summary__row accommodation-summary__row--adjustment"
        >
          <span>{{ adj.rule_name }}</span>
          <span :class="{ 'accommodation-summary__amount--negative': adj.amount < 0 }">
            {{ fmtMoney(adj.amount) }}
          </span>
        </div>
      </template>

      <div class="accommodation-summary__row accommodation-summary__row--total">
        <span>{{ t('quote.total') }}</span>
        <span>{{ fmtMoney(accommodation.grand_total) }}</span>
      </div>
    </div>

    <div class="accommodation-summary__actions">
      <button type="button" class="accommodation-summary__details-btn" @click="detailsOpen = true">
        {{ t('bookings.accommodation_view_details') }}
      </button>
    </div>
  </section>

  <Teleport to="body">
    <div
      v-if="detailsOpen && accommodation"
      class="dialog-backdrop"
      role="presentation"
      @click.self="detailsOpen = false"
    >
      <div class="dialog accommodation-detail-dialog" role="dialog" aria-modal="true">
        <h2 class="accommodation-detail-dialog__title">{{ t('bookings.accommodation_title') }}</h2>

        <div class="accommodation-detail-dialog__body">
          <div class="accommodation-detail__nights">
            <div v-for="group in nightsByDate" :key="group.date" class="accommodation-date-group">
              <div class="accommodation-date-group__header">{{ fmtDate(group.date) }}</div>

              <div v-for="(entry, idx) in group.entries" :key="idx" class="accommodation-night">
                <div v-if="roomTypeName(entry.room_type_id)" class="accommodation-night__room-type">
                  {{ roomTypeName(entry.room_type_id) }}
                </div>

                <div class="accommodation-night__row">
                  <span>{{ t('quote.base_rate') }}</span>
                  <span>{{ fmtMoney(entry.base_rate) }}</span>
                </div>

                <div
                  v-for="adj in entry.adjustments"
                  :key="adj.rule_id"
                  class="accommodation-night__row accommodation-night__row--adjustment"
                >
                  <span>{{ adj.rule_name }}</span>
                  <span :class="{ 'accommodation-summary__amount--negative': adj.amount < 0 }">
                    {{ fmtMoney(adj.amount) }}
                  </span>
                </div>

                <div class="accommodation-night__row accommodation-night__row--subtotal">
                  <span>{{ t('quote.night_subtotal') }}</span>
                  <span>{{ fmtMoney(entry.subtotal) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="accommodation-detail__footer">
          <div class="accommodation-detail__row">
            <span>{{ t('quote.subtotal') }}</span>
            <span>{{ fmtMoney(accommodation.nights_subtotal) }}</span>
          </div>

          <div
            v-for="adj in accommodation.total_adjustments"
            :key="adj.rule_id"
            class="accommodation-detail__row accommodation-detail__row--adjustment"
          >
            <span>{{ adj.rule_name }}</span>
            <span :class="{ 'accommodation-summary__amount--negative': adj.amount < 0 }">
              {{ fmtMoney(adj.amount) }}
            </span>
          </div>

          <div class="accommodation-detail__row accommodation-detail__row--total">
            <span>{{ t('quote.total') }}</span>
            <span>{{ fmtMoney(accommodation.grand_total) }}</span>
          </div>
        </div>

        <div class="dialog-actions">
          <button type="button" class="btn-secondary" @click="detailsOpen = false">
            {{ t('common.close') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AccommodationSnapshot, StayQuoteNight } from '@/shared/types/commercial'
import { formatMoney } from '@/shared/lib/money'

const props = defineProps<{
  accommodation: AccommodationSnapshot | null | undefined
  currency: string
  roomTypeNames?: Record<string, string>
}>()

const { t, locale } = useI18n()
const detailsOpen = ref(false)

interface RoomTypeGroup {
  roomTypeId: string
  label: string
  roomCount: number
  nightCount: number
  baseTotal: number
}

interface AggregatedAdjustment {
  ruleId: string
  ruleName: string
  total: number
  nightCount: number
}

interface DateGroup {
  date: string
  entries: StayQuoteNight[]
}

const roomTypeGroups = computed<RoomTypeGroup[]>(() => {
  if (!props.accommodation) return []
  const map = new Map<string, { dates: Set<string>; entries: number; baseTotal: number }>()
  for (const night of props.accommodation.nights) {
    const existing = map.get(night.room_type_id)
    if (existing) {
      existing.dates.add(night.date)
      existing.entries++
      existing.baseTotal += night.base_rate
    } else {
      map.set(night.room_type_id, {
        dates: new Set([night.date]),
        entries: 1,
        baseTotal: night.base_rate,
      })
    }
  }
  const result: RoomTypeGroup[] = []
  for (const [rtId, data] of map) {
    const nightCount = data.dates.size
    result.push({
      roomTypeId: rtId,
      label: roomTypeName(rtId) || rtId,
      roomCount: nightCount > 0 ? data.entries / nightCount : data.entries,
      nightCount,
      baseTotal: data.baseTotal,
    })
  }
  return result
})

const perNightAdjustments = computed<AggregatedAdjustment[]>(() => {
  if (!props.accommodation) return []
  const map = new Map<
    string,
    { dates: Set<string>; total: number; ruleId: string; ruleName: string }
  >()
  for (const night of props.accommodation.nights) {
    for (const adj of night.adjustments) {
      const existing = map.get(adj.rule_id)
      if (existing) {
        existing.total += adj.amount
        existing.dates.add(night.date)
      } else {
        map.set(adj.rule_id, {
          ruleId: adj.rule_id,
          ruleName: adj.rule_name,
          total: adj.amount,
          dates: new Set([night.date]),
        })
      }
    }
  }
  const result: AggregatedAdjustment[] = []
  for (const [, data] of map) {
    result.push({
      ruleId: data.ruleId,
      ruleName: data.ruleName,
      total: data.total,
      nightCount: data.dates.size,
    })
  }
  return result
})

const nightsByDate = computed<DateGroup[]>(() => {
  if (!props.accommodation) return []
  const map = new Map<string, StayQuoteNight[]>()
  for (const night of props.accommodation.nights) {
    const existing = map.get(night.date)
    if (existing) {
      existing.push(night)
    } else {
      map.set(night.date, [night])
    }
  }
  return Array.from(map, ([date, entries]) => ({ date, entries }))
})

const formattedQuotedAt = computed(() => {
  if (!props.accommodation?.calculated_at) return ''
  const d = new Date(props.accommodation.calculated_at)
  if (Number.isNaN(d.getTime())) return ''
  try {
    return new Intl.DateTimeFormat(locale.value, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d)
  } catch {
    return props.accommodation.calculated_at
  }
})

function fmtMoney(amount: number): string {
  if (!props.currency) return ''
  return formatMoney(amount, props.currency, locale.value)
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return dateStr
  try {
    return new Intl.DateTimeFormat(locale.value, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(d)
  } catch {
    return dateStr
  }
}

function roomTypeName(id: string): string {
  return props.roomTypeNames?.[id] ?? ''
}
</script>

<style scoped>
.accommodation-summary {
  background: var(--surface-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--content-area-radius);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.accommodation-summary__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-sm);
}

.accommodation-summary__title {
  font-size: var(--text-subheading-size);
  font-weight: var(--text-subheading-weight);
  letter-spacing: var(--text-subheading-tracking);
  color: var(--ink-primary);
  margin: 0;
}

.accommodation-summary__meta {
  font-size: var(--text-caption-size);
  font-weight: var(--text-caption-weight);
  color: var(--ink-tertiary);
  white-space: nowrap;
}

.accommodation-summary__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.accommodation-summary__row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: var(--text-data-size);
  color: var(--ink-secondary);
}

.accommodation-summary__row--adjustment {
  font-size: var(--text-caption-size);
  color: var(--ink-tertiary);
  font-style: italic;
  padding-left: var(--space-sm);
}

.accommodation-summary__row--total {
  font-weight: var(--text-heading-weight);
  font-size: var(--text-body-size);
  color: var(--ink-primary);
  padding-top: var(--space-xs);
  border-top: 1px solid var(--border-default);
  margin-top: var(--space-xs);
}

.accommodation-summary__amount--negative {
  color: var(--semantic-success);
}

.accommodation-summary__actions {
  display: flex;
  justify-content: flex-end;
}

.accommodation-summary__details-btn {
  all: unset;
  cursor: pointer;
  font-size: var(--text-caption-size);
  font-weight: var(--text-label-weight);
  color: var(--brand-primary);
}

.accommodation-summary__details-btn:hover {
  color: var(--brand-primary-hover);
  text-decoration: underline;
}

/* ----- Detail dialog ----- */

.accommodation-detail-dialog {
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: 0;
}

.accommodation-detail-dialog__title {
  font-size: var(--text-heading-size);
  font-weight: var(--text-heading-weight);
  letter-spacing: var(--text-heading-tracking);
  color: var(--ink-primary);
  margin: 0;
  padding: var(--space-xl) var(--space-xl) 0;
}

.accommodation-detail-dialog__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-height: 60vh;
  overflow-y: auto;
  padding: 0 var(--space-xl);
}

.accommodation-detail-dialog :deep(.dialog-actions) {
  padding: 0 var(--space-xl) var(--space-xl);
}

.accommodation-detail__nights {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.accommodation-date-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.accommodation-date-group__header {
  font-size: var(--text-label-size);
  font-weight: var(--text-label-weight);
  color: var(--ink-primary);
}

.accommodation-night {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: var(--space-sm);
}

.accommodation-night__room-type {
  font-size: var(--text-caption-size);
  font-weight: var(--text-label-weight);
  color: var(--ink-secondary);
}

.accommodation-night__row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-left: var(--space-sm);
  font-size: var(--text-caption-size);
  color: var(--ink-secondary);
}

.accommodation-night__row--adjustment {
  color: var(--ink-tertiary);
  font-style: italic;
}

.accommodation-night__row--subtotal {
  font-weight: var(--text-data-weight);
  color: var(--ink-primary);
}

.accommodation-detail__footer {
  border-top: 1px solid var(--border-subtle);
  padding: var(--space-sm) var(--space-xl) 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.accommodation-detail__row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: var(--text-data-size);
  color: var(--ink-secondary);
}

.accommodation-detail__row--adjustment {
  font-size: var(--text-caption-size);
  color: var(--ink-tertiary);
  font-style: italic;
}

.accommodation-detail__row--total {
  font-weight: var(--text-heading-weight);
  font-size: var(--text-body-size);
  color: var(--ink-primary);
  padding-top: var(--space-xs);
  border-top: 1px solid var(--border-default);
  margin-top: var(--space-xs);
}
</style>
