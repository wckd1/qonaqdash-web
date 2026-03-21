<template>
  <template v-if="buildLeaf === 'synthetic'">
    <template v-if="uischema.options?.action">
      <div class="form-build-control form-build-control--action">
        <span class="form-build-control__label">{{ actionLabel }}</span>
        <span class="form-build-control__meta">action button</span>
      </div>
    </template>
    <template v-else-if="schemaEntry?.type === 'array'">
      <div class="form-build-array">
        <div class="form-build-array__header">
          <span class="form-build-control__label">{{ label }}</span>
          <span class="form-build-control__meta">{{ descriptionText }}</span>
        </div>
        <div v-if="itemSchemaPropertiesOrdered.length > 0" class="form-build-array-items">
          <ControlRenderer
            v-for="[key, fieldSchema] in itemSchemaPropertiesOrdered"
            :key="key"
            :schema="itemSchema"
            :uischema="{
              type: 'Control',
              scope: '#/properties/' + key,
              label: String(fieldSchema?.title || key),
            }"
            :model-value="{}"
            :full-data="{}"
            build-leaf="synthetic"
          />
        </div>
      </div>
    </template>
    <template v-else>
      <div class="form-build-control">
        <span class="form-build-control__label">{{ label }}</span>
        <span class="form-build-control__meta">{{ descriptionText }}</span>
      </div>
    </template>
  </template>

  <template v-else-if="uischema.options?.action">
    <div class="form-build-control form-build-control--row form-build-control--action">
      <div class="form-build-control__main">
        <span class="form-build-control__label">{{ actionLabel }}</span>
        <span class="form-build-control__meta">action button</span>
      </div>
      <div class="form-build-control__toolbar">
        <span v-if="!canMutate" class="form-build-shell__locked" title="Locked"><IconLock /></span>
      </div>
    </div>
  </template>

  <template v-else-if="schemaEntry?.type === 'array'">
    <div class="form-build-control form-build-control--row form-build-array form-build-array--tree">
      <div class="form-build-array__block">
        <div class="form-build-array__header form-build-array__header--toolbar">
          <div class="form-build-control__main">
            <span class="form-build-control__label">{{ label }}</span>
            <span class="form-build-control__meta">{{ descriptionText }}</span>
          </div>
          <div class="form-build-control__toolbar">
            <button
              v-if="canMutate"
              type="button"
              class="form-build-icon-btn"
              title="Configure"
              aria-label="Configure field"
              @click="onConfigure"
            >
              <IconCog />
            </button>
            <button
              v-if="canDelete"
              type="button"
              class="form-build-icon-btn form-build-icon-btn--danger"
              title="Remove"
              aria-label="Remove field"
              @click="onDelete"
            >
              <IconTrash />
            </button>
            <span v-if="!canMutate" class="form-build-shell__locked" title="Locked"><IconLock /></span>
          </div>
        </div>
        <div v-if="itemSchemaPropertiesOrdered.length > 0" class="form-build-array-items">
          <ControlRenderer
            v-for="[key, fieldSchema] in itemSchemaPropertiesOrdered"
            :key="key"
            :schema="itemSchema"
            :uischema="{
              type: 'Control',
              scope: '#/properties/' + key,
              label: String(fieldSchema?.title || key),
            }"
            :model-value="{}"
            :full-data="{}"
            build-leaf="synthetic"
          />
        </div>
      </div>
    </div>
  </template>

  <template v-else>
    <div class="form-build-control form-build-control--row">
      <div class="form-build-control__main">
        <span class="form-build-control__label">{{ label }}</span>
        <span class="form-build-control__meta">{{ descriptionText }}</span>
      </div>
      <div class="form-build-control__toolbar">
        <button
          v-if="canMutate"
          type="button"
          class="form-build-icon-btn"
          title="Configure"
          aria-label="Configure field"
          @click="onConfigure"
        >
          <IconCog />
        </button>
        <button
          v-if="canDelete"
          type="button"
          class="form-build-icon-btn form-build-icon-btn--danger"
          title="Remove"
          aria-label="Remove field"
          @click="onDelete"
        >
          <IconTrash />
        </button>
        <span v-if="!canMutate" class="form-build-shell__locked" title="Locked"><IconLock /></span>
      </div>
    </div>
  </template>
</template>

<script setup>
import { computed, inject } from 'vue'
import ControlRenderer from './ControlRenderer.vue'
import { scopeToPath, getSchemaEntry } from '../utils'
import { canMutateBuildNode } from './buildChangability'
import IconTrash from './icons/IconTrash.vue'
import IconLock from './icons/IconLock.vue'
import IconCog from './icons/IconCog.vue'

const props = defineProps({
  schema: { type: Object, default: () => ({}) },
  uischema: { type: Object, required: true },
  modelValue: { type: Object, default: () => ({}) },
  fullData: { type: Object, default: () => ({}) },
  parentUischema: { type: Object, default: null },
  elementIndex: { type: Number, default: -1 },
  guestSubtreeLocked: { type: Boolean, default: false },
  /** `tree` = real uischema control; `synthetic` = array item shape preview (no actions) */
  buildLeaf: { type: String, default: 'tree' },
})

const formBuild = inject('jsonFormBuild', null)

const variant = computed(() => (formBuild ? formBuild.variant : 'guest'))

const canMutate = computed(() =>
  canMutateBuildNode(variant.value, props.uischema, props.guestSubtreeLocked),
)

const canDelete = computed(() => canMutate.value && props.parentUischema != null)

const path = computed(() => scopeToPath(props.uischema.scope))
const schemaEntry = computed(() => getSchemaEntry(props.schema, path.value))

const itemSchema = computed(() => {
  const entry = schemaEntry.value
  if (!entry?.items) return {}
  return Array.isArray(entry.items) ? entry.items[0] ?? {} : entry.items
})

const itemSchemaPropertiesOrdered = computed(() => {
  const p = itemSchema.value?.properties ?? {}
  return Object.keys(p).map((key) => [key, p[key]])
})

const label = computed(
  () =>
    props.uischema.label ||
    schemaEntry.value?.title ||
    path.value?.join('.') ||
    '',
)

const actionLabel = computed(() => props.uischema.options?.action?.label || 'Action')

const isRequired = computed(() => {
  if (!path.value?.length) return false
  const fieldName = path.value[path.value.length - 1]
  const parentPath = path.value.slice(0, -1)
  const parentSchema = parentPath.length === 0 ? props.schema : getSchemaEntry(props.schema, parentPath)
  const required = parentSchema?.required
  return Array.isArray(required) && required.includes(fieldName)
})

const descriptionText = computed(() => {
  const parts = []
  const entry = schemaEntry.value
  if (!entry) return ''
  let typeStr = entry.type || ''
  if (entry.format) {
    typeStr = entry.format
  } else if (Array.isArray(entry.type)) {
    typeStr = entry.type.filter((t) => t !== 'null').join(' | ')
  } else if (entry.type === 'array') {
    const items = entry.items
    if (Array.isArray(items) && items.length > 0) {
      const itemType = items[0]?.type
      if (Array.isArray(itemType)) {
        const filtered = itemType.filter((t) => t !== 'null')
        typeStr =
          filtered.length > 0 && filtered[0] !== 'object' ? `array<${filtered.join(' | ')}>` : 'array'
      } else {
        typeStr = itemType && itemType !== 'object' ? `array<${itemType}>` : 'array'
      }
    } else if (items?.type) {
      if (Array.isArray(items.type)) {
        const filtered = items.type.filter((t) => t !== 'null')
        typeStr =
          filtered.length > 0 && filtered[0] !== 'object' ? `array<${filtered.join(' | ')}>` : 'array'
      } else {
        typeStr = items.type && items.type !== 'object' ? `array<${items.type}>` : 'array'
      }
    } else {
      typeStr = 'array'
    }
  }
  parts.push(typeStr)
  if (isRequired.value) parts.push('required')
  if (entry.minLength != null) parts.push(`min: ${entry.minLength}`)
  if (entry.maxLength != null) parts.push(`max: ${entry.maxLength}`)
  if (entry.minimum != null) parts.push(`min: ${entry.minimum}`)
  if (entry.maximum != null) parts.push(`max: ${entry.maximum}`)
  if (entry.minItems != null) parts.push(`minItems: ${entry.minItems}`)
  if (entry.maxItems != null) parts.push(`maxItems: ${entry.maxItems}`)
  if (entry.pattern) parts.push('pattern')
  if (Array.isArray(entry.enum) && entry.enum.length > 0) parts.push('dropdown')
  if (Array.isArray(entry.oneOf) && entry.oneOf.length > 0) parts.push('dropdown')
  return parts.join(' | ')
})

function onConfigure() {
  formBuild?.openConfigure?.(props.uischema)
}

function onDelete() {
  formBuild?.removeNode?.(props.uischema)
}
</script>

<style scoped>
.form-build-control {
  grid-column: 1 / -1;
  background: var(--surface-1);
  border: 1px solid var(--control-border);
  border-radius: var(--radius-md);
  padding: var(--space-xs) var(--space-md);
  min-height: 2.5rem;
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.form-build-control--row {
  justify-content: space-between;
}

.form-build-control__main {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-width: 0;
  flex: 1;
}

.form-build-control__toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-shrink: 0;
}

.form-build-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface-1);
  color: var(--ink-secondary);
  cursor: pointer;
}

.form-build-icon-btn:hover:not(:disabled) {
  border-color: var(--brand-primary);
  color: var(--brand-primary);
}

.form-build-icon-btn--danger:hover:not(:disabled) {
  border-color: var(--semantic-error);
  color: var(--semantic-error);
}

.form-build-shell__locked {
  display: flex;
  color: var(--ink-tertiary);
}

.form-build-control__label {
  font-weight: var(--text-label-weight);
  color: var(--ink-primary);
  flex-shrink: 0;
}

.form-build-control__meta {
  color: var(--ink-tertiary);
  font-size: var(--text-caption-size);
  font-family: ui-monospace, monospace;
}

.form-build-control--action .form-build-control__meta {
  font-style: italic;
}

.form-build-array {
  grid-column: 1 / -1;
  background: var(--surface-1);
  border: 1px solid var(--control-border);
  border-radius: var(--radius-md);
  padding: var(--space-xs) var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.form-build-array--tree {
  padding: var(--space-xs) var(--space-md);
}

.form-build-array__block {
  width: 100%;
}

.form-build-array__header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-height: 2.5rem;
}

.form-build-array__header--toolbar {
  justify-content: space-between;
  flex-wrap: wrap;
}

.form-build-array-items {
  margin-left: var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}
</style>
