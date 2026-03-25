<template>
  <div v-if="definition" class="form-content__viewport">
    <LayoutRenderer
      :node="definition"
      :data="data"
      :errors-map="errorsMap"
      :disabled="disabled"
      @update:data="onDataUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import type { FormNode } from '@/shared/types/forms'
import LayoutRenderer from './edit/LayoutRenderer.vue'

defineProps({
  definition: { type: Object as () => FormNode | null, default: null },
  data: { type: Object as () => Record<string, unknown>, default: () => ({}) },
  errorsMap: { type: Object as () => Record<string, string[]>, default: () => ({}) },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:data'])

function onDataUpdate(val: Record<string, unknown>) {
  emit('update:data', val)
}
</script>
