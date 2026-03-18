<template>
  <LayoutRenderer
    v-if="rootUischema"
    :schema="schema"
    :uischema="rootUischema"
    :model-value="data"
  />
</template>

<script setup>
import { computed } from 'vue'
import LayoutRenderer from './view/LayoutRenderer.vue'

const props = defineProps({
  /** JSON Schema for the form */
  schema: { type: Object, default: () => ({}) },
  /** UI schema (root Group/Layout or array with one root) */
  uischema: { type: [Object, Array], default: () => ({}) },
  /** Form data (camelCase) to display */
  data: { type: Object, default: () => ({}) },
})

const rootUischema = computed(() => {
  const ui = props.uischema
  if (!ui) return null
  if (Array.isArray(ui) && ui.length > 0) return ui[0]
  return ui
})
</script>
