<template>
  <header class="page-header">
    <h1>{{ t('pricing.title') }}</h1>
  </header>

  <PricingSubNav />

  <div class="form-content__viewport pricing-view">
    <p v-if="loadError" class="error-message">{{ loadError }}</p>
    <div v-else-if="loading" class="loading-state">{{ t('common.loading') }}</div>
    <template v-else>
      <section class="panel pricing-view__section">
        <div class="pricing-view__section-header">
          <div>
            <h2 class="pricing-view__heading">{{ t('pricing.rules_title') }}</h2>
            <p class="pricing-view__hint">{{ t('pricing.rules_hint') }}</p>
          </div>
          <button
            v-if="canManagePricing"
            type="button"
            class="btn-add-outline"
            @click="openAddDialog"
          >
            <svg
              class="btn-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {{ t('common.add') }}
          </button>
        </div>

        <p v-if="!rules.length" class="pricing-view__empty">
          {{ t('pricing.rules_empty') }}
        </p>

        <table v-else class="list-table">
          <thead>
            <tr>
              <th scope="col">{{ t('pricing.col_name') }}</th>
              <th scope="col">{{ t('pricing.col_rule') }}</th>
              <th scope="col">{{ t('pricing.col_status') }}</th>
              <th scope="col" class="list-table__col--actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rule in rules" :key="rule.id">
              <td>
                <strong>{{ rule.name }}</strong>
                <p v-if="rule.invalid_reason" class="pricing-rule__invalid-reason">
                  {{ rule.invalid_reason.message }}
                </p>
              </td>
              <td>
                <span class="pricing-rule__summary">
                  <span>{{ conditionsSummary(rule) }}</span>
                  <span class="pricing-rule__arrow">&rarr;</span>
                  <span class="pricing-rule__effect">{{ effectSummary(rule) }}</span>
                </span>
              </td>
              <td>
                <span class="pricing-rule__status" :class="statusClass(rule.status)">
                  {{ statusLabel(rule.status) }}
                </span>
              </td>
              <td class="list-table__cell--actions">
                <div class="list-table__actions">
                  <button
                    v-if="canManagePricing"
                    type="button"
                    class="list-table__action"
                    @click="openEditDialog(rule)"
                  >
                    {{ t('common.edit') }}
                  </button>
                  <button
                    v-if="canManagePricing"
                    type="button"
                    class="list-table__action list-table__action--danger"
                    @click="openDeleteConfirm(rule)"
                  >
                    {{ t('pricing.remove') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>

  <Teleport to="body">
    <div v-if="dialogOpen" class="dialog-backdrop" role="presentation" @click.self="closeDialog">
      <div
        class="dialog dialog--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rule-dialog-title"
      >
        <h2 id="rule-dialog-title">
          {{ editingId ? t('pricing.edit_rule') : t('pricing.add_rule') }}
        </h2>
        <p v-if="dialogError" class="form-error">{{ dialogError }}</p>
        <form class="rule-form" @submit.prevent="submitDialog">
          <div class="rule-form__top">
            <label class="rule-form__field rule-form__field--grow">
              {{ t('pricing.rule_name') }}
              <abbr class="required" :title="t('common.required')">*</abbr>
              <input
                ref="nameInputRef"
                v-model="ruleForm.name"
                type="text"
                :placeholder="t('pricing.rule_name_placeholder')"
                required
                :disabled="saving"
              />
            </label>
            <label class="rule-form__field rule-form__field--status">
              {{ t('pricing.rule_status') }}
              <select v-model="ruleForm.status" :disabled="saving">
                <option value="active">{{ t('pricing.rule_status_active') }}</option>
                <option value="disabled">{{ t('pricing.rule_status_disabled') }}</option>
              </select>
            </label>
          </div>

          <div class="rule-form__columns">
            <fieldset class="rule-form__fieldset rule-form__fieldset--conditions">
              <legend>{{ t('pricing.rule_conditions') }}</legend>
              <p v-if="!ruleForm.conditions.length" class="rule-form__empty">
                {{ t('pricing.rule_no_conditions') }}
              </p>
              <div v-for="(cond, idx) in ruleForm.conditions" :key="idx" class="condition-row">
                <select
                  v-model="cond.type"
                  class="condition-row__type"
                  :disabled="saving"
                  @change="onConditionTypeChange(idx)"
                >
                  <option value="property">{{ t('pricing.rule_condition_property') }}</option>
                  <option value="specific_date">
                    {{ t('pricing.rule_condition_specific_date') }}
                  </option>
                  <option value="date_range">{{ t('pricing.rule_condition_date_range') }}</option>
                </select>

                <template v-if="cond.type === 'property'">
                  <select
                    v-model="cond.field_id"
                    :disabled="saving"
                    class="condition-row__field"
                    @change="onFieldChange(idx)"
                  >
                    <option value="" disabled>{{ t('pricing.rule_condition_field') }}</option>
                    <option v-for="c in conditionCandidates" :key="c.field_id" :value="c.field_id">
                      {{ t(c.label) }}
                    </option>
                  </select>
                  <select v-model="cond.operator" :disabled="saving" class="condition-row__field">
                    <option value="eq">{{ t('pricing.rule_condition_operator_eq') }}</option>
                    <option value="not_eq">
                      {{ t('pricing.rule_condition_operator_not_eq') }}
                    </option>
                  </select>
                  <select
                    v-model="cond.value"
                    :disabled="saving || !cond.field_id"
                    class="condition-row__field"
                  >
                    <option value="" disabled>{{ t('pricing.rule_condition_value') }}</option>
                    <option
                      v-for="opt in candidateByFieldId(cond.field_id)?.options ?? []"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ t(opt.label) }}
                    </option>
                  </select>
                </template>

                <template v-else-if="cond.type === 'specific_date'">
                  <input
                    v-model="cond.date"
                    type="date"
                    :disabled="saving"
                    class="condition-row__field"
                  />
                </template>

                <template v-else-if="cond.type === 'date_range'">
                  <input
                    v-model="cond.from"
                    type="date"
                    :disabled="saving"
                    class="condition-row__field"
                  />
                  <input
                    v-model="cond.to"
                    type="date"
                    :disabled="saving"
                    class="condition-row__field"
                  />
                </template>

                <button
                  type="button"
                  class="condition-row__remove"
                  :aria-label="t('pricing.rule_remove_condition')"
                  :disabled="saving"
                  @click="removeCondition(idx)"
                >
                  &times;
                </button>
              </div>
              <button type="button" class="btn-secondary" :disabled="saving" @click="addCondition">
                {{ t('pricing.rule_add_condition') }}
              </button>
            </fieldset>

            <fieldset class="rule-form__fieldset rule-form__fieldset--effect">
              <legend>{{ t('pricing.rule_effect') }}</legend>
              <label class="rule-form__field">
                {{ t('pricing.rule_effect_type') }}
                <select v-model="ruleForm.effect.type" :disabled="saving">
                  <option value="percent">{{ t('pricing.rule_effect_percent') }}</option>
                  <option value="fixed">{{ t('pricing.rule_effect_fixed') }}</option>
                </select>
              </label>
              <label class="rule-form__field">
                {{ t('pricing.rule_effect_value') }}
                <abbr class="required" :title="t('common.required')">*</abbr>
                <div class="rule-form__amount-wrap">
                  <input
                    v-model.number="ruleForm.effect.displayValue"
                    type="number"
                    step="any"
                    required
                    :disabled="saving"
                    class="rule-form__amount-input"
                    @beforeinput="onEffectBeforeInput"
                  />
                  <span class="rule-form__amount-symbol">{{ effectSymbol }}</span>
                </div>
                <small class="rule-form__hint">
                  {{
                    ruleForm.effect.type === 'percent'
                      ? t('pricing.rule_effect_value_percent_hint')
                      : t('pricing.rule_effect_value_fixed_hint')
                  }}
                </small>
              </label>
              <label class="rule-form__field">
                {{ t('pricing.rule_effect_apply_to') }}
                <select v-model="ruleForm.effect.apply_to" :disabled="saving">
                  <option value="per_night">{{ t('pricing.rule_effect_per_night') }}</option>
                  <option value="total">{{ t('pricing.rule_effect_total') }}</option>
                </select>
              </label>
            </fieldset>
          </div>

          <div class="dialog-actions">
            <button type="button" class="btn-secondary" :disabled="saving" @click="closeDialog">
              {{ t('common.cancel') }}
            </button>
            <button type="submit" :aria-busy="saving" :disabled="saving">
              {{ saving ? t('common.saving') : t('common.save') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>

  <Teleport to="body">
    <div
      v-if="deleteConfirmOpen"
      class="dialog-backdrop"
      role="presentation"
      @click.self="closeDeleteConfirm"
    >
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="rule-delete-title">
        <h2 id="rule-delete-title">{{ t('pricing.confirm_delete_rule_title') }}</h2>
        <p v-if="deleteError" class="form-error">{{ deleteError }}</p>
        <p class="pricing-view__confirm-body">
          {{ t('pricing.confirm_delete_rule_body', { name: deleteTarget?.name ?? '' }) }}
        </p>
        <div class="dialog-actions">
          <button
            type="button"
            class="btn-secondary"
            :disabled="deleting"
            @click="closeDeleteConfirm"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="btn-secondary btn-secondary--danger"
            :disabled="deleting"
            @click="confirmDelete"
          >
            {{ deleting ? t('common.loading') : t('pricing.remove') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import PricingSubNav from '@/features/pricing/components/PricingSubNav.vue'
import { usePricingStore } from '@/features/pricing/stores/usePricingStore'
import { usePropertyStore } from '@/features/property/stores/usePropertyStore'
import type { PricingRule, PricingCondition, ConditionCandidate } from '@/shared/types/commercial'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import { formatMoney, majorToMinor, minorToMajor, getCurrencySymbol } from '@/shared/lib/money'
import { guardNumberBeforeInput } from '@/shared/form-dsl/inputGuard'
import { usePermissions } from '@/shared/composables/usePermissions'

const { t, locale } = useI18n()
const pricingStore = usePricingStore()
const propertyStore = usePropertyStore()
const { canManagePricing } = usePermissions()
const { rules, conditionCandidates } = storeToRefs(pricingStore)

const hotelCurrency = computed(() => propertyStore.hotel?.currency ?? 'USD')

const effectSymbol = computed(() =>
  ruleForm.value.effect.type === 'percent' ? '%' : getCurrencySymbol(hotelCurrency.value),
)

function onEffectBeforeInput(e: Event) {
  guardNumberBeforeInput(e as InputEvent)
}

function candidateByFieldId(fieldId: string): ConditionCandidate | undefined {
  return conditionCandidates.value.find((c) => c.field_id === fieldId)
}

const loading = ref(true)
const loadError = ref('')

const dialogOpen = ref(false)
const editingId = ref('')
const saving = ref(false)
const dialogError = ref('')
const nameInputRef = ref<HTMLInputElement | null>(null)

interface ConditionFormState {
  type: PricingCondition['type']
  field_id: string
  operator: 'eq' | 'not_eq'
  value: string
  date: string
  from: string
  to: string
}

interface RuleFormState {
  name: string
  status: 'active' | 'disabled'
  conditions: ConditionFormState[]
  effect: {
    type: 'percent' | 'fixed'
    displayValue: number
    apply_to: 'per_night' | 'total'
  }
}

function emptyRuleForm(): RuleFormState {
  return {
    name: '',
    status: 'active',
    conditions: [],
    effect: { type: 'percent', displayValue: 0, apply_to: 'per_night' },
  }
}

const ruleForm = ref<RuleFormState>(emptyRuleForm())

const deleteConfirmOpen = ref(false)
const deleteTarget = ref<PricingRule | null>(null)
const deleting = ref(false)
const deleteError = ref('')

function statusLabel(status: string): string {
  const key = `pricing.rule_status_${status}`
  return t(key)
}

function statusClass(status: string): Record<string, boolean> {
  return {
    'pricing-rule__status--active': status === 'active',
    'pricing-rule__status--disabled': status === 'disabled',
    'pricing-rule__status--invalid': status === 'invalid',
  }
}

function resolveFieldLabel(fieldId: string): string {
  const raw = candidateByFieldId(fieldId)?.label
  return raw ? t(raw) : fieldId
}

function resolveOptionLabel(fieldId: string, value: string): string {
  const candidate = candidateByFieldId(fieldId)
  const raw = candidate?.options.find((o) => o.value === value)?.label
  return raw ? t(raw) : value
}

function conditionsSummary(rule: PricingRule): string {
  if (!rule.conditions?.length) return t('pricing.rule_no_conditions')
  return rule.conditions
    .map((c) => {
      switch (c.type) {
        case 'property': {
          const label = resolveFieldLabel(c.field_id)
          const valLabel = resolveOptionLabel(c.field_id, c.value ?? '')
          if (c.operator === 'not_eq') return `${label} ≠ ${valLabel}`
          return `${label} = ${valLabel}`
        }
        case 'specific_date':
          return c.date
        case 'date_range':
          return `${c.from} — ${c.to}`
        default:
          return '?'
      }
    })
    .join(' & ')
}

function effectSummary(rule: PricingRule): string {
  const e = rule.effect
  if (!e) return ''
  if (e.type === 'percent') {
    const pct = (e.value / 100).toFixed(2)
    const sign = e.value >= 0 ? '+' : ''
    const scope =
      e.apply_to === 'per_night'
        ? t('pricing.rule_effect_per_night')
        : t('pricing.rule_effect_total')
    return `${sign}${pct}% ${scope}`
  }
  const money = formatMoney(Math.abs(e.value), hotelCurrency.value, locale.value)
  const sign = e.value >= 0 ? '+' : '−'
  const scope =
    e.apply_to === 'per_night' ? t('pricing.rule_effect_per_night') : t('pricing.rule_effect_total')
  return `${sign}${money} ${scope}`
}

async function load() {
  loadError.value = ''
  loading.value = true
  try {
    await Promise.all([
      pricingStore.fetchRules(true),
      pricingStore.fetchConditionCandidates(),
      propertyStore.fetchHotel(),
    ])
  } catch (err: unknown) {
    loadError.value = formatUnknownApiError(err) || t('pricing.load_failed')
  } finally {
    loading.value = false
  }
}

function conditionToFormState(c: PricingCondition): ConditionFormState {
  const base: ConditionFormState = {
    type: c.type,
    field_id: '',
    operator: 'eq',
    value: '',
    date: '',
    from: '',
    to: '',
  }
  switch (c.type) {
    case 'property':
      base.field_id = c.field_id
      base.operator = c.operator
      base.value = c.value ?? ''
      break
    case 'specific_date':
      base.date = c.date
      break
    case 'date_range':
      base.from = c.from
      base.to = c.to
      break
  }
  return base
}

function formStateToCondition(c: ConditionFormState): PricingCondition {
  switch (c.type) {
    case 'property':
      return { type: 'property', field_id: c.field_id, operator: c.operator, value: c.value }
    case 'specific_date':
      return { type: 'specific_date', date: c.date }
    case 'date_range':
      return { type: 'date_range', from: c.from, to: c.to }
  }
}

function openAddDialog() {
  editingId.value = ''
  ruleForm.value = emptyRuleForm()
  dialogError.value = ''
  dialogOpen.value = true
  nextTick(() => nameInputRef.value?.focus())
}

function openEditDialog(rule: PricingRule) {
  editingId.value = rule.id
  const effectDisplayValue =
    rule.effect.type === 'percent'
      ? rule.effect.value / 100
      : minorToMajor(rule.effect.value, hotelCurrency.value)

  ruleForm.value = {
    name: rule.name,
    status: rule.status === 'disabled' ? 'disabled' : 'active',
    conditions: rule.conditions.map(conditionToFormState),
    effect: {
      type: rule.effect.type,
      displayValue: effectDisplayValue,
      apply_to: rule.effect.apply_to,
    },
  }
  dialogError.value = ''
  dialogOpen.value = true
  nextTick(() => nameInputRef.value?.focus())
}

function closeDialog() {
  dialogOpen.value = false
  editingId.value = ''
  dialogError.value = ''
}

function addCondition() {
  ruleForm.value.conditions.push({
    type: 'property',
    field_id: '',
    operator: 'eq',
    value: '',
    date: '',
    from: '',
    to: '',
  })
}

function removeCondition(idx: number) {
  ruleForm.value.conditions.splice(idx, 1)
}

function onFieldChange(idx: number) {
  const c = ruleForm.value.conditions[idx]
  c.value = ''
}

function onConditionTypeChange(idx: number) {
  const c = ruleForm.value.conditions[idx]
  c.field_id = ''
  c.operator = 'eq'
  c.value = ''
  c.date = ''
  c.from = ''
  c.to = ''
}

async function submitDialog() {
  const f = ruleForm.value
  if (!f.name.trim()) return

  saving.value = true
  dialogError.value = ''

  const effectValue =
    f.effect.type === 'percent'
      ? Math.round(f.effect.displayValue * 100)
      : majorToMinor(f.effect.displayValue, hotelCurrency.value)

  const existingRule = editingId.value
    ? rules.value.find((r) => r.id === editingId.value)
    : undefined
  const priority = existingRule
    ? existingRule.priority
    : rules.value.reduce((max, r) => Math.max(max, r.priority), 0) + 10

  const body = {
    name: f.name.trim(),
    priority,
    status: f.status,
    conditions: f.conditions.map(formStateToCondition),
    effect: {
      type: f.effect.type,
      value: effectValue,
      apply_to: f.effect.apply_to,
    },
  }

  try {
    if (editingId.value) {
      await pricingStore.updateRule(editingId.value, body)
    } else {
      await pricingStore.createRule(body)
    }
    closeDialog()
  } catch (err: unknown) {
    dialogError.value = formatUnknownApiError(err) || t('pricing.save_failed')
  } finally {
    saving.value = false
  }
}

function openDeleteConfirm(rule: PricingRule) {
  deleteTarget.value = rule
  deleteError.value = ''
  deleteConfirmOpen.value = true
}

function closeDeleteConfirm() {
  deleteConfirmOpen.value = false
  deleteTarget.value = null
  deleteError.value = ''
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await pricingStore.deleteRule(deleteTarget.value.id)
    closeDeleteConfirm()
  } catch (err: unknown) {
    deleteError.value = formatUnknownApiError(err) || t('pricing.save_failed')
  } finally {
    deleting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.pricing-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.pricing-view__section {
  margin: 0;
}

.pricing-view__section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.pricing-view__heading {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  margin: 0 0 var(--space-xs);
}

.pricing-view__hint {
  margin: 0;
  font-size: var(--text-caption-size);
  font-weight: var(--text-caption-weight);
  line-height: 1.45;
  color: var(--ink-muted);
}

.pricing-view__empty {
  margin: 0;
  padding: var(--space-md);
  text-align: center;
  color: var(--ink-muted);
  font-size: var(--text-body-size);
}

.pricing-view__confirm-body {
  margin: 0 0 var(--space-md);
  font-size: var(--text-body-size);
  color: var(--ink-secondary);
}

.pricing-rule__summary {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-xs);
  font-size: var(--text-caption-size);
  color: var(--ink-secondary);
}

.pricing-rule__arrow {
  color: var(--ink-muted);
}

.pricing-rule__effect {
  font-weight: var(--text-label-weight);
  color: var(--ink-primary);
}

.pricing-rule__status {
  font-size: var(--text-caption-size);
  font-weight: var(--text-label-weight);
  padding: 1px 6px;
  border-radius: 3px;
  white-space: nowrap;
}

.pricing-rule__status--active {
  background-color: var(--semantic-success-bg, #ecfdf5);
  color: var(--semantic-success);
}

.pricing-rule__status--disabled {
  background-color: var(--control-bg);
  color: var(--ink-muted);
}

.pricing-rule__status--invalid {
  background-color: var(--semantic-error-bg, #fef2f2);
  color: var(--semantic-error);
}

.pricing-rule__invalid-reason {
  margin: var(--space-xs) 0 0;
  font-size: var(--text-caption-size);
  color: var(--semantic-error);
}

.list-table__action--danger {
  color: var(--semantic-error);
}

.list-table__action--danger:hover {
  color: var(--semantic-error);
}

/* Dialog wide */
.dialog--wide {
  max-width: 860px;
}

/* Rule form */
.rule-form__top {
  display: flex;
  gap: var(--space-sm);
}

.rule-form__field--grow {
  flex: 1;
}

.rule-form__field--status {
  flex: 0 0 240px;
}

.rule-form__columns {
  display: flex;
  gap: var(--space-md);
  align-items: flex-start;
}

.rule-form__fieldset--conditions {
  flex: 1;
  min-width: 0;
}

.rule-form__fieldset--effect {
  flex: 0 0 240px;
}

.rule-form__field {
  min-width: 0;
}

.rule-form__amount-wrap {
  position: relative;
}

.rule-form__amount-input {
  padding-right: var(--space-xl);
  -moz-appearance: textfield;
  appearance: textfield;
}

.rule-form__amount-input::-webkit-outer-spin-button,
.rule-form__amount-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.rule-form__amount-symbol {
  position: absolute;
  right: var(--space-md);
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-tertiary);
  font-size: var(--text-label-size);
  pointer-events: none;
}

.rule-form__hint {
  display: block;
  margin-top: var(--space-xs);
  margin-bottom: var(--space-sm);
  font-size: var(--text-caption-size);
  color: var(--ink-muted);
}

.rule-form__fieldset {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm, 6px);
  padding: var(--space-sm) var(--space-md);
  margin: 0 0 var(--space-md);
}

.rule-form__fieldset legend {
  font-size: var(--text-label-size);
  font-weight: var(--text-label-weight);
  padding: 0 var(--space-xs);
}

.rule-form__empty {
  margin: 0 0 var(--space-sm);
  font-size: var(--text-caption-size);
  color: var(--ink-muted);
}

/* Condition row */
.condition-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--space-xs);
  padding: var(--space-xs) 0;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: var(--space-xs);
}

.condition-row:last-of-type {
  border-bottom: none;
  margin-bottom: var(--space-sm);
}

.condition-row__type {
  flex: 0 0 auto;
  min-width: 160px;
  margin-bottom: 0;
}

.condition-row__field {
  flex: 1;
  min-width: 120px;
  margin-bottom: 0;
}

.condition-row__remove {
  all: unset;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  color: var(--ink-muted);
  padding: var(--space-xs);
  flex-shrink: 0;
  align-self: center;
}

.condition-row__remove:hover {
  color: var(--semantic-error);
}
</style>
