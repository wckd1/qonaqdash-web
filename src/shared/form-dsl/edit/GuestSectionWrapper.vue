<template>
  <section class="form-view-layout form-view-layout--group guest-section-edit">
    <h2 v-if="groupTitle">{{ groupTitle }}</h2>
    <div class="form-view-layout__fields">
      <component
        v-for="(child, idx) in children"
        :key="idx"
        :is="getRenderer(child)"
        :node="child"
        :data="data"
        :full-data="data"
        :errors-map="errorsMap"
        :disabled="disabled"
        @update:data="updateData"
      />
    </div>
    <Teleport to="body">
      <div
        v-if="
          searchContext &&
          pickerAnchorEl &&
          !pickerDismissed &&
          (searchContext.debouncing || searchContext.loading || searchContext.results.length > 0)
        "
        ref="dropdownEl"
        class="guest-section-edit__dropdown guest-section-edit__dropdown--floating"
        role="region"
        :aria-labelledby="guestPickerTitleId"
        :style="dropdownStyle"
      >
        <div class="guest-section-edit__dropdown-header">
          <span :id="guestPickerTitleId" class="guest-section-edit__dropdown-title">
            {{ t('bookings.guest_picker_title') }}
          </span>
          <button
            type="button"
            class="guest-section-edit__dropdown-close"
            :aria-label="t('bookings.guest_picker_close')"
            @click="dismissPicker"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div class="guest-section-edit__dropdown-scroll">
          <p
            v-if="searchContext.debouncing || searchContext.loading"
            class="guest-section-edit__dropdown-hint"
            role="status"
            aria-live="polite"
          >
            {{ t('bookings.guest_picker_searching') }}
          </p>
          <div v-else role="listbox">
            <button
              v-for="g in searchContext.results"
              :key="g.id"
              type="button"
              class="guest-section-edit__dropdown-item"
              role="option"
              :aria-label="guestPickerOptionAriaLabel(g)"
              @mousedown.prevent="onSelectGuest(g)"
            >
              <span class="guest-section-edit__dropdown-item-name">{{ guestOptionLabel(g) }}</span>
              <span
                v-if="guestOptionContactLine(g)"
                class="guest-section-edit__dropdown-item-contact"
              >
                {{ guestOptionContactLine(g) }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import {
  computed,
  inject,
  provide,
  ref,
  shallowRef,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
  useId,
  type CSSProperties,
} from 'vue'
import type { FormNode, FormGroupNode } from '@/shared/types/forms'
import { INPUT_NODE_TYPES } from '@/shared/types/forms'
import LayoutRenderer from './LayoutRenderer.vue'
import ControlRenderer from './ControlRenderer.vue'
import { useI18n } from 'vue-i18n'
import { buildGuestSearchQuery, useGuestSearch } from '@/shared/composables/useGuestSearch'
import { guestSearchKey, guestPickerAnchorKey } from '@/shared/injectKeys'
import { resolveGroupTitle } from '../utils'

const props = defineProps({
  node: { type: Object as () => FormGroupNode, required: true },
  data: { type: Object as () => Record<string, unknown>, default: () => ({}) },
  errorsMap: { type: Object as () => Record<string, string[]>, default: () => ({}) },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:data'])

const { t } = useI18n()
const guestPickerTitleId = useId()

const searchGuestsFn = inject(guestSearchKey, undefined)
const searchContext = searchGuestsFn ? useGuestSearch(() => props.data, searchGuestsFn) : null

const pickerAnchorEl = shallowRef<HTMLElement | null>(null)
const pickerDismissed = ref(false)
const dropdownEl = ref<HTMLElement | null>(null)
const dropdownStyle = ref<CSSProperties | undefined>(undefined)
let clearAnchorTimer: ReturnType<typeof setTimeout> | null = null

function updateDropdownPosition() {
  const el = pickerAnchorEl.value
  const visible =
    searchContext &&
    !pickerDismissed.value &&
    (searchContext.debouncing || searchContext.loading || searchContext.results.length > 0)
  if (!el || !visible) {
    dropdownStyle.value = undefined
    return
  }
  const r = el.getBoundingClientRect()
  dropdownStyle.value = {
    position: 'fixed',
    top: `calc(${r.bottom}px + var(--space-xs))`,
    left: `${r.left}px`,
    width: `${r.width}px`,
  }
}

function setPickerAnchor(target: HTMLElement | null) {
  if (clearAnchorTimer != null) {
    clearTimeout(clearAnchorTimer)
    clearAnchorTimer = null
  }
  pickerDismissed.value = false
  pickerAnchorEl.value = target
  nextTick(() => updateDropdownPosition())
}

function dismissPicker() {
  pickerDismissed.value = true
  searchContext?.dismiss()
  nextTick(() => updateDropdownPosition())
}

function clearPickerAnchor(target: HTMLElement | null) {
  if (clearAnchorTimer != null) clearTimeout(clearAnchorTimer)
  clearAnchorTimer = setTimeout(() => {
    clearAnchorTimer = null
    const root = dropdownEl.value
    const active = document.activeElement
    if (root && active && root.contains(active)) return
    if (pickerAnchorEl.value === target) pickerAnchorEl.value = null
    updateDropdownPosition()
  }, 0)
}

provide(guestPickerAnchorKey, {
  setPickerAnchor: (el: HTMLElement | null) => {
    if (!searchGuestsFn) return
    setPickerAnchor(el)
  },
  clearPickerAnchor: (el: HTMLElement | null) => {
    if (!searchGuestsFn) return
    clearPickerAnchor(el)
  },
})

function onScrollOrResize() {
  updateDropdownPosition()
}

onMounted(() => {
  window.addEventListener('scroll', onScrollOrResize, true)
  window.addEventListener('resize', onScrollOrResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
  if (clearAnchorTimer != null) clearTimeout(clearAnchorTimer)
})

watch(
  () => [
    pickerAnchorEl.value,
    pickerDismissed.value,
    searchContext?.debouncing,
    searchContext?.loading,
    searchContext?.results?.length ?? 0,
  ],
  () => nextTick(() => updateDropdownPosition()),
  { flush: 'post' },
)

watch(
  () => buildGuestSearchQuery(props.data?.guest),
  () => {
    pickerDismissed.value = false
  },
)

const groupTitle = computed(() => resolveGroupTitle(props.node))

const children = computed(() => props.node.items ?? [])

function getRenderer(child: FormNode) {
  if (child.type === 'stack' || child.type === 'group') return LayoutRenderer
  return ControlRenderer
}

function updateData(val: Record<string, unknown>) {
  emit('update:data', val)
}

function guestOptionLabel(g: Record<string, unknown>): string {
  const last = (g.last_name ?? '') as string
  const first = (g.first_name ?? '') as string
  const named = [last, first].filter(Boolean).join(' ')
  const email = String(g.email ?? '').trim()
  if (named) return named
  return email || String(g.id)
}

function guestOptionContactLine(g: Record<string, unknown>): string {
  const email = String(g.email ?? '').trim()
  const phone = String(g.phone ?? '').trim()
  const last = (g.last_name ?? '') as string
  const first = (g.first_name ?? '') as string
  const hasName = Boolean([last, first].filter(Boolean).join(' '))
  if (hasName) {
    if (email && phone) return `${email} · ${phone}`
    return email || phone || ''
  }
  return phone || ''
}

function guestPickerOptionAriaLabel(g: Record<string, unknown>): string {
  const name = guestOptionLabel(g)
  const email = String(g.email ?? '').trim()
  const phone = String(g.phone ?? '').trim()
  const parts = [name]
  if (email) parts.push(`${t('fields.email')}: ${email}`)
  if (phone) parts.push(`${t('fields.phone')}: ${phone}`)
  return parts.join('. ')
}

function onSelectGuest(apiGuest: Record<string, unknown>) {
  if (!searchContext) return
  const next = searchContext.select(apiGuest)
  if (next) emit('update:data', next)
}
</script>

<style scoped>
.guest-section-edit__dropdown--floating {
  margin-top: 0;
  z-index: var(--z-dropdown, 50);
}

.guest-section-edit__dropdown {
  background: var(--surface-1, #fff);
  border: 2px solid color-mix(in srgb, var(--brand-primary) 52%, var(--border-subtle));
  border-radius: var(--content-area-radius, 0.5rem);
  box-shadow: var(--shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1));
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.guest-section-edit__dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
  padding: var(--space-xs) var(--space-md);
  border-bottom: 1px solid var(--border-subtle);
}

.guest-section-edit__dropdown-title {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-family: var(--font-body);
  font-size: var(--text-label-size);
  font-weight: var(--text-label-weight);
  letter-spacing: normal;
  line-height: 1.25;
  color: var(--ink-secondary);
}

.guest-section-edit__dropdown-close {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin: 0;
  padding: var(--space-xs);
  border: none;
  border-radius: var(--content-area-radius);
  background: transparent;
  color: var(--ink-secondary);
  cursor: pointer;
  line-height: 0;
}

.guest-section-edit__dropdown-close:hover,
.guest-section-edit__dropdown-close:focus {
  background: var(--canvas);
  color: var(--ink-primary);
  outline: none;
}

.guest-section-edit__dropdown-close svg {
  width: 1.125rem;
  height: 1.125rem;
}

.guest-section-edit__dropdown-scroll {
  overflow-y: auto;
  max-height: calc(
    5 *
      (
        2 * var(--space-sm) + 1.25 * var(--text-body-size) + var(--space-xs) + 1.25 *
          var(--text-caption-size)
      )
  );
  min-height: 0;
}

.guest-section-edit__dropdown-hint {
  margin: 0;
  padding: 0 var(--space-md) var(--space-sm);
  font-size: var(--text-body-size, 1rem);
  color: var(--ink-secondary, #666);
}

.guest-section-edit__dropdown-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-xs);
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  text-align: left;
  border: none;
  background: none;
  font-size: var(--text-body-size, 1rem);
  color: var(--ink-primary, #111);
  cursor: pointer;
}

.guest-section-edit__dropdown-item-name {
  font-weight: var(--text-body-weight);
  line-height: 1.25;
}

.guest-section-edit__dropdown-item-contact {
  font-size: var(--text-caption-size);
  font-weight: var(--text-caption-weight);
  line-height: 1.25;
  color: var(--ink-secondary);
  word-break: break-word;
}

.guest-section-edit__dropdown-item:hover,
.guest-section-edit__dropdown-item:focus {
  background: var(--canvas, #f3f4f6);
  outline: none;
}
</style>
