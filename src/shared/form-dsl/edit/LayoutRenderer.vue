<template>
  <template v-if="!nodeState.hidden">
    <GuestSectionWrapper
      v-if="isGuestGroup"
      :node="node as FormGroupNode"
      :data="data"
      :errors-map="errorsMap"
      :disabled="effectiveDisabled"
      @update:data="updateData"
    />
    <component v-else :is="wrapperTag" :class="wrapperClass">
      <h2 v-if="isGroup && groupTitle">{{ groupTitle }}</h2>
      <div v-if="isGroup" class="form-view-layout__fields">
        <component
          v-for="(child, idx) in children"
          :key="idx"
          :is="getRenderer(child)"
          :node="child"
          :data="data"
          :full-data="data"
          :errors-map="errorsMap"
          :disabled="effectiveDisabled"
          @update:data="updateData"
        />
      </div>
      <template v-else>
        <component
          v-for="(child, idx) in children"
          :key="idx"
          :is="getRenderer(child)"
          :node="child"
          :data="data"
          :full-data="data"
          :errors-map="errorsMap"
          :disabled="effectiveDisabled"
          @update:data="updateData"
        />
      </template>
    </component>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FormNode, FormGroupNode } from '@/shared/types/forms'
import { INPUT_NODE_TYPES } from '@/shared/types/forms'
import LayoutRenderer from './LayoutRenderer.vue'
import ControlRenderer from './ControlRenderer.vue'
import GuestSectionWrapper from './GuestSectionWrapper.vue'
import { resolveGroupTitle } from '../utils'
import { evaluateNodeState } from '../formNodeConditions'

const props = defineProps({
  node: { type: Object as () => FormNode, required: true },
  data: { type: Object as () => Record<string, unknown>, default: () => ({}) },
  errorsMap: { type: Object as () => Record<string, string[]>, default: () => ({}) },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:data'])

const nodeState = computed(() => evaluateNodeState(props.node, props.data))
const effectiveDisabled = computed(() => props.disabled || nodeState.value.disabled)

const isStack = computed(() => props.node.type === 'stack')
const isGroup = computed(() => props.node.type === 'group')
const isVertical = computed(
  () => isStack.value && (props.node as { direction?: string }).direction === 'vertical',
)
const isHorizontal = computed(
  () => isStack.value && (props.node as { direction?: string }).direction === 'horizontal',
)

const isGuestGroup = computed(() => {
  if (!isGroup.value) return false
  return (props.node as { id?: string }).id === 'guest'
})

const wrapperTag = computed(() => (isGroup.value ? 'section' : 'div'))

const wrapperClass = computed(() => {
  if (isGroup.value) return 'form-view-layout form-view-layout--group'
  if (isVertical.value) return 'form-view-layout form-view-layout--vertical'
  if (isHorizontal.value) return 'form-view-layout form-view-layout--horizontal'
  return 'form-view-layout'
})

const groupTitle = computed(() =>
  isGroup.value ? resolveGroupTitle(props.node as { title?: string; id?: string }) : '',
)

const children = computed(() => (props.node as { children?: FormNode[] }).children ?? [])

function getRenderer(child: FormNode) {
  if (child.type === 'stack' || child.type === 'group') return LayoutRenderer
  return ControlRenderer
}

function updateData(val: Record<string, unknown>) {
  emit('update:data', val)
}
</script>
