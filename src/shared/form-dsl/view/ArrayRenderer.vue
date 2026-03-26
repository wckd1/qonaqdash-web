<template>
  <div class="form-view-array">
    <label v-if="label" class="form-view-array__label">{{ label }}</label>
    <div v-if="items.length > 0" class="form-view-array__list">
      <div v-for="(item, index) in items" :key="index" class="form-view-array__item">
        <template v-for="(child, ci) in itemChildren" :key="ci">
          <ControlRenderer
            v-if="isLeafNode(child)"
            :node="child"
            :data="data"
            :full-data="data"
            :bind-prefix="`${fullBind}.${index}`"
          />
          <LayoutRenderer v-else :node="child" :data="data" />
        </template>
      </div>
    </div>
    <p v-else class="form-view-array__empty">—</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FormNode, FormArrayNode } from '@/shared/types/forms'
import { INPUT_NODE_TYPES } from '@/shared/types/forms'
import ControlRenderer from './ControlRenderer.vue'
import LayoutRenderer from './LayoutRenderer.vue'
import { resolveFormCatalogString } from '@/shared/i18n/formCatalog'
import { bindToPath, getValueByPath } from '../utils'

const props = defineProps({
  node: { type: Object as () => FormArrayNode, required: true },
  data: { type: Object as () => Record<string, unknown>, default: () => ({}) },
})

const fullBind = computed(() => props.node.bind ?? '')
const path = computed(() => bindToPath(fullBind.value))

const items = computed(() => {
  const value = getValueByPath(props.data, path.value)
  return Array.isArray(value) ? value : []
})

const label = computed(() => resolveFormCatalogString(props.node.label ?? ''))

const itemTemplate = computed(() => props.node.item)

const itemChildren = computed<FormNode[]>(() => {
  const tpl = itemTemplate.value
  if (!tpl) return []
  if (tpl.type === 'group' || tpl.type === 'stack') {
    return (tpl as { items?: FormNode[] }).items ?? []
  }
  return [tpl]
})

function isLeafNode(node: FormNode): boolean {
  return INPUT_NODE_TYPES.has(node.type) || node.type === 'button' || node.type === 'array'
}
</script>
