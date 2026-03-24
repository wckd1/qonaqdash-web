<template>
  <div v-if="rootUischema" :class="rootClass">
    <LayoutRenderer
      :schema="schema"
      :uischema="rootUischema"
      :model-value="data"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LayoutRenderer from './view/LayoutRenderer.vue'

const props = defineProps({
  /** JSON Schema for the form */
  schema: { type: Object, default: () => ({}) },
  /** UI schema (root Group/Layout or array with one root) */
  uischema: { type: [Object, Array], default: () => ({}) },
  /** Form data (camelCase) to display */
  data: { type: Object, default: () => ({}) },
  /**
   * Side panels / narrow hosts: use alternate root (no main flex hook) and stack HorizontalLayouts vertically via CSS.
   */
  compact: { type: Boolean, default: false },
})

const rootClass = computed(() =>
  props.compact ? 'jsonform-view-root jsonform-view-root--compact' : 'form-content__viewport',
)

const rootUischema = computed(() => {
  const ui = props.uischema
  if (!ui) return null
  if (Array.isArray(ui) && ui.length > 0) return ui[0]
  return ui
})
</script>
