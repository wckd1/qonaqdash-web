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
          aria-label="Switch layout direction"
          @click="onToggleLayout"
        >
          <IconSwitchLayout :horizontal="isHorizontal" />
        </button>
        <button
          v-if="canDeleteSelf"
          type="button"
          class="form-build-icon-btn form-build-icon-btn--danger"
          title="Remove"
          aria-label="Remove layout"
          @click="onDeleteSelf"
        >
          <IconTrash />
        </button>
        <span v-if="!canMutateNode && !isGuestBanner" class="form-build-shell__locked" title="Locked">
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
                    :class="{ 'form-build-shell__group-heading--placeholder': buildGroupHeadingMuted }"
                  >
                    {{ buildGroupHeadingText }}
                  </h2>
                  <button
                    type="button"
                    class="form-build-icon-btn"
                    title="Edit group title"
                    aria-label="Edit group title"
                    @click="startTitleEdit"
                  >
                    <IconPencil />
                  </button>
                </div>
                <div v-else class="form-build-group-title-edit-row">
                  <label class="form-build-group-label-edit form-build-group-label-edit--grow">
                    <span class="visually-hidden">Group title</span>
                    <input
                      ref="titleInputRef"
                      v-model="groupLabelModel"
                      type="text"
                      :placeholder="GROUP_TITLE_PLACEHOLDER"
                      @blur="onTitleBlur"
                      @keydown.enter.prevent="onTitleConfirm"
                      @keydown.escape.prevent="cancelTitleEdit"
                    />
                  </label>
                  <button
                    type="button"
                    class="form-build-icon-btn form-build-icon-btn--confirm"
                    title="Save title"
                    aria-label="Save group title"
                    @mousedown.prevent
                    @click="onTitleConfirm"
                  >
                    <IconCheck />
                  </button>
                </div>
                <p class="form-build-shell__guest-note">
                  Guest fields come from Guest form settings. This block is read-only here.
                </p>
              </div>
            </template>
            <template v-else>
              <div v-if="!editingGroupTitle" class="form-build-group-title-display">
                <h2
                  class="form-build-shell__group-heading"
                  :class="{ 'form-build-shell__group-heading--placeholder': buildGroupHeadingMuted }"
                >
                  {{ buildGroupHeadingText }}
                </h2>
                <button
                  type="button"
                  class="form-build-icon-btn"
                  title="Edit group title"
                  aria-label="Edit group title"
                  @click="startTitleEdit"
                >
                  <IconPencil />
                </button>
              </div>
              <div v-else class="form-build-group-title-edit-row">
                <label class="form-build-group-label-edit form-build-group-label-edit--grow">
                  <span class="visually-hidden">Group title</span>
                  <input
                    ref="titleInputRef"
                    v-model="groupLabelModel"
                    type="text"
                    :placeholder="GROUP_TITLE_PLACEHOLDER"
                    @blur="onTitleBlur"
                    @keydown.enter.prevent="onTitleConfirm"
                    @keydown.escape.prevent="cancelTitleEdit"
                  />
                </label>
                <button
                  type="button"
                  class="form-build-icon-btn form-build-icon-btn--confirm"
                  title="Save title"
                  aria-label="Save group title"
                  @mousedown.prevent
                  @click="onTitleConfirm"
                >
                  <IconCheck />
                </button>
              </div>
              <p v-if="isGuestMainInfoNote" class="form-build-shell__guest-note">
                This group is included in the booking form when create a booking.
              </p>
            </template>
          </div>
          <div class="form-build-shell__actions">
            <button
              v-if="canDeleteSelf"
              type="button"
              class="form-build-icon-btn form-build-icon-btn--danger"
              title="Remove group"
              aria-label="Remove group"
              @click="onDeleteSelf"
            >
              <IconTrash />
            </button>
            <span v-if="!canMutateNode && !isGuestBanner" class="form-build-shell__locked" title="Locked">
              <IconLock />
            </span>
          </div>
        </div>
      </div>
      <div class="form-view-layout__fields">
        <template v-for="(element, idx) in elements" :key="idx">
          <LayoutRenderer
            v-if="element.type !== 'Control'"
            :schema="schema"
            :uischema="element"
            :model-value="modelValue"
            :full-data="fullData"
            :parent-uischema="uischema"
            :element-index="idx"
            :guest-subtree-locked="childGuestLocked"
            @update:model-value="updateModel"
          />
          <ControlRenderer
            v-else
            :schema="schema"
            :uischema="element"
            :model-value="modelValue"
            :full-data="fullData"
            :parent-uischema="uischema"
            :element-index="idx"
            :guest-subtree-locked="childGuestLocked"
            build-leaf="tree"
            @update:model-value="updateModel"
          />
        </template>
      </div>
      <button
        v-if="showAddChild"
        type="button"
        class="form-build-add-child form-build-add-child--in-group"
        @click="onAddChild"
      >
        Add element
      </button>
    </section>

    <div
      v-else
      :class="[
        wrapperClass,
        {
          'form-view-layout--horizontal-empty':
            isHorizontal && elements.length === 0,
        },
      ]"
    >
      <template v-for="(element, idx) in elements" :key="idx">
        <LayoutRenderer
          v-if="element.type !== 'Control'"
          :schema="schema"
          :uischema="element"
          :model-value="modelValue"
          :full-data="fullData"
          :parent-uischema="uischema"
          :element-index="idx"
          :guest-subtree-locked="childGuestLocked"
          @update:model-value="updateModel"
        />
        <ControlRenderer
          v-else
          :schema="schema"
          :uischema="element"
          :model-value="modelValue"
          :full-data="fullData"
          :parent-uischema="uischema"
          :element-index="idx"
          :guest-subtree-locked="childGuestLocked"
          build-leaf="tree"
          @update:model-value="updateModel"
        />
      </template>
      <button
        v-if="showAddChild && isHorizontal && elements.length === 0"
        type="button"
        class="form-build-add-child form-build-add-child--horizontal-empty"
        title="Add element to this row"
        aria-label="Add element to this row"
        @click="onAddChild"
      >
        Add element
      </button>
      <button
        v-if="showAddChild && isHorizontal && elements.length === 1"
        type="button"
        class="form-build-add-child form-build-add-child--horizontal-tail"
        title="Add next in this row"
        aria-label="Add element to the end of this row"
        @click="onAddChild"
      >
        Add element
      </button>
    </div>

    <button
      v-if="showAddChild && !isGroup && !isHorizontal"
      type="button"
      class="form-build-add-child"
      @click="onAddChild"
    >
      Add element
    </button>
  </div>
</template>

<script setup>
import { computed, inject, ref, nextTick } from 'vue'
import LayoutRenderer from './LayoutRenderer.vue'
import ControlRenderer from './ControlRenderer.vue'
import { canMutateBuildNode, isGuestImmutableBuildGroup } from './buildChangability'
import { MAX_HORIZONTAL_LAYOUT_CHILDREN } from './formBuildMutations'
import { resolveGroupTitle } from '../utils'
import IconTrash from './icons/IconTrash.vue'
import IconLock from './icons/IconLock.vue'
import IconSwitchLayout from './icons/IconSwitchLayout.vue'
import IconPencil from './icons/IconPencil.vue'
import IconCheck from './icons/IconCheck.vue'

const GROUP_TITLE_PLACEHOLDER = 'Set title'

const props = defineProps({
  schema: { type: Object, default: () => ({}) },
  uischema: { type: Object, required: true },
  modelValue: { type: Object, default: () => ({}) },
  fullData: { type: Object, default: () => ({}) },
  parentUischema: { type: Object, default: null },
  elementIndex: { type: Number, default: -1 },
  guestSubtreeLocked: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const formBuild = inject('jsonFormBuild', null)

const layoutType = computed(() => props.uischema?.type)
const isGroup = computed(() => layoutType.value === 'Group')
const isVertical = computed(() => layoutType.value === 'VerticalLayout')
const isHorizontal = computed(() => layoutType.value === 'HorizontalLayout')

const variant = computed(() => (formBuild ? formBuild.variant : 'guest'))

const childGuestLocked = computed(
  () =>
    props.guestSubtreeLocked ||
    (variant.value === 'booking' && isGuestImmutableBuildGroup(props.uischema)),
)

const isGuestBanner = computed(
  () => variant.value === 'booking' && isGuestImmutableBuildGroup(props.uischema),
)

/** Guest form settings: core `main` group — explain link to booking flow (editable, unlike booking guest banner). */
const isGuestMainInfoNote = computed(
  () => variant.value === 'guest' && isGroup.value && props.uischema?.id === 'main',
)

const canMutateNode = computed(() =>
  canMutateBuildNode(variant.value, props.uischema, props.guestSubtreeLocked),
)

const isRoot = computed(() => props.parentUischema == null)

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

const resolvedGroupTitle = computed(() => resolveGroupTitle(props.uischema))

/** Shown next to pencil when the group has no user-defined title (builder). */
const buildGroupHeadingText = computed(
  () => resolvedGroupTitle.value || GROUP_TITLE_PLACEHOLDER,
)

const buildGroupHeadingMuted = computed(() => !resolvedGroupTitle.value)

const editingGroupTitle = ref(false)
const titleInputRef = ref(null)
let groupTitleSnapshot = ''

const groupLabelModel = computed({
  get() {
    return props.uischema?.label ?? ''
  },
  set(v) {
    props.uischema.label = v
    formBuild?.touch?.()
  },
})

const layoutBadge = computed(() => (isHorizontal.value ? 'Horizontal layout' : 'Vertical layout'))

const elements = computed(() => props.uischema?.elements ?? [])

const isCoreFieldGroup = computed(
  () =>
    isGroup.value && (props.uischema?.id === 'main' || props.uischema?.id === 'booking'),
)

const showAddChild = computed(() => {
  if (!formBuild) return false
  if (isGuestBanner.value) return false
  if (props.guestSubtreeLocked) return false
  if (!isGroup.value && !isVertical.value && !isHorizontal.value) return false
  if (
    isHorizontal.value &&
    elements.value.length >= MAX_HORIZONTAL_LAYOUT_CHILDREN
  ) {
    return false
  }
  /* Layouts: allow adding children even when the layout is "unchangeable" (locked descendants). */
  if (isVertical.value || isHorizontal.value) return true
  if (isCoreFieldGroup.value) return true
  return canMutateNode.value
})

const canToggleLayoutDirection = computed(() => {
  if (isHorizontal.value) return true
  if (isVertical.value) {
    return elements.value.length <= MAX_HORIZONTAL_LAYOUT_CHILDREN
  }
  return true
})

const layoutToggleTitle = computed(() => {
  if (!canMutateNode.value) return ''
  if (
    isVertical.value &&
    elements.value.length > MAX_HORIZONTAL_LAYOUT_CHILDREN
  ) {
    return `Horizontal layout allows at most ${MAX_HORIZONTAL_LAYOUT_CHILDREN} elements. Remove one to switch.`
  }
  return isVertical.value
    ? 'Switch to horizontal layout'
    : 'Switch to vertical layout'
})

function updateModel(val) {
  emit('update:modelValue', val)
}

function onToggleLayout() {
  formBuild?.toggleLayoutNode?.(props.uischema)
}

function onDeleteSelf() {
  formBuild?.removeNode?.(props.uischema)
}

function onAddChild() {
  formBuild?.openAddMenu?.(props.uischema)
}

function startTitleEdit() {
  groupTitleSnapshot = typeof props.uischema?.label === 'string' ? props.uischema.label : ''
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

/** Ignore blur when focus moves to the save button in the same row (click order). */
function onTitleBlur(e) {
  const row = titleInputRef.value?.closest?.('.form-build-group-title-edit-row')
  const rel = e.relatedTarget
  if (row && rel instanceof Node && row.contains(rel)) return
  finishTitleEdit()
}

function cancelTitleEdit() {
  props.uischema.label = groupTitleSnapshot
  formBuild?.touch?.()
  editingGroupTitle.value = false
}
</script>

<style scoped>
.form-build-shell {
  position: relative;
  /* width: do not set 100% — horizontal layouts need flex children to share a row (see main.css). */
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

/* Title + pencil as one cluster so the icon sits right after the text, not at the row edge. */
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
  margin: 0;
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

/* Empty horizontal row: one full-width drop zone. */
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

/* One child: narrow add control at end of row, full row height. */
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
