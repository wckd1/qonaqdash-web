<template>
  <div class="form-view-array">
    <label v-if="label" class="form-view-array__label">{{ label }}</label>
    <div v-if="items.length > 0" class="form-view-array__list">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="form-view-array__item"
      >
        <ControlRenderer
          v-for="(fieldSchema, key) in itemSchemaProperties"
          :key="key"
          :schema="itemSchema"
          :uischema="{
            type: 'Control',
            scope: '#/properties/' + key,
            label: String(fieldSchema?.title || key),
          }"
          :model-value="item"
        />
      </div>
    </div>
    <p v-else class="form-view-array__empty">—</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ControlRenderer from './ControlRenderer.vue'
import { scopeToPath, getValueByPath, getSchemaEntry } from '../utils'

const props = defineProps({
  schema: { type: Object, default: () => ({}) },
  uischema: { type: Object, required: true },
  modelValue: { type: Object, default: () => ({}) },
})

const ctrl = props.uischema
const path = computed(() => scopeToPath(ctrl.scope))
const schemaEntry = computed(() => {
  if (!path.value?.length) return undefined
  return getSchemaEntry(props.schema, path.value)
})

const itemSchema = computed(() => {
  const entry = schemaEntry.value
  if (!entry?.items) return {}
  return Array.isArray(entry.items) ? entry.items[0] ?? {} : entry.items
})

const itemSchemaProperties = computed(() => itemSchema.value?.properties ?? {})

const items = computed(() => {
  const value = getValueByPath(props.modelValue, path.value)
  return Array.isArray(value) ? value : []
})

const label = computed(() => ctrl.label || schemaEntry.value?.title || '')
</script>
