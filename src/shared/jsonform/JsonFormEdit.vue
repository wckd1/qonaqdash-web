<template>
  <div v-if="rootUischema" class="form-content__viewport">
    <LayoutRenderer
      :schema="schema"
      :uischema="rootUischema"
      :model-value="data"
      :errors-map="errorsMap"
      :disabled="disabled"
      @update:model-value="onModelUpdate"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import LayoutRenderer from './edit/LayoutRenderer.vue'

const props = defineProps({
  /** JSON Schema for the form */
  schema: { type: Object, default: () => ({}) },
  /** UI schema (root Group/Layout or array with one root) */
  uischema: { type: [Object, Array], default: () => ({}) },
  /** Form data (camelCase) to edit */
  data: { type: Object, default: () => ({}) },
  /** Map of scope string -> array of error messages */
  errorsMap: { type: Object, default: () => ({}) },
  /** Disable all inputs */
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:data'])

const rootUischema = computed(() => {
  const ui = props.uischema
  if (!ui) return null
  if (Array.isArray(ui) && ui.length > 0) return ui[0]
  return ui
})

function onModelUpdate(val) {
  emit('update:data', val)
}
</script>
