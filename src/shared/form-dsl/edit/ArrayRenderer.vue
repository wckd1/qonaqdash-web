<template>
  <div class="form-view-array form-edit-array">
    <h2 v-if="label" class="form-edit-array__title">{{ label }}</h2>
    <div class="form-view-array__list">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="form-edit-array__item"
      >
        <div class="form-edit-array__item-inner">
          <div class="form-edit-array__item-fields">
            <template v-for="(child, ci) in itemChildren" :key="ci">
              <ControlRenderer
                v-if="isLeafNode(child)"
                :node="child"
                :data="item"
                :full-data="fullDataForItem()"
                :array-item-index="index"
                :bind-prefix="itemBindPrefix(index)"
                :errors-map="errorsMap"
                :disabled="disabled"
                @update:data="(val) => updateItem(index, val)"
              />
            </template>
          </div>
          <div
            v-if="canRemove && !disabled"
            class="form-edit-array__item-toolbar"
          >
            <button
              type="button"
              class="form-edit-icon-btn form-edit-icon-btn--danger"
              :title="t('formDsl.build.remove')"
              :aria-label="t('formDsl.edit.removeArrayItemAria')"
              @click="removeItem(index)"
            >
              <IconTrash />
            </button>
          </div>
        </div>
      </div>
    </div>
    <button
      v-if="!disabled"
      type="button"
      class="form-edit-array__add"
      :aria-label="t('formDsl.edit.addArrayItemAria')"
      @click="addItem"
    >
      {{ t('common.add') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormNode, FormArrayNode } from '@/shared/types/forms'
import { INPUT_NODE_TYPES } from '@/shared/types/forms'
import { resolveFormCatalogString } from '@/shared/i18n/formCatalog'
import ControlRenderer from './ControlRenderer.vue'
import IconTrash from '../build/icons/IconTrash.vue'
import { bindToPath, getValueByPath, setValueByPath } from '../utils'

const props = defineProps({
  node: { type: Object as () => FormArrayNode, required: true },
  data: { type: Object as () => Record<string, unknown>, default: () => ({}) },
  fullData: { type: Object as () => Record<string, unknown>, default: () => ({}) },
  errorsMap: { type: Object as () => Record<string, string[]>, default: () => ({}) },
  disabled: { type: Boolean, default: false },
  bindPrefix: { type: String, default: '' },
})

const emit = defineEmits(['update:data'])

const { t } = useI18n()

const fullBind = computed(() => {
  const bind = props.node.bind ?? ''
  return props.bindPrefix ? `${props.bindPrefix}.${bind}` : bind
})

const path = computed(() => bindToPath(fullBind.value))

const minItems = computed(() => props.node.minItems ?? 0)

const items = computed({
  get(): Record<string, unknown>[] {
    const val = getValueByPath(props.data, path.value)
    return Array.isArray(val) ? val : []
  },
  set(v: Record<string, unknown>[]) {
    const next = JSON.parse(JSON.stringify(props.data))
    setValueByPath(next, path.value, v)
    emit('update:data', next)
  },
})

const canRemove = computed(() => items.value.length > minItems.value)

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

function itemBindPrefix(index: number): string {
  return `${fullBind.value}.${index}`
}

function fullDataForItem(): Record<string, unknown> {
  return props.data
}

function addItem() {
  const newItem: Record<string, unknown> = {}
  const tpl = itemTemplate.value
  if (tpl && (tpl.type === 'group' || tpl.type === 'stack')) {
    for (const child of (tpl as { items?: FormNode[] }).items ?? []) {
      if ('bind' in child && typeof child.bind === 'string') {
        newItem[child.bind] = child.type === 'checkbox' ? false : ''
      }
    }
  } else if (tpl && 'bind' in tpl && typeof tpl.bind === 'string') {
    newItem[tpl.bind] = tpl.type === 'checkbox' ? false : ''
  }
  items.value = [...items.value, newItem]
}

function removeItem(index: number) {
  if (items.value.length <= minItems.value) return
  items.value = items.value.filter((_, i) => i !== index)
}

function updateItem(index: number, newVal: Record<string, unknown>) {
  const next = [...items.value]
  next[index] = newVal
  items.value = next
}

onMounted(() => {
  if (items.value.length < minItems.value) {
    const toAdd = minItems.value - items.value.length
    for (let i = 0; i < toAdd; i++) {
      addItem()
    }
  }
})
</script>
