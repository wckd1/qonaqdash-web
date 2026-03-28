<template>
  <Teleport to="body">
    <div class="dialog-backdrop" role="presentation" @click.self="close">
      <div class="dialog billing-dialog" role="dialog" :aria-labelledby="titleId" aria-modal="true">
        <h2 :id="titleId" class="billing-dialog__title">{{ t('billing.add_adjustment') }}</h2>

        <form @submit.prevent="submit">
          <label>
            {{ t('billing.adjustment_direction') }}
            <select v-model="direction">
              <option value="charge">{{ t('billing.direction_charge') }}</option>
              <option value="credit">{{ t('billing.direction_credit') }}</option>
            </select>
          </label>

          <label>
            {{ t('billing.amount_label') }}
            <abbr class="required" :title="t('common.required')">*</abbr>
            <div class="billing-dialog__amount-wrap">
              <input
                ref="amountRef"
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
            <abbr class="required" :title="t('common.required')">*</abbr>
            <input
              v-model="description"
              type="text"
              required
              :placeholder="t('billing.adjustment_desc_placeholder')"
            />
          </label>

          <div class="dialog-actions">
            <button type="button" class="btn-secondary" :disabled="submitting" @click="close">
              {{ t('common.cancel') }}
            </button>
            <button type="submit" :disabled="submitting || !canSubmit">
              {{ submitting ? t('common.saving') : t('billing.add_adjustment') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, useId, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { addAdjustment } from '@/features/billing/api'
import { majorToMinor, getCurrencyExponent, getCurrencySymbol } from '@/shared/lib/money'
import { useNotification } from '@/shared/composables/useNotification'

const props = defineProps<{
  bookingId: string
  currency: string
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const { t } = useI18n()
const { success: showSuccess } = useNotification()
const titleId = useId()

const direction = ref<'charge' | 'credit'>('charge')
const amount = ref<number | undefined>(undefined)
const description = ref('')
const submitting = ref(false)
const amountRef = ref<HTMLInputElement | null>(null)

const step = computed(() => 1 / 10 ** getCurrencyExponent(props.currency))

const amountPlaceholder = computed(() => {
  const exp = getCurrencyExponent(props.currency)
  return (0).toFixed(exp)
})

const currencyHint = computed(() => getCurrencySymbol(props.currency))

const canSubmit = computed(
  () => typeof amount.value === 'number' && amount.value > 0 && description.value.trim().length > 0,
)

onMounted(() => {
  nextTick(() => amountRef.value?.focus())
})

function close() {
  if (!submitting.value) emit('close')
}

async function submit() {
  if (!canSubmit.value || submitting.value) return

  const minorAmount = majorToMinor(amount.value!, props.currency)
  const signedAmount = direction.value === 'credit' ? -minorAmount : minorAmount

  submitting.value = true
  try {
    await addAdjustment(props.bookingId, {
      amount: signedAmount,
      description: description.value.trim(),
    })
    showSuccess(t('billing.adjustment_success'))
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
