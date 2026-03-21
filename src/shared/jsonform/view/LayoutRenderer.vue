<template>
  <component :is="wrapperTag" :class="wrapperClass">
    <h2 v-if="isGroup && groupTitle">{{ groupTitle }}</h2>
    <div v-if="isGroup" class="form-view-layout__fields">
      <component
        v-for="(element, idx) in elements"
        :key="idx"
        :is="getRenderer(element)"
        :schema="schema"
        :uischema="element"
        :model-value="modelValue"
      />
    </div>
    <template v-else>
      <component
        v-for="(element, idx) in elements"
        :key="idx"
        :is="getRenderer(element)"
        :schema="schema"
        :uischema="element"
        :model-value="modelValue"
      />
    </template>
  </component>
</template>

<script setup>
import { computed } from 'vue'
import LayoutRenderer from './LayoutRenderer.vue'
import ControlRenderer from './ControlRenderer.vue'
import { resolveGroupTitle } from '../utils'

const props = defineProps({
  schema: { type: Object, default: () => ({}) },
  uischema: { type: Object, required: true },
  modelValue: { type: Object, default: () => ({}) },
})

const layoutType = computed(() => props.uischema?.type)
const isGroup = computed(() => layoutType.value === 'Group')
const isVertical = computed(() => layoutType.value === 'VerticalLayout')
const isHorizontal = computed(() => layoutType.value === 'HorizontalLayout')

const wrapperTag = computed(() => (isGroup.value ? 'section' : 'div'))

const wrapperClass = computed(() => {
  if (isGroup.value) return 'form-view-layout form-view-layout--group'
  if (isVertical.value) return 'form-view-layout form-view-layout--vertical'
  if (isHorizontal.value) return 'form-view-layout form-view-layout--horizontal'
  return 'form-view-layout'
})

const groupTitle = computed(() => resolveGroupTitle(props.uischema))

const elements = computed(() => props.uischema?.elements ?? [])

function getRenderer(elem) {
  return elem?.type === 'Control' ? ControlRenderer : LayoutRenderer
}
</script>
