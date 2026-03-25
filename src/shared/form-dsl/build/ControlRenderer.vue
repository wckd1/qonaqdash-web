<template>
  <template v-if="buildLeaf === 'synthetic'">
    <template v-if="isButton"></template>
    <template v-else-if="isArray">
      <div class="form-build-array">
        <div class="form-build-array__header">
          <span class="form-build-control__label">{{ label }}</span>
          <span class="form-build-control__meta">{{ descriptionText }}</span>
        </div>
        <div v-if="arrayItemChildren.length > 0" class="form-build-array-items">
          <ControlRenderer
            v-for="(child, idx) in arrayItemChildren"
            :key="idx"
            :node="child"
            :data="{}"
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

  <template v-else-if="isButton"></template>

  <template v-else-if="isArray">
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
              :title="t('formDsl.build.configure')"
              :aria-label="t('formDsl.build.configureFieldAria')"
              @click="onConfigure"
            >
              <IconCog />
            </button>
            <button
              v-if="canDelete"
              type="button"
              class="form-build-icon-btn form-build-icon-btn--danger"
              :title="t('formDsl.build.remove')"
              :aria-label="t('formDsl.build.removeFieldAria')"
              @click="onDelete"
            >
              <IconTrash />
            </button>
            <span v-if="!canMutate" class="form-build-shell__locked" :title="t('formDsl.build.locked')"><IconLock /></span>
          </div>
        </div>
        <div v-if="arrayItemChildren.length > 0" class="form-build-array-items">
          <ControlRenderer
            v-for="(child, idx) in arrayItemChildren"
            :key="idx"
            :node="child"
            :data="{}"
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
          :title="t('formDsl.build.configure')"
          :aria-label="t('formDsl.build.configureFieldAria')"
          @click="onConfigure"
        >
          <IconCog />
        </button>
        <button
          v-if="canDelete"
          type="button"
          class="form-build-icon-btn form-build-icon-btn--danger"
          :title="t('formDsl.build.remove')"
          :aria-label="t('formDsl.build.removeFieldAria')"
          @click="onDelete"
        >
          <IconTrash />
        </button>
        <span v-if="!canMutate" class="form-build-shell__locked" :title="t('formDsl.build.locked')"><IconLock /></span>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import ControlRenderer from './ControlRenderer.vue'
import { resolveFormCatalogString } from '@/shared/i18n/formCatalog'
import { formBuildKey } from '@/shared/injectKeys'
import { canMutateBuildNode } from './buildChangability'
import type { FormNode, FormArrayNode } from '@/shared/types/forms'
import IconTrash from './icons/IconTrash.vue'
import IconLock from './icons/IconLock.vue'
import IconCog from './icons/IconCog.vue'

const props = defineProps({
  node: { type: Object as () => FormNode, required: true },
  data: { type: Object as () => Record<string, unknown>, default: () => ({}) },
  parentNode: { type: Object as () => FormNode | null, default: null },
  elementIndex: { type: Number, default: -1 },
  guestSubtreeLocked: { type: Boolean, default: false },
  /** `tree` = real definition node; `synthetic` = array item shape preview (no actions) */
  buildLeaf: { type: String, default: 'tree' },
})

const { t, te, locale } = useI18n()
const formBuild = inject(formBuildKey, null)

const variant = computed(() => (formBuild ? formBuild.variant : 'guest'))

const isButton = computed(() => props.node.type === 'button')
const isArray = computed(() => props.node.type === 'array')

const canMutate = computed(() =>
  canMutateBuildNode(variant.value, props.node, props.guestSubtreeLocked),
)

const canDelete = computed(() => canMutate.value && props.parentNode != null)

const label = computed(() => {
  const n = props.node
  if ('label' in n && n.label) return resolveFormCatalogString(n.label)
  if ('bind' in n && n.bind) return String(n.bind)
  if ('id' in n && n.id) return String(n.id)
  return ''
})

const arrayItemChildren = computed<FormNode[]>(() => {
  if (props.node.type !== 'array') return []
  const arrNode = props.node as FormArrayNode
  const tpl = arrNode.item
  if (!tpl) return []
  if (tpl.type === 'group' || tpl.type === 'stack') {
    return (tpl as { items?: FormNode[] }).items ?? []
  }
  return [tpl]
})

function typeKeyForNode(type: string): string {
  switch (type) {
    case 'string': return 'string'
    case 'textarea': return 'textarea'
    case 'email': return 'email'
    case 'number': return 'number'
    case 'checkbox': return 'checkbox'
    case 'select': return 'select'
    case 'date': return 'date'
    case 'datetime': return 'dateTime'
    case 'date-range': return 'dateRange'
    case 'number-range': return 'numberRange'
    case 'array': return 'array'
    case 'button': return 'button'
    default: return type
  }
}

function translateNodeType(type: string): string {
  const suffix = typeKeyForNode(type)
  const key = `formDsl.build.schemaType.${suffix}`
  return te(key) ? t(key) : type
}

function translateMetaPart(part: string): string {
  if (part === 'required') return t('formDsl.build.meta.required')
  if (part === 'dropdown') return t('formDsl.build.meta.dropdown')
  const mMin = part.match(/^min: (.+)$/)
  if (mMin) return t('formDsl.build.meta.minColon', { n: mMin[1] })
  const mMax = part.match(/^max: (.+)$/)
  if (mMax) return t('formDsl.build.meta.maxColon', { n: mMax[1] })
  const mMinItems = part.match(/^minItems: (.+)$/)
  if (mMinItems) return t('formDsl.build.meta.minItems', { n: mMinItems[1] })
  const mMaxItems = part.match(/^maxItems: (.+)$/)
  if (mMaxItems) return t('formDsl.build.meta.maxItems', { n: mMaxItems[1] })
  return part
}

const descriptionText = computed(() => {
  void locale.value
  const n = props.node
  const parts: string[] = []

  if (n.type === 'array') {
    const arrNode = n as FormArrayNode
    const tpl = arrNode.item
    if (tpl && (tpl.type === 'group' || tpl.type === 'stack')) {
      parts.push(t('formDsl.build.schemaType.arrayOf', { item: t('formDsl.build.schemaType.object') }))
    } else if (tpl) {
      parts.push(t('formDsl.build.schemaType.arrayOf', { item: translateNodeType(tpl.type) }))
    } else {
      parts.push(translateNodeType('array'))
    }
    if (arrNode.minItems != null) parts.push(`minItems: ${arrNode.minItems}`)
    if (arrNode.maxItems != null) parts.push(`maxItems: ${arrNode.maxItems}`)
  } else {
    parts.push(translateNodeType(n.type))
  }

  if ('validation' in n && n.validation) {
    if (n.validation.required) parts.push('required')
    if (n.validation.minLength != null) parts.push(`min: ${n.validation.minLength}`)
    if (n.validation.maxLength != null) parts.push(`max: ${n.validation.maxLength}`)
    if (n.validation.min != null) parts.push(`min: ${n.validation.min}`)
    if (n.validation.max != null) parts.push(`max: ${n.validation.max}`)
  }

  if (n.type === 'select') {
    const items = (n as { items?: unknown[] }).items
    if (Array.isArray(items) && items.length > 0) parts.push('dropdown')
  }

  return parts.map(translateMetaPart).join(' | ')
})

function onConfigure() {
  formBuild?.openConfigure?.(props.node)
}

function onDelete() {
  formBuild?.removeNode?.(props.node)
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
