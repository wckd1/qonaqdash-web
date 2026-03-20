<template>
  <section class="form-view-layout form-view-layout--group guest-section-edit">
    <h2 v-if="groupLabel">{{ groupLabel }}</h2>
    <div class="form-view-layout__fields">
      <component
        v-for="(element, idx) in elements"
        :key="idx"
        :is="getRenderer(element)"
        :schema="schema"
        :uischema="element"
        :model-value="modelValue"
        :full-data="modelValue"
        :errors-map="errorsMap"
        :disabled="disabled"
        @update:model-value="updateModel"
      />
    </div>
    <div
      v-if="
        searchContext &&
        (searchContext.debouncing ||
          searchContext.loading ||
          searchContext.results.length > 0)
      "
      class="guest-section-edit__dropdown"
      role="listbox"
      aria-live="polite"
    >
      <p
        v-if="searchContext.debouncing || searchContext.loading"
        class="guest-section-edit__dropdown-hint"
      >
        Searching…
      </p>
      <template v-else>
        <button
          v-for="g in searchContext.results"
          :key="g.id"
          type="button"
          class="guest-section-edit__dropdown-item"
          role="option"
          @mousedown.prevent="onSelectGuest(g)"
        >
          {{ guestOptionLabel(g) }}
        </button>
      </template>
    </div>
  </section>
</template>

<script setup>
import { computed, inject } from 'vue'
import LayoutRenderer from './LayoutRenderer.vue'
import ControlRenderer from './ControlRenderer.vue'
import { useGuestSearch } from '@/shared/composables/useGuestSearch'

const props = defineProps({
  schema: { type: Object, default: () => ({}) },
  uischema: { type: Object, required: true },
  modelValue: { type: Object, default: () => ({}) },
  errorsMap: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const searchGuestsFn = inject('guestSearch', null)
const searchContext = searchGuestsFn
  ? useGuestSearch(() => props.modelValue, searchGuestsFn)
  : null

const groupLabel = computed(() => {
  const label = props.uischema?.label
  return typeof label === 'string' && label.trim().length > 0 ? label.trim() : null
})

const elements = computed(() => props.uischema?.elements ?? [])

function getRenderer(elem) {
  return elem?.type === 'Control' ? ControlRenderer : LayoutRenderer
}

function updateModel(val) {
  emit('update:modelValue', val)
}

function guestOptionLabel(g) {
  const last = g.last_name ?? g.lastName ?? ''
  const first = g.first_name ?? g.firstName ?? ''
  return [last, first].filter(Boolean).join(' ') || g.email || g.id
}

function onSelectGuest(apiGuest) {
  if (!searchContext) return
  const next = searchContext.select(apiGuest)
  if (next) emit('update:modelValue', next)
}
</script>

<style scoped>
.guest-section-edit {
  position: relative;
}

.guest-section-edit__dropdown {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  margin-top: var(--space-xs, 0.25rem);
  background: var(--surface-1, #fff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--content-area-radius, 0.5rem);
  box-shadow: var(--shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1));
  max-height: 12rem;
  overflow-y: auto;
  z-index: var(--z-dropdown, 50);
}

.guest-section-edit__dropdown-hint {
  margin: 0;
  padding: var(--space-sm, 0.5rem) var(--space-md, 0.75rem);
  font-size: var(--text-body-size, 1rem);
  color: var(--ink-secondary, #666);
}

.guest-section-edit__dropdown-item {
  display: block;
  width: 100%;
  padding: var(--space-sm, 0.5rem) var(--space-md, 0.75rem);
  text-align: left;
  border: none;
  background: none;
  font-size: var(--text-body-size, 1rem);
  color: var(--ink-primary, #111);
  cursor: pointer;
}

.guest-section-edit__dropdown-item:hover,
.guest-section-edit__dropdown-item:focus {
  background: var(--canvas, #f3f4f6);
  outline: none;
}
</style>
