<template>
  <div v-if="definition" :class="rootClass">
    <LayoutRenderer :node="definition" :data="data" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FormNode } from '@/shared/types/forms'
import LayoutRenderer from './view/LayoutRenderer.vue'

const props = defineProps({
  definition: { type: Object as () => FormNode | null, default: null },
  data: { type: Object as () => Record<string, unknown>, default: () => ({}) },
  compact: { type: Boolean, default: false },
})

const rootClass = computed(() =>
  props.compact ? 'form-dsl-view-root form-dsl-view-root--compact' : 'form-content__viewport',
)
</script>
