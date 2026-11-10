<template>
  <section v-if="accommodation" class="pricing-card">
    <div class="pricing-card__header">
      <h3 class="pricing-card__title">{{ t('bookings.accommodation_title') }}</h3>
      <i18n-t
        v-if="accommodation.calculated_at"
        keypath="bookings.accommodation_quoted_at"
        tag="span"
        class="pricing-card__meta"
      >
        <template #date><MomentTime :value="accommodation.calculated_at" /></template>
      </i18n-t>
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
          :key="adj.key"
          class="pricing-card__row pricing-card__row--adjustment"
        >
          <span>
            {{ adj.name }}
            <template v-if="adj.nightCount > 0">
              &times; {{ t('quote.nights_count', adj.nightCount) }}
            </template>
          </span>
          <span :class="{ 'pricing-card__amount--negative': adj.total < 0 }">
            {{ fmtMoney(adj.total) }}
          </span>
        </div>
      </template>

      <template v-if="accommodation.total_adjustments.length">
        <div
          v-for="(adj, adjIdx) in accommodation.total_adjustments"
          :key="`${adj.source}:${adj.source_id ?? adjIdx}`"
          class="pricing-card__row pricing-card__row--total-adj"
        >
          <span>{{ adj.name }}</span>
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
                <div v-if="entry.room_type_name" class="pricing-night__room-type">
                  {{ entry.room_type_name }}
                </div>

                <div class="pricing-night__row">
                  <span>{{ t('quote.base_rate') }}</span>
                  <span>{{ fmtMoney(entry.base_rate) }}</span>
                </div>

                <div
                  v-for="(adj, adjIdx) in entry.adjustments"
                  :key="`${adj.source}:${adj.source_id ?? adjIdx}`"
                  class="pricing-night__row pricing-night__row--adjustment"
                >
                  <span>{{ adj.name }}</span>
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
            v-for="(adj, adjIdx) in accommodation.total_adjustments"
            :key="`${adj.source}:${adj.source_id ?? adjIdx}`"
            class="pricing-detail__row pricing-detail__row--total-adj"
          >
            <span>{{ adj.name }}</span>
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
import type { AccommodationSnapshot, StayQuoteNight } from '@/features/pricing/api'
import { formatMoney } from '@/shared/lib/money'
import { formatLocalDate, WEEKDAY_DATE } from '@/shared/lib/localDate'
import MomentTime from '@/shared/components/MomentTime.vue'

const props = defineProps<{
  accommodation: AccommodationSnapshot | null | undefined
  currency: string
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
  key: string
  name: string
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

function adjustmentKey(adj: { source: string; source_id?: string | null; name: string }): string {
  return `${adj.source}:${adj.source_id ?? ''}:${adj.name}`
}

const perNightAdjustments = computed<AggregatedAdjustment[]>(() => {
  if (!props.accommodation) return []
  const map = new Map<string, { dates: Set<string>; total: number; key: string; name: string }>()
  for (const night of props.accommodation.nights) {
    for (const adj of night.adjustments) {
      const k = adjustmentKey(adj)
      const existing = map.get(k)
      if (existing) {
        existing.total += adj.amount
        existing.dates.add(night.date)
      } else {
        map.set(k, {
          key: k,
          name: adj.name,
          total: adj.amount,
          dates: new Set([night.date]),
        })
      }
    }
  }
  const result: AggregatedAdjustment[] = []
  for (const [, data] of map) {
    result.push({
      key: data.key,
      name: data.name,
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

function fmtMoney(amount: number): string {
  if (!props.currency) return ''
  return formatMoney(amount, props.currency, locale.value)
}

function fmtDate(dateStr: string): string {
  return formatLocalDate(dateStr, locale.value, WEEKDAY_DATE)
}

/** Name of a room type, as the nights of the quote carry it. */
function roomTypeName(id: string): string {
  return props.accommodation?.nights.find((n) => n.room_type_id === id)?.room_type_name ?? ''
}
</script>
