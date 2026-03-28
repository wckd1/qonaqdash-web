<template>
  <Teleport to="body">
    <div class="dialog-backdrop" role="presentation" @click.self="close">
      <div class="dialog billing-dialog" role="dialog" :aria-labelledby="titleId" aria-modal="true">
        <h2 :id="titleId" class="billing-dialog__title">{{ t('billing.record_refund') }}</h2>

        <form @submit.prevent="submit">
          <label>
            {{ t('billing.select_payment') }}
            <abbr class="required" :title="t('common.required')">*</abbr>
            <select v-model="selectedPaymentId" required>
              <option value="" disabled>{{ t('billing.select_payment_placeholder') }}</option>
              <option v-for="entry in paymentEntries" :key="entry.id" :value="entry.id">
                {{ paymentOptionLabel(entry) }}
              </option>
            </select>
          </label>

          <label>
            {{ t('billing.amount_label') }}
            <abbr class="required" :title="t('common.required')">*</abbr>
            <div class="billing-dialog__amount-wrap">
              <input
                v-model.number="amount"
                type="number"
                :min="step"
                :step="step"
                required
                :placeholder="amountPlaceholder"
                class="billing-dialog__amount-input"
              />
              <span class="billing-dialog__currency">{{ currencyHint }}</span>
            </div>
          </label>

          <label>
            {{ t('billing.description_label') }}
            <span class="optional">{{ t('common.optional') }}</span>
            <input
              v-model="description"
              type="text"
              :placeholder="t('billing.refund_desc_placeholder')"
            />
          </label>

          <div class="dialog-actions">
            <button type="button" class="btn-secondary" :disabled="submitting" @click="close">
              {{ t('common.cancel') }}
            </button>
            <button type="submit" :disabled="submitting || !canSubmit">
              {{ submitting ? t('common.saving') : t('billing.record_refund') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { recordRefund } from '@/features/billing/api'
import type { LedgerEntry } from '@/shared/types/billing'
import {
  majorToMinor,
  getCurrencyExponent,
  getCurrencySymbol,
  formatMoney,
} from '@/shared/lib/money'
import { useNotification } from '@/shared/composables/useNotification'

const props = defineProps<{
  bookingId: string
  currency: string
  paymentEntries: LedgerEntry[]
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const { t, locale } = useI18n()
const { success: showSuccess } = useNotification()
const titleId = useId()

const selectedPaymentId = ref('')
const amount = ref<number | undefined>(undefined)
const description = ref('')
const submitting = ref(false)

const step = computed(() => 1 / 10 ** getCurrencyExponent(props.currency))

const amountPlaceholder = computed(() => {
  const exp = getCurrencyExponent(props.currency)
  return (0).toFixed(exp)
})

const currencyHint = computed(() => getCurrencySymbol(props.currency))

const canSubmit = computed(
  () => selectedPaymentId.value !== '' && typeof amount.value === 'number' && amount.value > 0,
)

function paymentOptionLabel(entry: LedgerEntry): string {
  const abs = Math.abs(entry.balance_delta)
  const formatted = formatMoney(abs, props.currency, locale.value)
  const date = fmtShort(entry.created_at)
  return `${date} — ${formatted}`
}

function fmtShort(iso: string): string {
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

function close() {
  if (!submitting.value) emit('close')
}

async function submit() {
  if (!canSubmit.value || submitting.value) return

  submitting.value = true
  try {
    await recordRefund(props.bookingId, {
      amount: majorToMinor(amount.value!, props.currency),
      reverses_entry_id: selectedPaymentId.value,
      description: description.value.trim() || undefined,
    })
    showSuccess(t('billing.refund_success'))
    emit('success')
  } catch {
    /* Global interceptor shows error toast */
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.billing-dialog__title {
  font-size: var(--text-heading-size);
  font-weight: var(--text-heading-weight);
  color: var(--ink-primary);
  margin: 0 0 var(--space-md);
}

.billing-dialog__amount-wrap {
  position: relative;
}

.billing-dialog__amount-input {
  padding-right: var(--space-xl);
}

.billing-dialog__amount-input::-webkit-inner-spin-button,
.billing-dialog__amount-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.billing-dialog__amount-input {
  -moz-appearance: textfield;
}

.billing-dialog__currency {
  position: absolute;
  right: var(--space-md);
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-tertiary);
  font-size: var(--text-label-size);
  pointer-events: none;
}
</style>
