<template>
  <div
    v-if="schemaEntry?.type === 'array'"
    class="form-view-control--full-width"
  >
    <ArrayRenderer
      :schema="schema"
      :uischema="uischema"
      :model-value="modelValue"
    />
  </div>

  <template v-else>
    <span class="form-view-control__label">{{ label }}:</span>
    <span class="form-view-control__value">{{ displayValue }}</span>
  </template>
</template>

<script setup>
import { computed } from 'vue'
import ArrayRenderer from './ArrayRenderer.vue'
import { scopeToPath, getValueByPath, getSchemaEntry, formatDateTime } from '../utils'

const props = defineProps({
  schema: { type: Object, default: () => ({}) },
  uischema: { type: Object, required: true },
  modelValue: { type: Object, default: () => ({}) },
})

const ctrl = props.uischema
const path = computed(() => scopeToPath(ctrl.scope))
const schemaEntry = computed(() => getSchemaEntry(props.schema, path.value))
const label = computed(() => ctrl.label || schemaEntry.value?.title || path.value?.join('.') || '')

const rawValue = computed(() => getValueByPath(props.modelValue, path.value))

const displayValue = computed(() => {
  const val = rawValue.value
  const entry = schemaEntry.value
  if (entry?.oneOf && Array.isArray(entry.oneOf)) {
    const match = entry.oneOf.find((opt) => opt.const === val)
    return match?.title ?? String(val ?? '')
  }
  if (entry?.enum && Array.isArray(entry.enum)) {
    return String(val ?? '')
  }
  if (val != null && typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/)) {
    const format = entry?.format === 'date-time' ? 'date-time' : 'date'
    return formatDateTime(val, 'ru-RU', { type: format })
  }
  return String(val ?? '')
})
</script>
