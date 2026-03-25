<template>
  <component v-if="!nodeState.hidden" :is="wrapperTag" :class="wrapperClass">
    <template v-if="isGroup && isGuestGroup">
      <h2 v-if="groupTitle">{{ groupTitle }}</h2>
      <div class="form-view-layout__fields">
        <component
          v-for="(child, idx) in children"
          :key="idx"
          :is="getRenderer(child)"
          :node="child"
          :data="data"
        />
      </div>
      <router-link
        v-if="linkedGuestId"
        class="form-entity-section__profile-cta"
        :to="{ name: 'guest-detail', params: { id: linkedGuestId } }"
      >
        {{ t('bookings.openGuestProfile') }}
      </router-link>
    </template>
    <template v-else-if="isGroup">
      <h2 v-if="groupTitle">{{ groupTitle }}</h2>
      <div class="form-view-layout__fields">
        <component
          v-for="(child, idx) in children"
          :key="idx"
          :is="getRenderer(child)"
          :node="child"
          :data="data"
        />
      </div>
    </template>
    <template v-else>
      <component
        v-for="(child, idx) in children"
        :key="idx"
        :is="getRenderer(child)"
        :node="child"
        :data="data"
      />
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormNode } from '@/shared/types/forms'
import { INPUT_NODE_TYPES } from '@/shared/types/forms'
import LayoutRenderer from './LayoutRenderer.vue'
import ControlRenderer from './ControlRenderer.vue'
import { resolveGroupTitle } from '../utils'
import { evaluateNodeState } from '../formNodeConditions'

const props = defineProps({
  node: { type: Object as () => FormNode, required: true },
  data: { type: Object as () => Record<string, unknown>, default: () => ({}) },
})

const { t } = useI18n()

const nodeState = computed(() => evaluateNodeState(props.node, props.data))

const isStack = computed(() => props.node.type === 'stack')
const isGroup = computed(() => props.node.type === 'group')
const isVertical = computed(() => isStack.value && (props.node as { direction?: string }).direction === 'vertical')
const isHorizontal = computed(() => isStack.value && (props.node as { direction?: string }).direction === 'horizontal')

const isGuestGroup = computed(() => {
  if (!isGroup.value) return false
  return (props.node as { id?: string }).id === 'guest'
})

const wrapperTag = computed(() => (isGroup.value ? 'section' : 'div'))

const wrapperClass = computed(() => {
  if (isGroup.value && isGuestGroup.value) {
    return 'form-view-layout form-view-layout--group form-entity-section'
  }
  if (isGroup.value) return 'form-view-layout form-view-layout--group'
  if (isVertical.value) return 'form-view-layout form-view-layout--vertical'
  if (isHorizontal.value) return 'form-view-layout form-view-layout--horizontal'
  return 'form-view-layout'
})

const groupTitle = computed(() =>
  isGroup.value ? resolveGroupTitle(props.node as { title?: string; id?: string }) : '',
)

const children = computed(() => (props.node as { items?: FormNode[] }).items ?? [])

const linkedGuestId = computed(() => {
  const g = props.data?.guest
  if (!g || typeof g !== 'object') return null
  const id = (g as Record<string, unknown>).id
  if (id == null || id === '') return null
  return String(id)
})

function getRenderer(child: FormNode) {
  if (child.type === 'stack' || child.type === 'group') return LayoutRenderer
  if (child.type === 'array') return ControlRenderer
  if (child.type === 'button') return ControlRenderer
  if (INPUT_NODE_TYPES.has(child.type)) return ControlRenderer
  return LayoutRenderer
}
</script>
