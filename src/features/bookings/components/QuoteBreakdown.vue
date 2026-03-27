<template>
  <section v-if="visible" class="page-footer quote-breakdown">
    <template v-if="loading || error || quote">
      <h3 class="quote-breakdown__title">{{ t('quote.title') }}</h3>

      <div v-if="loading" class="quote-breakdown__status">
        <span class="quote-breakdown__spinner" aria-hidden="true" />
        {{ t('quote.calculating') }}
      </div>

      <div v-else-if="error" class="quote-breakdown__status quote-breakdown__status--error">
        {{ t('quote.error') }}
      </div>

      <template v-else-if="quote">
        <div class="quote-summary">
          <div v-for="group in roomTypeGroups" :key="group.roomTypeId" class="quote-summary__row">
            <span>
              <template v-if="group.roomCount > 1">{{ group.roomCount }} </template>
              {{ group.label }} &times; {{ t('quote.nights_count', group.nightCount) }}
            </span>
            <span>{{ fmtMoney(group.baseTotal) }}</span>
          </div>

          <template v-if="allAdjustments.length">
            <div
              v-for="adj in allAdjustments"
              :key="adj.ruleId"
              class="quote-summary__row quote-summary__row--adjustment"
            >
              <span>{{ adj.ruleName }} &times; {{ t('quote.nights_count', adj.nightCount) }}</span>
              <span :class="{ 'quote-amount--negative': adj.total < 0 }">
                {{ fmtMoney(adj.total) }}
              </span>
            </div>
          </template>

          <div class="quote-summary__row quote-summary__row--total">
            <span>{{ t('quote.total') }}</span>
            <span>{{ fmtMoney(quote.grand_total) }}</span>
          </div>
        </div>
      </template>
    </template>

    <div class="quote-breakdown__actions">
      <button
        v-if="quote"
        type="button"
        class="quote-breakdown__details-btn"
        @click="detailsOpen = true"
      >
        {{ t('quote.view_details') }}
      </button>
      <slot name="actions" />
    </div>
  </section>

  <Teleport to="body">
    <div
      v-if="detailsOpen && quote"
      class="dialog-backdrop"
      role="presentation"
      @click.self="detailsOpen = false"
    >
      <div class="dialog quote-detail-dialog" role="dialog" aria-modal="true">
        <h2 class="quote-detail-dialog__title">{{ t('quote.title') }}</h2>

        <div class="quote-detail-dialog__body">
          <div class="quote-detail__nights">
            <div v-for="group in nightsByDate" :key="group.date" class="quote-date-group">
              <div class="quote-date-group__header">{{ fmtDate(group.date) }}</div>

              <div v-for="(entry, idx) in group.entries" :key="idx" class="quote-night">
                <div v-if="roomTypeName(entry.room_type_id)" class="quote-night__room-type">
                  {{ roomTypeName(entry.room_type_id) }}
                </div>

                <div class="quote-night__row">
                  <span>{{ t('quote.base_rate') }}</span>
                  <span>{{ fmtMoney(entry.base_rate) }}</span>
                </div>

                <div
                  v-for="adj in entry.adjustments"
                  :key="adj.rule_id"
                  class="quote-night__row quote-night__row--adjustment"
                >
                  <span>{{ adj.rule_name }}</span>
                  <span :class="{ 'quote-amount--negative': adj.amount < 0 }">
                    {{ fmtMoney(adj.amount) }}
                  </span>
                </div>

                <div class="quote-night__row quote-night__row--subtotal">
                  <span>{{ t('quote.night_subtotal') }}</span>
                  <span>{{ fmtMoney(entry.subtotal) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="quote-detail__footer">
          <div class="quote-detail__row">
            <span>{{ t('quote.subtotal') }}</span>
            <span>{{ fmtMoney(quote.nights_subtotal) }}</span>
          </div>

          <div
            v-for="adj in quote.total_adjustments"
            :key="adj.rule_id"
            class="quote-detail__row quote-detail__row--adjustment"
          >
            <span>{{ adj.rule_name }}</span>
            <span :class="{ 'quote-amount--negative': adj.amount < 0 }">
              {{ fmtMoney(adj.amount) }}
            </span>
          </div>

          <div class="quote-detail__row quote-detail__row--total">
            <span>{{ t('quote.total') }}</span>
            <span>{{ fmtMoney(quote.grand_total) }}</span>
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
import type { StayQuoteResponse, StayQuoteNight } from '@/shared/types/commercial'
import { formatMoney } from '@/shared/lib/money'

const props = defineProps<{
  quote: StayQuoteResponse | null
  currency: string
  loading: boolean
  error: string
  roomTypeNames?: Record<string, string>
}>()

const slots = defineSlots<{ actions?(): unknown }>()

const { t, locale } = useI18n()

const visible = computed(() => props.loading || !!props.error || !!props.quote || !!slots.actions)
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
  if (!props.quote) return []
  const map = new Map<string, { dates: Set<string>; entries: number; baseTotal: number }>()
  for (const night of props.quote.nights) {
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

const allAdjustments = computed<AggregatedAdjustment[]>(() => {
  if (!props.quote) return []
  const map = new Map<
    string,
    { dates: Set<string>; total: number; ruleId: string; ruleName: string }
  >()
  for (const night of props.quote.nights) {
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
  for (const adj of props.quote.total_adjustments) {
    result.push({
      ruleId: adj.rule_id,
      ruleName: adj.rule_name,
      total: adj.amount,
      nightCount: 0,
    })
  }
  return result
})

const nightsByDate = computed<DateGroup[]>(() => {
  if (!props.quote) return []
  const map = new Map<string, StayQuoteNight[]>()
  for (const night of props.quote.nights) {
    const existing = map.get(night.date)
    if (existing) {
      existing.push(night)
    } else {
      map.set(night.date, [night])
    }
  }
  return Array.from(map, ([date, entries]) => ({ date, entries }))
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
/* ----- Footer summary ----- */

.quote-breakdown {
  background: var(--surface-1);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.quote-breakdown__title {
  font-size: var(--text-subheading-size);
  font-weight: var(--text-subheading-weight);
  letter-spacing: var(--text-subheading-tracking);
  color: var(--ink-primary);
  margin: 0;
}

.quote-breakdown__status {
  font-size: var(--text-body-size);
  color: var(--ink-tertiary);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.quote-breakdown__status--error {
  color: var(--semantic-error);
}

.quote-breakdown__spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid var(--border-default);
  border-top-color: var(--brand-primary);
  border-radius: 50%;
  animation: quote-spin 0.6s linear infinite;
}

@keyframes quote-spin {
  to {
    transform: rotate(360deg);
  }
}

.quote-summary {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quote-summary__row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: var(--text-data-size);
  color: var(--ink-secondary);
}

.quote-summary__row--adjustment {
  font-size: var(--text-caption-size);
  color: var(--ink-tertiary);
  font-style: italic;
  padding-left: var(--space-sm);
}

.quote-summary__row--total {
  font-weight: var(--text-heading-weight);
  font-size: var(--text-body-size);
  color: var(--ink-primary);
  padding-top: var(--space-xs);
  border-top: 1px solid var(--border-default);
  margin-top: var(--space-xs);
}

.quote-breakdown__actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-xs);
}

.quote-breakdown__details-btn {
  all: unset;
  cursor: pointer;
  font-size: var(--text-caption-size);
  font-weight: var(--text-label-weight);
  color: var(--brand-primary);
}

.quote-breakdown__details-btn:hover {
  color: var(--brand-primary-hover);
  text-decoration: underline;
}

.quote-amount--negative {
  color: var(--semantic-success);
}

/* ----- Detail dialog ----- */

.quote-detail-dialog {
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: 0;
}

.quote-detail-dialog__title {
  font-size: var(--text-heading-size);
  font-weight: var(--text-heading-weight);
  letter-spacing: var(--text-heading-tracking);
  color: var(--ink-primary);
  margin: 0;
  padding: var(--space-xl) var(--space-xl) 0;
}

.quote-detail-dialog__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-height: 60vh;
  overflow-y: auto;
  padding: 0 var(--space-xl);
}

.quote-detail-dialog :deep(.dialog-actions) {
  padding: 0 var(--space-xl) var(--space-xl);
}

.quote-detail__nights {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.quote-date-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.quote-date-group__header {
  font-size: var(--text-label-size);
  font-weight: var(--text-label-weight);
  color: var(--ink-primary);
}

.quote-night {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: var(--space-sm);
}

.quote-night__room-type {
  font-size: var(--text-caption-size);
  font-weight: var(--text-label-weight);
  color: var(--ink-secondary);
}

.quote-night__row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-left: var(--space-sm);
  font-size: var(--text-caption-size);
  color: var(--ink-secondary);
}

.quote-night__row--adjustment {
  color: var(--ink-tertiary);
  font-style: italic;
}

.quote-night__row--subtotal {
  font-weight: var(--text-data-weight);
  color: var(--ink-primary);
}

.quote-detail__footer {
  border-top: 1px solid var(--border-subtle);
  padding: var(--space-sm) var(--space-xl) 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quote-detail__row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: var(--text-data-size);
  color: var(--ink-secondary);
}

.quote-detail__row--adjustment {
  font-size: var(--text-caption-size);
  color: var(--ink-tertiary);
  font-style: italic;
}

.quote-detail__row--total {
  font-weight: var(--text-heading-weight);
  font-size: var(--text-body-size);
  color: var(--ink-primary);
  padding-top: var(--space-xs);
  border-top: 1px solid var(--border-default);
  margin-top: var(--space-xs);
}
</style>
