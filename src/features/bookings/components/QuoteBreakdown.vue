<template>
  <section v-if="visible" class="pricing-card">
    <template v-if="loading || error || quote">
      <div class="pricing-card__header">
        <h3 class="pricing-card__title">{{ t('quote.title') }}</h3>
      </div>

      <div v-if="loading" class="pricing-card__status">
        <span class="pricing-card__spinner" aria-hidden="true" />
        {{ t('quote.calculating') }}
      </div>

      <div v-else-if="error" class="pricing-card__status pricing-card__status--error">
        {{ t('quote.error') }}
      </div>

      <template v-else-if="quote">
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
              <span class="pricing-card__amount-group">
                <span :class="{ 'pricing-card__amount--negative': adj.total < 0 }">
                  {{ fmtMoney(adj.total) }}
                </span>
                <button
                  v-if="adj.source === 'manual'"
                  type="button"
                  class="pricing-card__remove-adj"
                  :title="t('adjustments.remove_label')"
                  :aria-label="t('adjustments.remove_label')"
                  @click="emit('remove-manual-adjustment', adj.name)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14ZM10 11v6M14 11v6"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              </span>
            </div>
          </template>

          <template v-if="totalAdjustments.length">
            <div
              v-for="adj in totalAdjustments"
              :key="adj.key"
              class="pricing-card__row pricing-card__row--total-adj"
            >
              <span>{{ adj.name }}</span>
              <span class="pricing-card__amount-group">
                <span :class="{ 'pricing-card__amount--negative': adj.total < 0 }">
                  {{ fmtMoney(adj.total) }}
                </span>
                <button
                  v-if="adj.source === 'manual'"
                  type="button"
                  class="pricing-card__remove-adj"
                  :title="t('adjustments.remove_label')"
                  :aria-label="t('adjustments.remove_label')"
                  @click="emit('remove-manual-adjustment', adj.name)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14ZM10 11v6M14 11v6"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              </span>
            </div>
          </template>

          <div class="pricing-card__row pricing-card__row--total">
            <span>{{ t('quote.total') }}</span>
            <span>{{ fmtMoney(quote.grand_total) }}</span>
          </div>
        </div>
      </template>
    </template>

    <div class="pricing-card__actions">
      <button v-if="quote" type="button" class="pricing-card__link-btn" @click="detailsOpen = true">
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
      <div class="dialog pricing-detail-dialog" role="dialog" aria-modal="true">
        <h2 class="pricing-detail-dialog__title">{{ t('quote.title') }}</h2>

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
            <span>{{ fmtMoney(quote.nights_subtotal) }}</span>
          </div>

          <div
            v-for="(adj, adjIdx) in quote.total_adjustments"
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

const emit = defineEmits<{
  'remove-manual-adjustment': [name: string]
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
  key: string
  name: string
  source: string
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

function adjustmentKey(adj: { source: string; source_id?: string | null; name: string }): string {
  return `${adj.source}:${adj.source_id ?? ''}:${adj.name}`
}

const perNightAdjustments = computed<AggregatedAdjustment[]>(() => {
  if (!props.quote) return []
  const map = new Map<
    string,
    { dates: Set<string>; total: number; key: string; name: string; source: string }
  >()
  for (const night of props.quote.nights) {
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
          source: adj.source,
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
      source: data.source,
      total: data.total,
      nightCount: data.dates.size,
    })
  }
  return result
})

const totalAdjustments = computed<AggregatedAdjustment[]>(() => {
  if (!props.quote) return []
  return props.quote.total_adjustments.map((adj) => ({
    key: adjustmentKey(adj),
    name: adj.name,
    source: adj.source,
    total: adj.amount,
    nightCount: 0,
  }))
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
