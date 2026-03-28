<template>
  <button type="button" class="pricing-card__link-btn" @click="openDialog">
    {{ buttonLabel }}
  </button>

  <Teleport to="body">
    <div
      v-if="dialogOpen"
      class="dialog-backdrop"
      role="presentation"
      @click.self="dialogOpen = false"
    >
      <div class="dialog adjustment-dialog" role="dialog" aria-modal="true">
        <h2 class="adjustment-dialog__title">{{ t('adjustments.add_title') }}</h2>

        <div class="adjustment-dialog__body">
          <label>
            {{ t('adjustments.name_label') }}
            <input
              v-model="draft.name"
              type="text"
              :placeholder="t('adjustments.name_placeholder')"
            />
          </label>

          <div class="adjustment-dialog__effect-grid">
            <label>
              {{ t('pricing.rule_effect_type') }}
              <select v-model="draft.effectType">
                <option value="percent">{{ t('pricing.rule_effect_percent') }}</option>
                <option value="fixed">{{ t('pricing.rule_effect_fixed') }}</option>
              </select>
            </label>

            <label>
              {{ t('pricing.rule_effect_value') }}
              <input v-model.number="draft.displayValue" type="number" step="any" />
            </label>

            <label>
              {{ t('pricing.rule_effect_apply_to') }}
              <select v-model="draft.applyTo">
                <option value="per_night">{{ t('pricing.rule_effect_per_night') }}</option>
                <option value="total">{{ t('pricing.rule_effect_total') }}</option>
              </select>
            </label>
          </div>

          <small class="adjustment-dialog__hint">
            {{
              draft.effectType === 'percent'
                ? t('pricing.rule_effect_value_percent_hint')
                : t('pricing.rule_effect_value_fixed_hint')
            }}
          </small>
        </div>

        <div class="dialog-actions">
          <button type="button" :disabled="!canApply" @click="apply">
            {{ t('adjustments.apply') }}
          </button>
          <button type="button" class="btn-secondary" @click="dialogOpen = false">
            {{ t('common.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ManualAdjustmentInput, EffectType, EffectApplyTo } from '@/shared/types/commercial'
import { majorToMinor } from '@/shared/lib/money'

const props = defineProps<{
  modelValue: ManualAdjustmentInput[]
  currency: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ManualAdjustmentInput[]]
}>()

const { t } = useI18n()
const dialogOpen = ref(false)

const buttonLabel = computed(() => t('adjustments.change_price'))

const draft = reactive({
  name: '',
  effectType: 'percent' as EffectType,
  displayValue: 0 as number,
  applyTo: 'total' as EffectApplyTo,
})

function resetDraft() {
  draft.name = ''
  draft.effectType = 'percent'
  draft.displayValue = 0
  draft.applyTo = 'total'
}

function openDialog() {
  resetDraft()
  dialogOpen.value = true
}

const canApply = computed(() => draft.name.trim().length > 0)

function apply() {
  const rawValue = typeof draft.displayValue === 'number' ? draft.displayValue : 0
  const input: ManualAdjustmentInput = {
    name: draft.name.trim(),
    effect: {
      type: draft.effectType,
      value:
        draft.effectType === 'percent'
          ? Math.round(rawValue * 100)
          : majorToMinor(rawValue, props.currency),
      apply_to: draft.applyTo,
    },
  }
  emit('update:modelValue', [...props.modelValue, input])
  dialogOpen.value = false
}
</script>

<style scoped>
.adjustment-dialog {
  max-width: min(600px, 90vw);
}

.adjustment-dialog__title {
  font-size: var(--text-heading-size);
  font-weight: var(--text-heading-weight);
  color: var(--ink-primary);
  margin: 0 0 var(--space-md);
}

.adjustment-dialog__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.adjustment-dialog__effect-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-sm);
}

.adjustment-dialog__effect-grid select,
.adjustment-dialog__effect-grid input {
  height: 2.625rem;
}

.adjustment-dialog__hint {
  font-size: var(--text-caption-size);
  font-weight: var(--text-caption-weight);
  color: var(--ink-tertiary);
}
</style>
