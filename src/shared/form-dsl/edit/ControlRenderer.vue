<template>
  <template v-if="!nodeState.hidden">
    <template v-if="node.type === 'array'">
      <div class="form-edit-control form-edit-control--full-width">
        <ArrayRenderer
          :node="node"
          :data="data"
          :full-data="fullData"
          :errors-map="errorsMap"
          :disabled="branchDisabled"
          :bind-prefix="bindPrefix"
          @update:data="emit('update:data', $event)"
        />
      </div>
    </template>

    <template v-else-if="node.type === 'button'">
      <div class="form-edit-control form-edit-control--full-width form-edit-control--action">
        <button
          type="button"
          class="form-edit-control__action-btn"
          :disabled="branchDisabled"
          @click="onButtonClick"
        >
          {{ buttonLabel }}
        </button>
      </div>
    </template>

    <template v-else>
      <div class="form-edit-control">
        <label :for="inputId">{{ label }}</label>
        <div class="form-edit-control__input-wrap">
          <template v-if="node.type === 'checkbox'">
            <input
              :id="inputId"
              type="checkbox"
              :checked="!!localValue"
              :disabled="effectiveDisabled"
              @change="onCheckboxChange"
            />
          </template>
          <select
            v-else-if="isSelect"
            :id="inputId"
            :value="selectValueForInput"
            :disabled="effectiveDisabled"
            @change="onSelectChange"
          >
            <option
              v-for="opt in selectOptions"
              :key="String(opt.value)"
              :value="opt.value === null || opt.value === undefined ? '' : opt.value"
              :disabled="opt.disabled"
            >
              {{ opt.label ?? String(opt.value ?? '') }}
            </option>
          </select>
          <textarea
            v-else-if="node.type === 'textarea'"
            :id="inputId"
            :value="inputDisplayValue"
            :disabled="effectiveDisabled"
            :placeholder="placeholder"
            autocomplete="off"
            @input="onInput"
            @focus="onTextInputFocus"
            @blur="onTextInputBlur"
          />
          <input
            v-else
            :id="inputId"
            :value="inputDisplayValue"
            :type="inputType"
            :disabled="effectiveDisabled"
            :placeholder="placeholder"
            autocomplete="off"
            @input="onInput"
            @focus="onTextInputFocus"
            @blur="onTextInputBlur"
          />
          <p v-if="errorMessage" class="form-field-error">{{ errorMessage }}</p>
        </div>
      </div>
    </template>
  </template>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import type {
  FormNode,
  FormInputNode,
  FormSelectNode,
  FormSelectItem,
  FormArrayNode,
  FormButtonNode,
  FormActionStep,
} from '@/shared/types/forms'
import ArrayRenderer from './ArrayRenderer.vue'
import { resolveFormCatalogString } from '@/shared/i18n/formCatalog'
import {
  bindToPath,
  getValueByPath,
  setValueByPath,
  getFilteredRoomSelectOptions,
  buildRoomSelectItemsFromRooms,
} from '../utils'
import { availableRoomsKey, guestPickerAnchorKey } from '@/shared/injectKeys'
import { evaluateNodeState } from '../formNodeConditions'

const props = defineProps({
  node: { type: Object as () => FormNode, required: true },
  data: { type: Object as () => Record<string, unknown>, default: () => ({}) },
  fullData: { type: Object as () => Record<string, unknown>, default: () => ({}) },
  arrayItemIndex: { type: Number, default: undefined },
  bindPrefix: { type: String, default: '' },
  errorsMap: { type: Object as () => Record<string, string[]>, default: () => ({}) },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:data'])

const ruleModel = computed(() => props.fullData ?? props.data)
const nodeState = computed(() => evaluateNodeState(props.node, ruleModel.value))

const branchDisabled = computed(() => {
  if (props.node.type === 'button') return false
  return props.disabled || nodeState.value.disabled
})

const availableRooms = inject(availableRoomsKey, null)
const guestPickerAnchor = inject(guestPickerAnchorKey, null)

const inputNode = computed(() => props.node as FormInputNode | FormSelectNode)

const fullBind = computed(() => {
  const bind = (inputNode.value as { bind?: string }).bind
  if (!bind) return ''
  return props.bindPrefix ? `${props.bindPrefix}.${bind}` : bind
})

/** Path under `props.data` (root form or a single array row object). */
const valuePath = computed(() => {
  const bind = (inputNode.value as { bind?: string }).bind
  if (!bind) return []
  if (props.arrayItemIndex !== undefined) {
    return bindToPath(bind)
  }
  return bindToPath(fullBind.value)
})

const label = computed(() => resolveFormCatalogString(inputNode.value.label ?? ''))
const buttonLabel = computed(() =>
  resolveFormCatalogString((props.node as FormButtonNode).label ?? ''),
)
const inputId = computed(() => `form-edit-${fullBind.value || 'ctrl'}`)
const placeholder = computed(() =>
  resolveFormCatalogString((props.node as FormInputNode).options?.placeholder ?? ''),
)

const localValue = computed({
  get() {
    return getValueByPath(props.data, valuePath.value)
  },
  set(v: unknown) {
    const next = JSON.parse(JSON.stringify(props.data))
    setValueByPath(next, valuePath.value, v)
    emit('update:data', next)
  },
})

const inputDisplayValue = computed(() => {
  const val = localValue.value
  const n = props.node
  if (n.type === 'datetime' && val != null && typeof val === 'string') {
    return isoToDatetimeLocal(val) ?? ''
  }
  if (n.type === 'date' && val != null && typeof val === 'string') {
    return isoToDateOnly(val) ?? ''
  }
  return val === null || val === undefined ? '' : String(val)
})

function isoToDatetimeLocal(isoString: string): string {
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d}T${h}:${min}`
}

function isoToDateOnly(isoString: string): string {
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function datetimeLocalToISO(localString: string): string {
  if (!localString || typeof localString !== 'string') return ''
  const date = new Date(localString)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString()
}

function setLocalValue(v: unknown) {
  localValue.value = v
}

// ---------------------------------------------------------------------------
// Button actions
// ---------------------------------------------------------------------------

function executeActions(actions: FormActionStep[]) {
  const next = JSON.parse(JSON.stringify(ruleModel.value ?? {}))
  for (const action of actions) {
    const actionPath = bindToPath(action.bind)
    if (!actionPath.length) continue
    switch (action.type) {
      case 'set_value':
        setValueByPath(next, actionPath, action.value)
        break
      case 'clear_value':
        setValueByPath(next, actionPath, null)
        break
      case 'toggle_value': {
        const cur = getValueByPath(next, actionPath)
        setValueByPath(next, actionPath, !cur)
        break
      }
    }
  }
  emit('update:data', next)
}

function onButtonClick() {
  const btn = props.node as FormButtonNode
  if (btn.actions?.length) {
    executeActions(btn.actions)
  }
}

// ---------------------------------------------------------------------------
// Input focus / blur (guest picker)
// ---------------------------------------------------------------------------

function onTextInputFocus(e: FocusEvent) {
  if (!participatesInGuestPicker.value) return
  const el = e.currentTarget
  guestPickerAnchor?.setPickerAnchor(el instanceof HTMLElement ? el : null)
}

function onTextInputBlur(e: FocusEvent) {
  if (!participatesInGuestPicker.value) return
  const el = e.currentTarget
  guestPickerAnchor?.clearPickerAnchor(el instanceof HTMLElement ? el : null)
}

// ---------------------------------------------------------------------------
// Input handlers
// ---------------------------------------------------------------------------

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const n = props.node
  if (inputType.value === 'number') {
    const num = raw === '' ? undefined : Number(raw)
    setLocalValue(Number.isNaN(num) ? raw : num)
  } else if (n.type === 'datetime') {
    setLocalValue(raw ? datetimeLocalToISO(raw) : '')
  } else if (n.type === 'date') {
    setLocalValue(raw || '')
  } else {
    setLocalValue(raw)
  }
}

function onCheckboxChange(e: Event) {
  setLocalValue((e.target as HTMLInputElement).checked)
}

function normalizeRoomTypeForCompare(v: unknown): string {
  if (v == null || v === '') return ''
  return String(v)
}

function roomTypeSelectionChanged(prev: unknown, next: unknown): boolean {
  return normalizeRoomTypeForCompare(prev) !== normalizeRoomTypeForCompare(next)
}

function applyRoomsRowRoomTypeSelect(newVal: unknown) {
  const prev = (props.data as Record<string, unknown>)?.room_type
  if (!roomTypeSelectionChanged(prev, newVal)) {
    setLocalValue(newVal)
    return
  }
  const nextRow = JSON.parse(JSON.stringify(props.data))
  setValueByPath(nextRow, valuePath.value, newVal)
  nextRow.room_id = null
  delete nextRow.room_id_label
  delete nextRow.room_type_label
  emit('update:data', nextRow)
}

function onSelectChange(e: Event) {
  const raw = (e.target as HTMLSelectElement).value
  if (raw === '' && isRoomIDInRoomsArray.value) {
    setLocalValue(null)
    return
  }
  if (isSelectOptionNull(raw)) {
    if (isRoomTypeInRoomsArray.value) {
      applyRoomsRowRoomTypeSelect(null)
    } else {
      setLocalValue(null)
    }
    return
  }
  if (inputType.value === 'number') {
    const n = raw === '' ? undefined : Number(raw)
    const newVal = Number.isNaN(n) ? raw : n
    if (isRoomTypeInRoomsArray.value) {
      applyRoomsRowRoomTypeSelect(newVal)
    } else {
      setLocalValue(newVal)
    }
  } else if (isRoomTypeInRoomsArray.value) {
    applyRoomsRowRoomTypeSelect(raw)
  } else {
    setLocalValue(raw)
  }
}

const selectValueForInput = computed(() => {
  const v = localValue.value
  return v === null || v === undefined ? '' : v
})

function isSelectOptionNull(val: string): boolean {
  if (val !== '') return false
  if (props.node.type !== 'select') return false
  const items = (props.node as FormSelectNode).items
  return Array.isArray(items) && items.some((o) => o.value === null || o.value === undefined)
}

const inputType = computed(() => {
  const n = props.node
  if (n.type === 'date') return 'date'
  if (n.type === 'datetime') return 'datetime-local'
  if (n.type === 'email') return 'email'
  if (n.type === 'number') return 'number'
  return 'text'
})

const isSelect = computed(() => props.node.type === 'select')

const participatesInGuestPicker = computed(() => {
  if (!guestPickerAnchor) return false
  const bind = (inputNode.value as { bind?: string }).bind ?? ''
  if (!bind.startsWith('guest.') || bind === 'guest.id') return false
  if (isSelect.value) return false
  return true
})

const isRoomIDInRoomsArray = computed(() => {
  const bind = (inputNode.value as { bind?: string }).bind ?? ''
  return (
    bind === 'room_id' &&
    props.arrayItemIndex !== undefined &&
    Array.isArray((props.fullData?.stay as Record<string, unknown> | undefined)?.rooms)
  )
})

const isRoomTypeInRoomsArray = computed(() => {
  const bind = (inputNode.value as { bind?: string }).bind ?? ''
  return (
    bind === 'room_type' &&
    props.arrayItemIndex !== undefined &&
    Array.isArray((props.fullData?.stay as Record<string, unknown> | undefined)?.rooms)
  )
})

const effectiveDisabled = computed(() => {
  if (branchDisabled.value) return true
  if (!isRoomIDInRoomsArray.value) return false
  const rt = (props.data as Record<string, unknown>)?.room_type
  return rt == null || rt === ''
})

const selectOptions = computed((): FormSelectItem[] => {
  if (props.node.type !== 'select') return []
  const selectNode = props.node as FormSelectNode
  const items = selectNode.items ?? []

  if (isRoomIDInRoomsArray.value) {
    const rt = (props.data as Record<string, unknown>)?.room_type
    const roomTypeUnset = rt == null || rt === ''
    if (roomTypeUnset) {
      return items
        .filter((o) => o.value == null || o.value === undefined)
        .map((opt) => ({
          value: opt.value ?? null,
          label: resolveFormCatalogString(opt.label ?? String(opt.value ?? '')),
        }))
    }
    if (availableRooms?.value?.length) {
      const nullOpt = items.filter((o) => o.value == null)
      const merged = buildRoomSelectItemsFromRooms(
        availableRooms.value,
        nullOpt.length ? nullOpt : undefined,
      )
      return getFilteredRoomSelectOptions(
        props.fullData,
        props.data as Record<string, unknown>,
        props.arrayItemIndex,
        merged,
      )
    }
    if (items.length > 0) {
      return getFilteredRoomSelectOptions(
        props.fullData,
        props.data as Record<string, unknown>,
        props.arrayItemIndex,
        items.map((o) => ({ ...o })),
      )
    }
  }

  return items.map((opt) => ({
    value: opt.value,
    label: resolveFormCatalogString(opt.label ?? String(opt.value ?? '')),
    disabled: opt.disabled,
  }))
})

const errorMessage = computed(() => {
  const errs = props.errorsMap?.[fullBind.value]
  return Array.isArray(errs) && errs.length > 0 ? errs[0] : null
})
</script>
