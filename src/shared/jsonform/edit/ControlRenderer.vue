<template>
  <template v-if="!ruleState.hidden">
  <template v-if="schemaEntry?.type === 'array'">
    <div class="form-edit-control form-edit-control--full-width">
      <ArrayRenderer
        :schema="schema"
        :uischema="uischema"
        :model-value="modelValue"
        :errors-map="errorsMap"
        :disabled="branchDisabled"
        @update:model-value="emit('update:modelValue', $event)"
      />
    </div>
  </template>

  <template v-else-if="uischema.options?.action">
    <div class="form-edit-control form-edit-control--full-width form-edit-control--action">
      <button
        type="button"
        class="form-edit-control__action-btn"
        :disabled="branchDisabled"
        @click="onActionClick"
      >
        {{ actionButtonLabel }}
      </button>
    </div>
  </template>

  <template v-else>
    <div class="form-edit-control">
      <label :for="inputId">{{ label }}</label>
      <div class="form-edit-control__input-wrap">
        <select
          v-if="isSelect"
          :id="inputId"
          :value="selectValueForInput"
          :disabled="effectiveDisabled"
          @change="onSelectChange"
        >
          <option
            v-for="opt in selectOptions"
            :key="String(opt.value)"
            :value="opt.value === null || opt.value === undefined ? '' : opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
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
import ArrayRenderer from './ArrayRenderer.vue'
import { resolveFormCatalogString } from '@/shared/i18n/formCatalog'
import {
  scopeToPath,
  getValueByPath,
  setValueByPath,
  getSchemaEntry,
  getDefaultObjectFromSchema,
  getFilteredRoomSelectOptions,
  buildRoomOneOfFromRooms,
} from '../utils'
import { availableRoomsKey, guestPickerAnchorKey } from '@/shared/injectKeys'
import { evaluateRule } from '../useJsonFormRules'

const props = defineProps({
  schema: { type: Object, default: () => ({}) },
  uischema: { type: Object, required: true },
  modelValue: { type: Object, default: () => ({}) },
  fullData: { type: Object, default: () => ({}) },
  /** When inside ArrayRenderer (e.g. booking.rooms), index of current item for roomID filtering */
  arrayItemIndex: { type: Number, default: undefined },
  /**
   * JSONForms scope for errorsMap when uischema.scope is item-relative (e.g. `#/properties/roomType`)
   * but AJV keys use the full path (`#/properties/booking/properties/rooms/...`).
   */
  errorScope: { type: String, default: '' },
  errorsMap: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

/** Root form model for `rule.condition.scope` (e.g. #/properties/id); falls back to modelValue when unset. */
const ruleModel = computed(() => props.fullData ?? props.modelValue)
const ruleState = computed(() => evaluateRule(props.uischema, ruleModel.value))
/** Action controls ignore parent/group DISABLE and DISABLE/ENABLE rule effects so e.g. Clear selection stays clickable inside a disabled guest block. */
const branchDisabled = computed(() => {
  if (props.uischema.options?.action) return false
  return props.disabled || ruleState.value.disabled
})

/** When provided by BookingNewView: rooms from GET /api/property/rooms/available when checkIn/checkOut change */
const availableRooms = inject(availableRoomsKey, null)

/** Guest booking typeahead: anchor dropdown to the focused guest field (GuestSectionWrapper). */
const guestPickerAnchor = inject(guestPickerAnchorKey, null)

const path = computed(() => scopeToPath(props.uischema.scope))
const schemaEntry = computed(() => getSchemaEntry(props.schema, path.value))
const label = computed(() =>
  resolveFormCatalogString(
    props.uischema.label ||
      schemaEntry.value?.title ||
      path.value?.join('.') ||
      '',
  ),
)
const actionButtonLabel = computed(() =>
  resolveFormCatalogString(props.uischema.options?.action?.label ?? ''),
)
const inputId = computed(() => `jsonform-edit-${path.value?.join('-') || 'ctrl'}`)
const placeholder = computed(() => resolveFormCatalogString(schemaEntry.value?.title ?? ''))

const localValue = computed({
  get() {
    return getValueByPath(props.modelValue, path.value)
  },
  set(v) {
    const next = JSON.parse(JSON.stringify(props.modelValue))
    setValueByPath(next, path.value, v)
    emit('update:modelValue', next)
  },
})

/** For datetime-local input: show value in local format; store remains RFC 3339 (e.g. 2026-03-15T14:00:00.000Z). */
const inputDisplayValue = computed(() => {
  const entry = schemaEntry.value
  const val = localValue.value
  if (entry?.format === 'date-time' && val != null && typeof val === 'string') {
    return isoToDatetimeLocal(val) ?? ''
  }
  if (entry?.format === 'date' && val != null && typeof val === 'string') {
    return isoToDateOnly(val) ?? ''
  }
  return val === null || val === undefined ? '' : String(val)
})

function isoToDatetimeLocal(isoString) {
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d}T${h}:${min}`
}

function isoToDateOnly(isoString) {
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function setLocalValue(v) {
  localValue.value = v
}

/** For action button: normalize clear-guest (null/empty object) to default object from schema. */
function onActionClick() {
  let v = props.uischema.options?.action?.value
  const pathLen = path.value?.length
  const isGuestScope =
    pathLen === 1 && path.value?.[0] === 'guest'
  if (
    isGuestScope &&
    (v == null || (typeof v === 'object' && Object.keys(v).length === 0))
  ) {
    const guestSchema = getSchemaEntry(props.schema, path.value)
    v = getDefaultObjectFromSchema(guestSchema)
    const next = JSON.parse(JSON.stringify(ruleModel.value ?? {}))
    setValueByPath(next, path.value, v)
    if (!next.guest || typeof next.guest !== 'object') next.guest = {}
    next.guest.id = null
    emit('update:modelValue', next)
    return
  }
  setLocalValue(v)
}

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

function onInput(e) {
  const raw = e.target.value
  const entry = schemaEntry.value
  if (inputType.value === 'number') {
    const n = raw === '' ? undefined : Number(raw)
    setLocalValue(Number.isNaN(n) ? raw : n)
  } else if (entry?.format === 'date-time') {
    setLocalValue(raw ? datetimeLocalToISO(raw) : '')
  } else if (entry?.format === 'date') {
    setLocalValue(raw || '')
  } else {
    setLocalValue(raw)
  }
}

/** Parse datetime-local value (yyyy-MM-ddTHH:mm) as local time, return RFC 3339 (toISOString()). */
function datetimeLocalToISO(localString) {
  if (!localString || typeof localString !== 'string') return ''
  const date = new Date(localString)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString()
}

function normalizeRoomTypeForCompare(v) {
  if (v == null || v === '') return ''
  return String(v)
}

function roomTypeSelectionChanged(prev, next) {
  return normalizeRoomTypeForCompare(prev) !== normalizeRoomTypeForCompare(next)
}

/** When room type changes, clear roomID so we do not keep a room from the previous type (not in filtered list). */
function applyRoomsRowRoomTypeSelect(newVal) {
  const prev = props.modelValue?.roomType
  if (!roomTypeSelectionChanged(prev, newVal)) {
    setLocalValue(newVal)
    return
  }
  const nextRow = JSON.parse(JSON.stringify(props.modelValue))
  setValueByPath(nextRow, path.value, newVal)
  nextRow.roomID = null
  emit('update:modelValue', nextRow)
}

function onSelectChange(e) {
  const raw = e.target.value
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

/** For select, HTML uses empty string for null option. */
const selectValueForInput = computed(() => {
  const v = localValue.value
  return v === null || v === undefined ? '' : v
})

function isSelectOptionNull(val) {
  if (val !== '') return false
  const entry = schemaEntry.value
  const oneOf = entry?.oneOf
  if (Array.isArray(oneOf) && oneOf.some((o) => o.const === null || o.const === undefined)) {
    return true
  }
  return false
}

const inputType = computed(() => {
  const entry = schemaEntry.value
  if (entry?.format === 'date') return 'date'
  if (entry?.format === 'date-time') return 'datetime-local'
  if (entry?.format === 'email') return 'email'
  if (entry?.type === 'integer' || entry?.type === 'number') return 'number'
  return 'text'
})

const isSelect = computed(() => {
  const entry = schemaEntry.value
  const hasEnum = Array.isArray(entry?.enum) && entry.enum.length > 0
  const hasOneOf = Array.isArray(entry?.oneOf) && entry.oneOf.length > 0
  /** Schema may ship empty oneOf for roomID; options come from GET /rooms/available after dates are set */
  const roomIdUsesAvailableList =
    path.value?.length === 1 &&
    path.value[0] === 'roomID' &&
    props.arrayItemIndex !== undefined &&
    Array.isArray(props.fullData?.booking?.rooms) &&
    ((availableRooms?.value?.length ?? 0) > 0 || hasOneOf)
  return hasEnum || hasOneOf || roomIdUsesAvailableList
})

const participatesInGuestPicker = computed(() => {
  if (!guestPickerAnchor) return false
  const p = path.value
  if (!Array.isArray(p) || p[0] !== 'guest' || p.length < 2) return false
  if (isSelect.value) return false
  if (schemaEntry.value?.type === 'array') return false
  return true
})

/** True when this control is roomID inside booking.rooms array — then we filter options and may disable until roomType set */
const isRoomIDInRoomsArray = computed(
  () =>
    path.value?.length === 1 &&
    path.value[0] === 'roomID' &&
    props.arrayItemIndex !== undefined &&
    Array.isArray(props.fullData?.booking?.rooms),
)

/** True when this control is roomType inside booking.rooms — changing type must clear roomID for that row */
const isRoomTypeInRoomsArray = computed(
  () =>
    path.value?.length === 1 &&
    path.value[0] === 'roomType' &&
    props.arrayItemIndex !== undefined &&
    Array.isArray(props.fullData?.booking?.rooms),
)

/**
 * When roomID in rooms array: disable until a concrete room type UUID is chosen.
 * `null` / empty means "not chosen" (including schema "any type" — do not list all rooms until a type is picked).
 */
const effectiveDisabled = computed(() => {
  if (branchDisabled.value) return true
  if (!isRoomIDInRoomsArray.value) return false
  const rt = props.modelValue?.roomType
  return rt == null || rt === ''
})

/** Build options for select from enum or oneOf. For roomID in booking.rooms: use injected availableRooms when present (from dates), else schema oneOf; then filter by roomType and exclude selected. */
const selectOptions = computed(() => {
  const entry = schemaEntry.value
  if (Array.isArray(entry?.enum)) {
    return entry.enum.map((v) => ({ value: v, label: resolveFormCatalogString(String(v)) }))
  }
  if (Array.isArray(entry?.oneOf) || isRoomIDInRoomsArray.value) {
    let oneOf = entry?.oneOf ?? []
    const rt = props.modelValue?.roomType
    const roomTypeUnset = isRoomIDInRoomsArray.value && (rt == null || rt === '')
    if (roomTypeUnset) {
      const nullOpts = oneOf.filter((o) => o.const == null || o.const === undefined)
      return nullOpts.map((opt) => ({
        value: opt.const ?? null,
        label: resolveFormCatalogString(opt.title ?? String(opt.const ?? '')),
      }))
    }
    if (isRoomIDInRoomsArray.value && availableRooms?.value?.length) {
      const nullOpt = oneOf.filter((o) => o.const == null)
      oneOf = buildRoomOneOfFromRooms(availableRooms.value, nullOpt.length ? nullOpt : undefined)
    }
    if (isRoomIDInRoomsArray.value && oneOf.length > 0) {
      return getFilteredRoomSelectOptions(
        props.fullData,
        props.modelValue,
        props.arrayItemIndex,
        oneOf,
      )
    }
    if (Array.isArray(entry?.oneOf)) {
      return entry.oneOf.map((opt) => ({
        value: opt.const,
        label: resolveFormCatalogString(opt.title ?? String(opt.const ?? '')),
      }))
    }
  }
  return []
})

const scopeStrForErrors = computed(
  () => props.errorScope || props.uischema.scope || '',
)
const errorMessage = computed(() => {
  const errs = props.errorsMap?.[scopeStrForErrors.value]
  return Array.isArray(errs) && errs.length > 0 ? errs[0] : null
})
</script>
