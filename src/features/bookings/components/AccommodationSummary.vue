<template>
  <section v-if="accommodation" class="pricing-card">
    <div class="pricing-card__header">
      <h3 class="pricing-card__title">{{ t('bookings.accommodation_title') }}</h3>
      <span v-if="formattedQuotedAt" class="pricing-card__meta">
        {{ t('bookings.accommodation_quoted_at', { date: formattedQuotedAt }) }}
      </span>
    </div>

    <div class="pricing-card__body">
      <div v-for="group in roomTypeGroups" :key="group.roomTypeId" class="pricing-card__row">
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
          class="pricing-card__row pricing-card__row--adjustment"
        >
          <span>{{ adj.ruleName }} &times; {{ t('quote.nights_count', adj.nightCount) }}</span>
          <span :class="{ 'pricing-card__amount--negative': adj.total < 0 }">
            {{ fmtMoney(adj.total) }}
          </span>
        </div>
      </template>

      <template v-if="accommodation.total_adjustments.length">
        <div
          v-for="adj in accommodation.total_adjustments"
          :key="adj.rule_id"
          class="pricing-card__row pricing-card__row--adjustment"
        >
          <span>{{ adj.rule_name }}</span>
          <span :class="{ 'pricing-card__amount--negative': adj.amount < 0 }">
            {{ fmtMoney(adj.amount) }}
          </span>
        </div>
      </template>

      <div class="pricing-card__row pricing-card__row--total">
        <span>{{ t('quote.total') }}</span>
        <span>{{ fmtMoney(accommodation.grand_total) }}</span>
      </div>
    </div>

    <div class="pricing-card__actions">
      <button type="button" class="pricing-card__link-btn" @click="detailsOpen = true">
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
      <div class="dialog pricing-detail-dialog" role="dialog" aria-modal="true">
        <h2 class="pricing-detail-dialog__title">{{ t('bookings.accommodation_title') }}</h2>

        <div class="pricing-detail-dialog__body">
          <div class="pricing-detail__nights">
            <div v-for="group in nightsByDate" :key="group.date" class="pricing-date-group">
              <div class="pricing-date-group__header">{{ fmtDate(group.date) }}</div>

              <div v-for="(entry, idx) in group.entries" :key="idx" class="pricing-night">
                <div v-if="roomTypeName(entry.room_type_id)" class="pricing-night__room-type">
                  {{ roomTypeName(entry.room_type_id) }}
                </div>

                <div class="pricing-night__row">
                  <span>{{ t('quote.base_rate') }}</span>
                  <span>{{ fmtMoney(entry.base_rate) }}</span>
                </div>

                <div
                  v-for="adj in entry.adjustments"
                  :key="adj.rule_id"
                  class="pricing-night__row pricing-night__row--adjustment"
                >
                  <span>{{ adj.rule_name }}</span>
                  <span :class="{ 'pricing-card__amount--negative': adj.amount < 0 }">
                    {{ fmtMoney(adj.amount) }}
                  </span>
                </div>

                <div class="pricing-night__row pricing-night__row--subtotal">
                  <span>{{ t('quote.night_subtotal') }}</span>
                  <span>{{ fmtMoney(entry.subtotal) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="pricing-detail__footer">
          <div class="pricing-detail__row">
            <span>{{ t('quote.subtotal') }}</span>
            <span>{{ fmtMoney(accommodation.nights_subtotal) }}</span>
          </div>

          <div
            v-for="adj in accommodation.total_adjustments"
            :key="adj.rule_id"
            class="pricing-detail__row pricing-detail__row--adjustment"
          >
            <span>{{ adj.rule_name }}</span>
            <span :class="{ 'pricing-card__amount--negative': adj.amount < 0 }">
              {{ fmtMoney(adj.amount) }}
            </span>
          </div>

          <div class="pricing-detail__row pricing-detail__row--total">
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
