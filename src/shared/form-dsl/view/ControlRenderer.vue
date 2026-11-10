<template>
  <template v-if="!nodeState.hidden">
    <div v-if="node.type === 'array'" class="form-view-control--full-width">
      <ArrayRenderer :node="node" :data="data" />
    </div>

    <template v-else-if="node.type === 'button'" />

    <template v-else>
      <span class="form-view-control__label">{{ label }}:</span>
      <span class="form-view-control__value">
        <MomentTime v-if="momentValue" :value="momentValue" />
        <template v-else>{{ displayValue }}</template>
      </span>
    </template>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FormNode, FormInputNode, FormSelectNode } from '@/shared/form-dsl/types'
import ArrayRenderer from './ArrayRenderer.vue'
import { resolveFormCatalogString } from '@/shared/i18n/formCatalog'
import { bindToPath, getValueByPath, formatDateField, companionLabelFullBind } from '../utils'
import { evaluateNodeState } from '../formNodeConditions'
import { formatPhoneDisplay } from '../phoneMask'
import { useHotelTime } from '@/shared/composables/useHotelTime'
import MomentTime from '@/shared/components/MomentTime.vue'

const props = defineProps({
  node: { type: Object as () => FormNode, required: true },
  data: { type: Object as () => Record<string, unknown>, default: () => ({}) },
  /** Root form data for rule conditions when inside array item. */
  fullData: { type: Object as () => Record<string, unknown>, default: undefined },
  /** Bind prefix when inside array item (e.g. 'booking.rooms.0'). */
  bindPrefix: { type: String, default: '' },
})

const { timeZone } = useHotelTime()

const ruleData = computed(() => props.fullData ?? props.data)
const nodeState = computed(() => evaluateNodeState(props.node, ruleData.value))

const inputNode = computed(() => props.node as FormInputNode | FormSelectNode)

const fullBind = computed(() => {
  const bind = (inputNode.value as { bind?: string }).bind
  if (!bind) return ''
  return props.bindPrefix ? `${props.bindPrefix}.${bind}` : bind
})

const path = computed(() => bindToPath(fullBind.value))

const label = computed(() => resolveFormCatalogString(inputNode.value.label ?? ''))

const rawValue = computed(() => getValueByPath(props.data, path.value))

/** The value of a `datetime` field: a moment on the hotel clock. */
const momentValue = computed(() => {
  const val = rawValue.value
  return props.node.type === 'datetime' && typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)
    ? val
    : ''
})

const displayValue = computed(() => {
  const val = rawValue.value
  const n = props.node

  if (n.type === 'select') {
    const selectNode = n as FormSelectNode
    const match = selectNode.items?.find(
      (opt) => opt.value === val || String(opt.value ?? '') === String(val ?? ''),
    )
    if (match) return resolveFormCatalogString(match.label ?? String(match.value ?? ''))
    const bind = (inputNode.value as { bind?: string }).bind ?? ''
    const labelBind = companionLabelFullBind(fullBind.value, bind)
    if (labelBind) {
      const labelVal = getValueByPath(props.data, bindToPath(labelBind))
      if (typeof labelVal === 'string' && labelVal.trim() !== '') return labelVal
    }
    return String(val ?? '')
  }

  if (n.type === 'date' && typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    return formatDateField(val, timeZone.value)
  }

  if (n.type === 'phone' && val != null && typeof val === 'string' && val.length > 0) {
    return formatPhoneDisplay(val)
  }

  if (typeof val === 'boolean') {
    return val ? '✓' : '—'
  }

  return String(val ?? '')
})
</script>
