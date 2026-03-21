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
            <ControlRenderer
              v-for="[key, fieldSchema] in itemSchemaPropertiesOrdered"
              :key="key"
              :schema="itemSchema"
              :uischema="{
                type: 'Control',
                scope: '#/properties/' + key,
                label: String(fieldSchema?.title || key),
              }"
              :model-value="item"
              :full-data="fullDataForItem(index)"
              :array-item-index="index"
              :errors-map="errorsMap"
              :disabled="disabled"
              @update:model-value="(val) => updateItem(index, val)"
            />
          </div>
          <div
            v-if="canRemove && !disabled"
            class="form-edit-array__item-toolbar"
          >
            <button
              type="button"
              class="form-edit-icon-btn form-edit-icon-btn--danger"
              :title="t('jsonForm.build.remove')"
              :aria-label="t('jsonForm.edit.removeArrayItemAria')"
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
      :aria-label="t('jsonForm.edit.addArrayItemAria')"
      @click="addItem"
    >
      {{ t('common.add') }}
    </button>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ControlRenderer from './ControlRenderer.vue'
import IconTrash from '../build/icons/IconTrash.vue'
import { scopeToPath, getValueByPath, setValueByPath, getSchemaEntry } from '../utils'

const props = defineProps({
  schema: { type: Object, default: () => ({}) },
  uischema: { type: Object, required: true },
  modelValue: { type: Object, default: () => ({}) },
  errorsMap: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const path = computed(() => scopeToPath(props.uischema.scope))
const schemaEntry = computed(() => {
  if (!path.value?.length) return undefined
  return getSchemaEntry(props.schema, path.value)
})

const itemSchema = computed(() => {
  const entry = schemaEntry.value
  if (!entry?.items) return {}
  return Array.isArray(entry.items) ? entry.items[0] ?? {} : entry.items
})

const itemSchemaProperties = computed(() => itemSchema.value?.properties ?? {})

/** Array of [key, fieldSchema] pairs preserving schema property order */
const itemSchemaPropertiesOrdered = computed(() => {
  const props = itemSchemaProperties.value
  return Object.keys(props).map((key) => [key, props[key]])
})

const minItems = computed(() => schemaEntry.value?.minItems ?? 0)

const items = computed({
  get() {
    const val = getValueByPath(props.modelValue, path.value)
    return Array.isArray(val) ? val : []
  },
  set(v) {
    const next = JSON.parse(JSON.stringify(props.modelValue))
    setValueByPath(next, path.value, v)
    emit('update:modelValue', next)
  },
})

const canRemove = computed(() => items.value.length > minItems.value)

const label = computed(
  () => props.uischema.label || schemaEntry.value?.title || '',
)

function fullDataForItem(index) {
  return props.modelValue
}

function addItem() {
  const newItem = {}
  const propsDef = itemSchema.value?.properties ?? {}
  for (const key of Object.keys(propsDef)) {
    const def = propsDef[key]
    newItem[key] = def?.default !== undefined ? def.default : ''
  }
  items.value = [...items.value, newItem]
}

function removeItem(index) {
  if (items.value.length <= minItems.value) return
  const next = items.value.filter((_, i) => i !== index)
  items.value = next
}

function updateItem(index, newVal) {
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
