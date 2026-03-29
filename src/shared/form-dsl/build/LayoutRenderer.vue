<template>
  <div
    class="form-build-shell"
    :class="{
      'form-build-shell--layout-v': isVertical,
      'form-build-shell--layout-h': isHorizontal,
      'form-build-shell--group': isGroup,
    }"
  >
    <div v-if="isVertical || isHorizontal" class="form-build-shell__toolbar">
      <span class="form-build-shell__badge">{{ layoutBadge }}</span>
      <div class="form-build-shell__actions">
        <button
          v-if="canMutateNode"
          type="button"
          class="form-build-icon-btn"
          :disabled="!canToggleLayoutDirection"
          :title="layoutToggleTitle"
          :aria-label="t('form_dsl.build.layout_switch_aria')"
          @click="onToggleLayout"
        >
          <IconSwitchLayout :horizontal="isHorizontal" />
        </button>
        <button
          v-if="canDeleteSelf"
          type="button"
          class="form-build-icon-btn form-build-icon-btn--danger"
          :title="t('form_dsl.build.remove')"
          :aria-label="t('form_dsl.build.remove_layout_aria')"
          @click="onDeleteSelf"
        >
          <IconTrash />
        </button>
        <span
          v-if="!canMutateNode && !isGuestBanner"
          class="form-build-shell__locked"
          :title="t('form_dsl.build.locked')"
        >
          <IconLock />
        </span>
      </div>
    </div>

    <section v-if="isGroup" class="form-view-layout form-view-layout--group">
      <div class="form-build-shell__group-head">
        <div class="form-build-shell__group-title-row">
          <div class="form-build-shell__group-title-cell">
            <template v-if="isGuestBanner">
              <div class="form-build-shell__guest-banner">
                <div v-if="!editingGroupTitle" class="form-build-group-title-display">
                  <h2
                    class="form-build-shell__group-heading"
                    :class="{
                      'form-build-shell__group-heading--placeholder': buildGroupHeadingMuted,
                    }"
                  >
                    {{ buildGroupHeadingText }}
                  </h2>
                  <button
                    type="button"
                    class="form-build-icon-btn"
                    :title="t('form_dsl.build.edit_group_title')"
                    @click="startTitleEdit"
                  >
                    <IconPencil />
                  </button>
                </div>
                <div v-else class="form-build-group-title-edit-row">
                  <label class="form-build-group-label-edit form-build-group-label-edit--grow">
                    <span class="visually-hidden">{{
                      t('form_dsl.build.group_title_hidden')
                    }}</span>
                    <input
                      ref="titleInputRef"
                      v-model="groupTitleModel"
                      type="text"
                      :placeholder="titlePlaceholder"
                      @blur="onTitleBlur"
                      @keydown.enter.prevent="onTitleConfirm"
                      @keydown.escape.prevent="cancelTitleEdit"
                    />
                  </label>
                  <button
                    type="button"
                    class="form-build-icon-btn form-build-icon-btn--confirm"
                    :title="t('form_dsl.build.save_title')"
                    @mousedown.prevent
                    @click="onTitleConfirm"
                  >
                    <IconCheck />
                  </button>
                </div>
                <p class="form-build-shell__guest-note">
                  {{ t('form_dsl.build.guest_banner_note') }}
                </p>
              </div>
            </template>
            <template v-else>
              <div v-if="!editingGroupTitle" class="form-build-group-title-display">
                <h2
                  class="form-build-shell__group-heading"
                  :class="{
                    'form-build-shell__group-heading--placeholder': buildGroupHeadingMuted,
                  }"
                >
                  {{ buildGroupHeadingText }}
                </h2>
                <button
                  type="button"
                  class="form-build-icon-btn"
                  :title="t('form_dsl.build.edit_group_title')"
                  @click="startTitleEdit"
                >
                  <IconPencil />
                </button>
              </div>
              <div v-else class="form-build-group-title-edit-row">
                <label class="form-build-group-label-edit form-build-group-label-edit--grow">
                  <span class="visually-hidden">{{ t('form_dsl.build.group_title_hidden') }}</span>
                  <input
                    ref="titleInputRef"
                    v-model="groupTitleModel"
                    type="text"
                    :placeholder="titlePlaceholder"
                    @blur="onTitleBlur"
                    @keydown.enter.prevent="onTitleConfirm"
                    @keydown.escape.prevent="cancelTitleEdit"
                  />
                </label>
                <button
                  type="button"
                  class="form-build-icon-btn form-build-icon-btn--confirm"
                  :title="t('form_dsl.build.save_title')"
                  @mousedown.prevent
                  @click="onTitleConfirm"
                >
                  <IconCheck />
                </button>
              </div>
              <p v-if="isGuestMainInfoNote" class="form-build-shell__guest-note">
                {{ t('form_dsl.build.guest_main_note') }}
              </p>
            </template>
          </div>
          <div class="form-build-shell__actions">
            <button
              v-if="canDeleteSelf"
              type="button"
              class="form-build-icon-btn form-build-icon-btn--danger"
              :title="t('form_dsl.build.remove_group')"
              @click="onDeleteSelf"
            >
              <IconTrash />
            </button>
            <span
              v-if="!canMutateNode && !isGuestBanner"
              class="form-build-shell__locked"
              :title="t('form_dsl.build.locked')"
            >
              <IconLock />
            </span>
          </div>
        </div>
      </div>
      <div class="form-view-layout__fields">
        <template v-for="(child, idx) in children" :key="idx">
          <LayoutRenderer
            v-if="isContainerNode(child)"
            :node="child"
            :data="data"
            :parent-node="node"
            :element-index="idx"
            :guest-subtree-locked="childGuestLocked"
          />
          <ControlRenderer
            v-else
            :node="child"
            :data="data"
            :parent-node="node"
            :element-index="idx"
            :guest-subtree-locked="childGuestLocked"
            build-leaf="tree"
          />
        </template>
      </div>
      <button
        v-if="showAddChild"
        type="button"
        class="form-build-add-child form-build-add-child--in-group"
        @click="onAddChild"
      >
        {{ t('form_dsl.build.add_element') }}
      </button>
    </section>

    <div
      v-else
      :class="[
        wrapperClass,
        { 'form-view-layout--horizontal-empty': isHorizontal && children.length === 0 },
      ]"
    >
      <template v-for="(child, idx) in children" :key="idx">
        <LayoutRenderer
          v-if="isContainerNode(child)"
          :node="child"
          :data="data"
          :parent-node="node"
          :element-index="idx"
          :guest-subtree-locked="childGuestLocked"
        />
        <ControlRenderer
          v-else
          :node="child"
          :data="data"
          :parent-node="node"
          :element-index="idx"
          :guest-subtree-locked="childGuestLocked"
          build-leaf="tree"
        />
      </template>
      <button
        v-if="showAddChild && isHorizontal && children.length === 0"
        type="button"
        class="form-build-add-child form-build-add-child--horizontal-empty"
        @click="onAddChild"
      >
        {{ t('form_dsl.build.add_element') }}
      </button>
      <button
        v-if="showAddChild && isHorizontal && children.length === 1"
        type="button"
        class="form-build-add-child form-build-add-child--horizontal-tail"
        @click="onAddChild"
      >
        {{ t('form_dsl.build.add_element') }}
      </button>
    </div>

    <button
      v-if="showAddChild && !isGroup && !isHorizontal"
      type="button"
      class="form-build-add-child"
      @click="onAddChild"
    >
      {{ t('form_dsl.build.add_element') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormNode, FormStackNode, FormGroupNode } from '@/shared/types/forms'
import LayoutRenderer from './LayoutRenderer.vue'
import ControlRenderer from './ControlRenderer.vue'
import { canMutateBuildNode, isGuestImmutableBuildGroup } from './buildChangability'
import { formBuildKey } from '@/shared/injectKeys'
import { MAX_HORIZONTAL_LAYOUT_CHILDREN } from './formBuildMutations'
import { resolveGroupTitle } from '../utils'
import IconTrash from './icons/IconTrash.vue'
import IconLock from './icons/IconLock.vue'
import IconSwitchLayout from './icons/IconSwitchLayout.vue'
import IconPencil from './icons/IconPencil.vue'
import IconCheck from './icons/IconCheck.vue'

const { t, locale } = useI18n()

const props = defineProps({
  node: { type: Object as () => FormNode, required: true },
  data: { type: Object as () => Record<string, unknown>, default: () => ({}) },
  parentNode: { type: Object as () => FormNode | null, default: null },
  elementIndex: { type: Number, default: -1 },
  guestSubtreeLocked: { type: Boolean, default: false },
})

const formBuild = inject(formBuildKey, null)

const isStack = computed(() => props.node.type === 'stack')
const isGroup = computed(() => props.node.type === 'group')
const isVertical = computed(
  () => isStack.value && (props.node as FormStackNode).direction === 'vertical',
)
const isHorizontal = computed(
  () => isStack.value && (props.node as FormStackNode).direction === 'horizontal',
)

const variant = computed(() => (formBuild ? formBuild.variant : 'guest'))

const childGuestLocked = computed(
  () =>
    props.guestSubtreeLocked ||
    (variant.value === 'booking' && isGuestImmutableBuildGroup(props.node)),
)

const isGuestBanner = computed(
  () => variant.value === 'booking' && isGuestImmutableBuildGroup(props.node),
)

const isGuestMainInfoNote = computed(
  () => variant.value === 'guest' && isGroup.value && (props.node as FormGroupNode).id === 'main',
)

const canMutateNode = computed(() =>
  canMutateBuildNode(variant.value, props.node, props.guestSubtreeLocked),
)

const isRoot = computed(() => props.parentNode == null)

const canDeleteSelf = computed(() => {
  if (!canMutateNode.value) return false
  if (isRoot.value) return false
  return true
})

const wrapperClass = computed(() => {
  if (isVertical.value) return 'form-view-layout form-view-layout--vertical'
  if (isHorizontal.value) return 'form-view-layout form-view-layout--horizontal'
  return 'form-view-layout'
})

const resolvedGroupTitle = computed(() =>
  isGroup.value ? resolveGroupTitle(props.node as { title?: string; id?: string }) : '',
)

const titlePlaceholder = computed(() => {
  void locale.value
  return t('form_dsl.build.set_title_placeholder')
})

const buildGroupHeadingText = computed(() => {
  void locale.value
  return resolvedGroupTitle.value || t('form_dsl.build.set_title_placeholder')
})

const buildGroupHeadingMuted = computed(() => !resolvedGroupTitle.value)

const editingGroupTitle = ref(false)
const titleInputRef = ref<HTMLInputElement | null>(null)
let groupTitleSnapshot = ''

const groupTitleModel = computed({
  get() {
    return isGroup.value ? ((props.node as FormGroupNode).title ?? '') : ''
  },
  set(v: string) {
    if (isGroup.value) {
      ;(props.node as FormGroupNode).title = v
      formBuild?.touch?.()
    }
  },
})

const layoutBadge = computed(() => {
  void locale.value
  return isHorizontal.value
    ? t('form_dsl.build.horizontal_layout')
    : t('form_dsl.build.vertical_layout')
})

const children = computed(() => (props.node as { children?: FormNode[] }).children ?? [])

const showAddChild = computed(() => {
  if (!formBuild) return false
  if (isGuestBanner.value) return false
  if (props.guestSubtreeLocked) return false
  if (!isGroup.value && !isStack.value) return false
  if (isHorizontal.value && children.value.length >= MAX_HORIZONTAL_LAYOUT_CHILDREN) return false
  if (isStack.value) return true
  return canMutateNode.value
})

const canToggleLayoutDirection = computed(() => {
  if (isHorizontal.value) return true
  if (isVertical.value) return children.value.length <= MAX_HORIZONTAL_LAYOUT_CHILDREN
  return true
})

const layoutToggleTitle = computed(() => {
  void locale.value
  if (!canMutateNode.value) return ''
  if (isVertical.value && children.value.length > MAX_HORIZONTAL_LAYOUT_CHILDREN) {
    return t('form_dsl.build.layout_max_children', { max: MAX_HORIZONTAL_LAYOUT_CHILDREN })
  }
  return isVertical.value
    ? t('form_dsl.build.layout_switch_horizontal')
    : t('form_dsl.build.layout_switch_vertical')
})

function isContainerNode(child: FormNode): boolean {
  return child.type === 'stack' || child.type === 'group'
}

function onToggleLayout() {
  formBuild?.toggleLayoutNode?.(props.node)
}

function onDeleteSelf() {
  formBuild?.removeNode?.(props.node)
}

function onAddChild() {
  formBuild?.openAddMenu?.(props.node)
}

function startTitleEdit() {
  groupTitleSnapshot = isGroup.value ? ((props.node as FormGroupNode).title ?? '') : ''
  editingGroupTitle.value = true
  nextTick(() => {
    titleInputRef.value?.focus?.()
    titleInputRef.value?.select?.()
  })
}

function finishTitleEdit() {
  editingGroupTitle.value = false
}

function onTitleConfirm() {
  finishTitleEdit()
}

function onTitleBlur(e: FocusEvent) {
  const row = titleInputRef.value?.closest?.('.form-build-group-title-edit-row')
  const rel = e.relatedTarget
  if (row && rel instanceof Node && row.contains(rel)) return
  finishTitleEdit()
}

function cancelTitleEdit() {
  if (isGroup.value) {
    ;(props.node as FormGroupNode).title = groupTitleSnapshot
    formBuild?.touch?.()
  }
  editingGroupTitle.value = false
}
</script>

<style scoped>
.form-build-shell {
  position: relative;
  min-width: 0;
}

.form-build-shell--layout-v,
.form-build-shell--layout-h {
  padding: var(--space-lg) var(--space-md) var(--space-md);
  border: 1px dashed var(--border-subtle);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--surface-2) 85%, transparent);
}

.form-build-shell--layout-v {
  border-left: 3px solid var(--brand-primary);
}

.form-build-shell--layout-h {
  border-top: 3px solid var(--brand-primary);
}

.form-build-shell__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
  min-height: 2rem;
}

.form-build-shell__badge {
  font-size: var(--text-caption-size);
  font-weight: var(--text-label-weight);
  color: var(--ink-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.form-build-shell__actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-left: auto;
}

.form-build-shell__locked {
  display: flex;
  color: var(--ink-tertiary);
}

.form-build-shell__group-head {
  margin-bottom: var(--space-sm);
}

.form-build-shell__group-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
}

.form-build-shell__group-title-cell {
  flex: 1;
  min-width: 0;
}

.form-build-group-title-display {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: var(--space-xs);
  max-width: 100%;
  min-width: 0;
}

.form-build-group-title-display .form-build-icon-btn {
  flex-shrink: 0;
}

.form-build-shell__group-heading {
  margin: 0;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  font-size: var(--text-h3-size);
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--ink-primary);
  line-height: 1.25;
}

.form-build-shell__group-heading--placeholder {
  color: var(--ink-tertiary);
  font-weight: 500;
}

.form-build-group-title-edit-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  max-width: 100%;
  min-width: 0;
}

.form-build-group-label-edit {
  flex: 1;
  min-width: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.form-build-group-label-edit--grow {
  flex: 1;
  min-width: 0;
}

.form-build-group-label-edit input {
  width: 100%;
}

.form-build-icon-btn--confirm:hover:not(:disabled) {
  border-color: var(--brand-primary);
  color: var(--brand-primary);
}

.form-build-shell__guest-banner {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.form-build-shell__guest-note {
  margin: var(--space-sm) var(--space-xs);
  font-size: var(--text-body-size);
  color: var(--ink-secondary);
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

.form-build-icon-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.form-build-icon-btn:hover:not(:disabled) {
  border-color: var(--brand-primary);
  color: var(--brand-primary);
}

.form-build-icon-btn--danger:hover:not(:disabled) {
  border-color: var(--semantic-error);
  color: var(--semantic-error);
}

.form-build-add-child {
  margin-top: var(--space-md);
  width: 100%;
  padding: var(--space-sm);
  border: 2px dashed var(--border-subtle);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--ink-secondary);
  font-size: var(--text-body-size);
  cursor: pointer;
}

.form-build-add-child--horizontal-empty {
  margin-top: 0;
  flex: 1 1 0;
  width: 100%;
  min-width: 0;
  min-height: 5.5rem;
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-md);
}

.form-build-add-child--horizontal-tail {
  margin-top: 0;
  margin-left: 0;
  width: auto;
  flex: 0 0 5.5rem;
  align-self: stretch;
  min-height: 3rem;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1.2;
  padding: var(--space-xs) var(--space-sm);
}

.form-build-add-child:hover {
  border-color: var(--brand-primary);
  color: var(--brand-primary);
}

.form-build-add-child--in-group {
  margin-top: var(--space-md);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
