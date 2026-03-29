<template>
  <div v-if="definition" class="form-content__viewport">
    <LayoutRenderer
      :node="definition"
      :data="data"
      :element-index="-1"
      :guest-subtree-locked="false"
    />
  </div>

  <div
    v-if="addingParent"
    class="form-build-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="form-build-add-title"
    @click.self="addingParent = null"
  >
    <article class="form-build-modal">
      <h3 id="form-build-add-title" class="form-build-modal__title">
        {{ t('form_dsl.build.modal_add_title') }}
      </h3>
      <div class="form-build-modal__list">
        <button
          v-for="opt in addTypeOptions"
          :key="opt"
          type="button"
          class="form-build-modal__option"
          @click="confirmAdd(opt)"
        >
          {{ addTypeLabel(opt) }}
        </button>
      </div>
      <footer class="form-build-modal__footer">
        <button type="button" class="btn-secondary" @click="addingParent = null">
          {{ t('common.cancel') }}
        </button>
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
      <h3 id="form-build-cfg-title" class="form-build-modal__title">
        {{ t('form_dsl.build.modal_field_settings_title') }}
      </h3>
      <label>
        {{ t('form_dsl.build.field_label') }}
        <input v-model="fieldSettings.label" type="text" />
      </label>
      <label>
        {{ t('form_dsl.build.field_type') }}
        <select v-model="fieldSettings.type">
          <option value="Text">{{ t('form_dsl.build.type_text') }}</option>
          <option value="Email">{{ t('form_dsl.build.type_email') }}</option>
          <option value="Date">{{ t('form_dsl.build.type_date') }}</option>
          <option value="Number">{{ t('form_dsl.build.type_number') }}</option>
          <option value="Enum">{{ t('form_dsl.build.type_enum') }}</option>
        </select>
      </label>
      <label v-if="fieldSettings.type === 'Enum'">
        {{ t('form_dsl.build.options_comma') }}
        <input v-model="fieldSettings.options" type="text" />
      </label>
      <label class="form-build-modal__check">
        <input v-model="fieldSettings.required" type="checkbox" />
        {{ t('form_dsl.build.required_field') }}
      </label>
      <label v-if="fieldSettings.type !== 'Enum'">
        {{ t('form_dsl.build.default_value') }}
        <input v-model="defaultString" type="text" />
      </label>
      <label v-else>
        {{ t('form_dsl.build.default_value') }}
        <select v-model="defaultString">
          <option value="">{{ t('form_dsl.build.default_none') }}</option>
          <option v-for="opt in enumOptionList" :key="opt" :value="opt">{{ opt }}</option>
        </select>
      </label>
      <footer class="form-build-modal__footer">
        <button type="button" class="btn-secondary" @click="closeConfigure">
          {{ t('common.cancel') }}
        </button>
        <button type="button" @click="saveConfigure">{{ t('common.save') }}</button>
      </footer>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormNode } from '@/shared/types/forms'
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
import { formBuildKey, type FormBuildContext } from '@/shared/injectKeys'

const props = defineProps({
  definition: { type: Object as () => FormNode | null, default: null },
  data: { type: Object as () => Record<string, unknown>, default: () => ({}) },
  variant: { type: String, default: 'guest' },
})

const emit = defineEmits(['update:data', 'update:definition'])

const { t } = useI18n()

const { addingParent, updatingControl, fieldSettings, resetFieldSettings } = useFormBuildModals()

function touch() {
  emit('update:definition', props.definition)
}

const addTypeOptions = computed(() => {
  const parent = addingParent.value
  const root = props.definition
  if (!parent || !root) return []
  return allowedAddTypes(parent, root)
})

function addTypeLabel(type: string): string {
  switch (type) {
    case 'VerticalStack':
      return t('form_dsl.build.vertical_layout')
    case 'HorizontalStack':
      return t('form_dsl.build.horizontal_layout')
    case 'Group':
      return t('form_dsl.build.add_type_group')
    case 'Field':
      return t('form_dsl.build.add_type_field')
    default:
      return type
  }
}

function confirmAdd(type: string) {
  const parent = addingParent.value
  if (!parent) return
  addBuildChild(parent, type)
  addingParent.value = null
  touch()
}

function openAddMenu(parent: FormNode) {
  if (
    parent.type === 'stack' &&
    (parent as { direction?: string }).direction === 'horizontal' &&
    ((parent as { children?: FormNode[] }).children?.length ?? 0) >= MAX_HORIZONTAL_LAYOUT_CHILDREN
  ) {
    return
  }
  addingParent.value = parent
}

function openConfigure(control: FormNode) {
  updatingControl.value = control
  fieldSettings.value = readControlFieldSettings(control)
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
  set(s: string) {
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
  applyControlFieldSettings(c, fieldSettings.value)
  closeConfigure()
  touch()
}

function removeNode(target: FormNode) {
  const root = props.definition
  if (!root) return
  removeBuildNode(root, target)
  touch()
}

function toggleLayoutNode(target: FormNode) {
  if (toggleLayoutDirection(target)) touch()
}

const formBuildApi: FormBuildContext = {
  get variant() {
    return props.variant
  },
  openAddMenu,
  openConfigure,
  removeNode,
  toggleLayoutNode,
  touch,
}
provide(formBuildKey, formBuildApi)
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
