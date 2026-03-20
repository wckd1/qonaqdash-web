<template>
  <GuestSectionWrapper
    v-if="isGuestGroup"
    :schema="schema"
    :uischema="uischema"
    :model-value="modelValue"
    :errors-map="errorsMap"
    :disabled="disabled"
    @update:model-value="updateModel"
  />
  <component v-else :is="wrapperTag" :class="wrapperClass">
    <h2 v-if="groupLabel">{{ groupLabel }}</h2>
    <div v-if="isGroup" class="form-view-layout__fields">
      <component
        v-for="(element, idx) in elements"
        :key="idx"
        :is="getRenderer(element)"
        :schema="schema"
        :uischema="element"
        :model-value="modelValue"
        :full-data="modelValue"
        :errors-map="errorsMap"
        :disabled="disabled"
        @update:model-value="updateModel"
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
        :full-data="modelValue"
        :errors-map="errorsMap"
        :disabled="disabled"
        @update:model-value="updateModel"
      />
    </template>
  </component>
</template>

<script setup>
import { computed } from 'vue'
import LayoutRenderer from './LayoutRenderer.vue'
import ControlRenderer from './ControlRenderer.vue'
import GuestSectionWrapper from './GuestSectionWrapper.vue'

const props = defineProps({
  schema: { type: Object, default: () => ({}) },
  uischema: { type: Object, required: true },
  modelValue: { type: Object, default: () => ({}) },
  errorsMap: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const layoutType = computed(() => props.uischema?.type)
const isGroup = computed(() => layoutType.value === 'Group')
/** Guest picker + typeahead: match by id or by injected controls under #/properties/guest/ */
const isGuestGroup = computed(() => {
  if (!isGroup.value) return false
  if (props.uischema?.id === 'guest') return true
  const els = props.uischema?.elements ?? []
  return els.some(
    (e) =>
      e?.type === 'Control' &&
      typeof e.scope === 'string' &&
      e.scope.includes('/properties/guest/'),
  )
})
const isVertical = computed(() => layoutType.value === 'VerticalLayout')
const isHorizontal = computed(() => layoutType.value === 'HorizontalLayout')

const wrapperTag = computed(() => (isGroup.value ? 'section' : 'div'))

const wrapperClass = computed(() => {
  if (isGroup.value) return 'form-view-layout form-view-layout--group'
  if (isVertical.value) return 'form-view-layout form-view-layout--vertical'
  if (isHorizontal.value) return 'form-view-layout form-view-layout--horizontal'
  return 'form-view-layout'
})

const groupLabel = computed(() => {
  const label = props.uischema?.label
  if (typeof label === 'string' && label.trim().length > 0) return label.trim()
  return null
})

const elements = computed(() => props.uischema?.elements ?? [])

function getRenderer(elem) {
  return elem?.type === 'Control' ? ControlRenderer : LayoutRenderer
}

function updateModel(val) {
  emit('update:modelValue', val)
}
</script>
