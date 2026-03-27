<template>
  <div v-if="visible" class="folio-section">
    <div v-if="loading" class="loading-state">{{ t('common.loading') }}</div>
    <p v-else-if="loadError" class="error-message">{{ loadError }}</p>

    <template v-else-if="billData">
      <section v-if="billData.entries.length" class="folio-section__table-wrap">
        <table class="list-table" role="grid">
          <thead>
            <tr>
              <th scope="col">{{ t('billing.col_description') }}</th>
              <th scope="col">{{ t('billing.col_date') }}</th>
              <th scope="col" class="folio-section__col-amount">
                {{ t('billing.col_amount') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in billData.entries" :key="entry.id">
              <td>
                <span class="folio-section__entry-title">{{ entryTitle(entry) }}</span>
                <span v-if="entry.description" class="folio-section__entry-desc">{{
                  entry.description
                }}</span>
              </td>
              <td class="folio-section__cell-date">{{ fmtDateTime(entry.created_at) }}</td>
              <td
                class="folio-section__col-amount"
                :class="{
                  'folio-section__amount--credit': entry.balance_delta < 0,
                  'folio-section__amount--debit': entry.balance_delta > 0,
                }"
              >
                {{ fmtDelta(entry.balance_delta) }}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <p v-else class="empty-state">{{ t('billing.no_entries') }}</p>

      <section class="pricing-card folio-section__balance">
        <div class="pricing-card__body">
          <div class="pricing-card__row pricing-card__row--total">
            <span>{{ t('billing.outstanding_balance') }}</span>
            <span
              :class="{
                'pricing-card__amount--negative': billData.outstanding_balance <= 0,
              }"
            >
              {{ fmtMoney(billData.outstanding_balance) }}
            </span>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { fetchGuestBill, type BillResponse, type LedgerEntry } from '@/features/billing/api'
import { usePropertyStore } from '@/features/property/stores/usePropertyStore'
import { formatMoney } from '@/shared/lib/money'
import { httpErrorResponse } from '@/shared/unknownError'
import { formatUnknownApiError } from '@/shared/i18n/apiError'

const props = defineProps<{
  bookingId: string | null | undefined
  bookingStatus: string | undefined
  currency: string
}>()

const { t, locale } = useI18n()

const propertyStore = usePropertyStore()
const { roomTypes } = storeToRefs(propertyStore)
propertyStore.fetchRoomTypes()

function roomTypeName(id: string | undefined): string | undefined {
  if (!id) return undefined
  return roomTypes.value.find((rt) => rt.id === id)?.name
}

const billData = ref<BillResponse | null>(null)
const loading = ref(false)
const loadError = ref('')

let loadSeq = 0

const hasBillStatus = computed(() => {
  const s = props.bookingStatus
  return s === 'checked_in' || s === 'checked_out' || s === 'canceled'
})

const visible = computed(
  () => hasBillStatus.value && (loading.value || !!billData.value || !!loadError.value),
)

const ENTRY_TYPE_KEYS: Record<string, string> = {
  accommodation_night: 'billing.entry_accommodation_night',
  accommodation_correction: 'billing.entry_accommodation_correction',
  rule_adjustment: 'billing.entry_rule_adjustment',
  manual_adjustment: 'billing.entry_manual_adjustment',
  service_charge: 'billing.entry_service_charge',
  payment: 'billing.entry_payment',
  refund: 'billing.entry_refund',
  correction: 'billing.entry_correction',
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

function entryTitle(entry: LedgerEntry): string {
  const key = ENTRY_TYPE_KEYS[entry.entry_type]
  const label = key ? t(key) : entry.entry_type
  const date = entry.metadata?.date ? fmtShortDate(entry.metadata.date) : ''

  if (
    entry.entry_type === 'accommodation_night' ||
    entry.entry_type === 'accommodation_correction'
  ) {
    const rtName = roomTypeName(entry.metadata?.room_type_id)
    const head = date ? `${label} ${date}` : label
    return rtName ? `${head} — ${rtName}` : head
  }

  if (entry.entry_type === 'rule_adjustment') {
    return date ? `${label} ${date}` : label
  }

  return label
}

function fmtMoney(amount: number): string {
  const cur = props.currency
  if (!cur) return String(amount)
  return formatMoney(amount, cur, locale.value)
}

function fmtDelta(amount: number): string {
  const formatted = fmtMoney(Math.abs(amount))
  return amount < 0 ? `−${formatted}` : `+${formatted}`
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

async function loadBill() {
  const id = props.bookingId
  if (!id || !hasBillStatus.value) {
    billData.value = null
    loadError.value = ''
    return
  }
  const seq = ++loadSeq
  loading.value = true
  loadError.value = ''
  billData.value = null
  try {
    const resp = await fetchGuestBill(id)
    if (seq !== loadSeq) return
    billData.value = resp
  } catch (err: unknown) {
    if (seq !== loadSeq) return
    if (httpErrorResponse(err)?.status === 404) {
      billData.value = null
    } else {
      loadError.value = formatUnknownApiError(err) || t('billing.load_failed')
    }
  } finally {
    if (seq === loadSeq) loading.value = false
  }
}

watch(
  () => [props.bookingId, props.bookingStatus] as const,
  () => loadBill(),
  { immediate: true },
)

defineExpose({ reload: loadBill })
</script>

<style scoped>
.folio-section__table-wrap {
  flex: 1;
  min-height: 0;
  border-radius: var(--content-area-radius);
  overflow: hidden auto;
  box-shadow: var(--shadow-sm);
  background: var(--pico-card-background-color);
}

.folio-section__table-wrap :deep(td) {
  vertical-align: top;
}

.folio-section__col-amount {
  text-align: right;
  white-space: nowrap;
}

.folio-section__cell-date {
  white-space: nowrap;
  color: var(--ink-tertiary);
}

.folio-section__amount--credit {
  color: var(--semantic-success);
}

.folio-section__amount--debit {
  color: var(--ink-primary);
}

.folio-section__entry-title {
  display: block;
  font-weight: var(--text-label-weight);
}

.folio-section__entry-desc {
  display: block;
  font-size: var(--text-caption-size);
  font-weight: var(--text-caption-weight);
  color: var(--ink-tertiary);
  margin-top: 2px;
}

.folio-section__balance {
  flex-shrink: 0;
}

.folio-section__balance .pricing-card__row--total {
  border-top: none;
  margin-top: 0;
  padding-top: 0;
}
</style>
