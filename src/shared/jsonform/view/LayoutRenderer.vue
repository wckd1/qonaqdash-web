<template>
  <component v-if="!ruleState.hidden" :is="wrapperTag" :class="wrapperClass">
    <template v-if="isGroup && isGuestGroup">
      <h2 v-if="groupTitle">{{ groupTitle }}</h2>
      <div class="form-view-layout__fields">
        <component
          v-for="(element, idx) in elements"
          :key="idx"
          :is="getRenderer(element)"
          :schema="schema"
          :uischema="element"
          :model-value="modelValue"
        />
      </div>
      <router-link
        v-if="linkedGuestId"
        class="guest-section-view__profile-cta"
        :to="{ name: 'guest-detail', params: { id: linkedGuestId } }"
      >
        {{ t('bookings.openGuestProfile') }}
      </router-link>
    </template>
    <template v-else-if="isGroup">
      <h2 v-if="groupTitle">{{ groupTitle }}</h2>
      <div class="form-view-layout__fields">
        <component
          v-for="(element, idx) in elements"
          :key="idx"
          :is="getRenderer(element)"
          :schema="schema"
          :uischema="element"
          :model-value="modelValue"
        />
      </div>
    </template>
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
import { useI18n } from 'vue-i18n'
import LayoutRenderer from './LayoutRenderer.vue'
import ControlRenderer from './ControlRenderer.vue'
import { resolveGroupTitle } from '../utils'
import { evaluateRule } from '../useJsonFormRules'

const props = defineProps({
  schema: { type: Object, default: () => ({}) },
  uischema: { type: Object, required: true },
  modelValue: { type: Object, default: () => ({}) },
})

const { t } = useI18n()

const ruleState = computed(() => evaluateRule(props.uischema, props.modelValue))

const layoutType = computed(() => props.uischema?.type)
const isGroup = computed(() => layoutType.value === 'Group')
/** Match edit LayoutRenderer: guest block by group id or controls under #/properties/guest/. */
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
  if (isGroup.value && isGuestGroup.value) {
    return 'form-view-layout form-view-layout--group guest-section-view'
  }
  if (isGroup.value) return 'form-view-layout form-view-layout--group'
  if (isVertical.value) return 'form-view-layout form-view-layout--vertical'
  if (isHorizontal.value) return 'form-view-layout form-view-layout--horizontal'
  return 'form-view-layout'
})

const groupTitle = computed(() => resolveGroupTitle(props.uischema))

const elements = computed(() => props.uischema?.elements ?? [])

/** Linked CRM guest UUID when present (JSON `null` or missing → no link). */
const linkedGuestId = computed(() => {
  const g = props.modelValue?.guest
  if (!g || typeof g !== 'object') return null
  const id = g.id
  if (id == null || id === '') return null
  return String(id)
})

function getRenderer(elem) {
  return elem?.type === 'Control' ? ControlRenderer : LayoutRenderer
}
</script>
