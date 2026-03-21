<template>
  <LayoutRenderer
    v-if="rootUischema"
    :schema="schema"
    :uischema="rootUischema"
    :model-value="data"
    :parent-uischema="null"
    :element-index="-1"
    :guest-subtree-locked="false"
    @update:model-value="onModelUpdate"
  />

  <div
    v-if="addingParent"
    class="form-build-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="form-build-add-title"
    @click.self="addingParent = null"
  >
    <article class="form-build-modal">
      <h3 id="form-build-add-title" class="form-build-modal__title">Add element</h3>
      <div class="form-build-modal__list">
        <button
          v-for="t in addTypeOptions"
          :key="t"
          type="button"
          class="form-build-modal__option"
          @click="confirmAdd(t)"
        >
          {{ addTypeLabel(t) }}
        </button>
      </div>
      <footer class="form-build-modal__footer">
        <button type="button" class="btn-secondary" @click="addingParent = null">Cancel</button>
      </footer>
    </article>
  </div>

  <div
    v-if="updatingControl"
    class="form-build-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="form-build-cfg-title"
    @click.self="closeConfigure"
  >
    <article class="form-build-modal form-build-modal--wide">
      <h3 id="form-build-cfg-title" class="form-build-modal__title">Field settings</h3>
      <label>
        Label
        <input v-model="fieldSettings.label" type="text" />
      </label>
      <label>
        Type
        <select v-model="fieldSettings.type">
          <option value="Text">Text</option>
          <option value="Email">Email</option>
          <option value="Date">Date / date-time</option>
          <option value="Number">Number</option>
          <option value="Enum">Dropdown (enum)</option>
        </select>
      </label>
      <label v-if="fieldSettings.type === 'Enum'">
        Options (comma-separated)
        <input v-model="fieldSettings.options" type="text" />
      </label>
      <label class="form-build-modal__check">
        <input v-model="fieldSettings.required" type="checkbox" />
        Required
      </label>
      <label v-if="fieldSettings.type !== 'Enum'">
        Default value
        <input v-model="defaultString" type="text" />
      </label>
      <label v-else>
        Default value
        <select v-model="defaultString">
          <option value="">(none)</option>
          <option v-for="opt in enumOptionList" :key="opt" :value="opt">{{ opt }}</option>
        </select>
      </label>
      <footer class="form-build-modal__footer">
        <button type="button" class="btn-secondary" @click="closeConfigure">Cancel</button>
        <button type="button" @click="saveConfigure">Save</button>
      </footer>
    </article>
  </div>
</template>

<script setup>
import { computed, provide } from 'vue'
import LayoutRenderer from './build/LayoutRenderer.vue'
import {
  addBuildChild,
  allowedAddTypes,
  applyControlFieldSettings,
  MAX_HORIZONTAL_LAYOUT_CHILDREN,
  readControlFieldSettings,
  removeBuildNode,
  toggleLayoutDirection,
} from './build/formBuildMutations'
import { useFormBuildModals } from './build/useFormBuild'

const props = defineProps({
  /** JSON Schema for the form */
  schema: { type: Object, default: () => ({}) },
  /** UI schema (root Group/Layout or array with one root) */
  uischema: { type: [Object, Array], default: () => ({}) },
  /** Sample form data (optional) */
  data: { type: Object, default: () => ({}) },
  /** `booking` locks guest group subtree in the builder */
  variant: { type: String, default: 'guest' },
})

const emit = defineEmits(['update:data', 'update:schema', 'update:uischema'])

const rootUischema = computed(() => {
  const ui = props.uischema
  if (!ui) return null
  if (Array.isArray(ui) && ui.length > 0) return ui[0]
  return ui
})

const { addingParent, updatingControl, fieldSettings, resetFieldSettings } = useFormBuildModals()

function touch() {
  emit('update:schema', props.schema)
  emit('update:uischema', props.uischema)
}

function onModelUpdate(val) {
  emit('update:data', val)
}

const addTypeOptions = computed(() => {
  const parent = addingParent.value
  const root = rootUischema.value
  if (!parent || !root) return []
  return allowedAddTypes(parent, root)
})

function addTypeLabel(type) {
  switch (type) {
    case 'VerticalLayout':
      return 'Vertical layout'
    case 'HorizontalLayout':
      return 'Horizontal layout'
    case 'Group':
      return 'Group'
    case 'Field':
      return 'Field'
    default:
      return type
  }
}

function confirmAdd(type) {
  const parent = addingParent.value
  const root = rootUischema.value
  if (!parent || !root) return
  addBuildChild(props.schema, parent, type)
  addingParent.value = null
  touch()
}

function openAddMenu(parent) {
  if (
    parent?.type === 'HorizontalLayout' &&
    (parent.elements?.length ?? 0) >= MAX_HORIZONTAL_LAYOUT_CHILDREN
  ) {
    return
  }
  addingParent.value = parent
}

function openConfigure(control) {
  updatingControl.value = control
  fieldSettings.value = readControlFieldSettings(control, props.schema)
}

function closeConfigure() {
  updatingControl.value = null
  resetFieldSettings()
}

const defaultString = computed({
  get() {
    const v = fieldSettings.value.default
    if (v == null) return ''
    return String(v)
  },
  set(s) {
    fieldSettings.value.default = s === '' ? null : s
  },
})

const enumOptionList = computed(() =>
  fieldSettings.value.options
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
)

function saveConfigure() {
  const c = updatingControl.value
  if (!c) return
  applyControlFieldSettings(c, props.schema, fieldSettings.value)
  closeConfigure()
  touch()
}

function removeNode(target) {
  const root = rootUischema.value
  if (!root) return
  removeBuildNode(props.schema, root, target)
  touch()
}

function toggleLayoutNode(target) {
  if (toggleLayoutDirection(target)) touch()
}

provide('jsonFormBuild', {
  get variant() {
    return props.variant
  },
  openAddMenu,
  openConfigure,
  removeNode,
  toggleLayoutNode,
  touch,
})
</script>

<style scoped>
.form-build-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  background: color-mix(in srgb, var(--ink-primary) 35%, transparent);
}

.form-build-modal {
  width: min(22rem, 100%);
  max-height: min(90vh, 100%);
  overflow: auto;
  padding: var(--space-md);
  background: var(--surface-1);
  border-radius: var(--content-area-radius);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
}

.form-build-modal--wide {
  width: min(26rem, 100%);
}

.form-build-modal__title {
  margin: 0 0 var(--space-md);
  font-family: var(--font-display);
  font-size: var(--text-h3-size);
  font-weight: 600;
  color: var(--ink-primary);
}

.form-build-modal__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin-bottom: var(--space-md);
}

.form-build-modal__option {
  width: 100%;
  text-align: left;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface-2);
  color: var(--ink-primary);
  cursor: pointer;
}

.form-build-modal__option:hover {
  border-color: var(--brand-primary);
}

.form-build-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-md);
}

.form-build-modal label {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin-bottom: var(--space-md);
  font-size: var(--text-label-size);
  font-weight: var(--text-label-weight);
  color: var(--ink-secondary);
}

.form-build-modal__check {
  flex-direction: row;
  align-items: center;
  gap: var(--space-sm);
}
</style>
