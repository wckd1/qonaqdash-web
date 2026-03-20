<template>
  <template v-if="schemaEntry?.type === 'array'">
    <div class="form-edit-control form-edit-control--full-width">
      <ArrayRenderer
        :schema="schema"
        :uischema="uischema"
        :model-value="modelValue"
        :errors-map="errorsMap"
        :disabled="disabled"
        @update:model-value="emit('update:modelValue', $event)"
      />
    </div>
  </template>

  <template v-else-if="uischema.options?.action">
    <div class="form-edit-control form-edit-control--full-width">
      <button
        type="button"
        :disabled="disabled"
        @click="onActionClick"
      >
        {{ uischema.options.action.label }}
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
          :disabled="disabled"
          :placeholder="placeholder"
          autocomplete="off"
          @input="onInput"
        />
        <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
      </div>
    </div>
  </template>
</template>

<script setup>
import { computed, inject } from 'vue'
import ArrayRenderer from './ArrayRenderer.vue'
import {
  scopeToPath,
  getValueByPath,
  setValueByPath,
  getSchemaEntry,
  getDefaultObjectFromSchema,
  getFilteredRoomSelectOptions,
  buildRoomOneOfFromRooms,
} from '../utils'

const props = defineProps({
  schema: { type: Object, default: () => ({}) },
  uischema: { type: Object, required: true },
  modelValue: { type: Object, default: () => ({}) },
  fullData: { type: Object, default: () => ({}) },
  /** When inside ArrayRenderer (e.g. booking.rooms), index of current item for roomID filtering */
  arrayItemIndex: { type: Number, default: undefined },
  errorsMap: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

/** When provided by BookingFormView: rooms loaded from GET /api/property/rooms/available when checkIn/checkOut change */
const availableRooms = inject('availableRooms', null)

const path = computed(() => scopeToPath(props.uischema.scope))
const schemaEntry = computed(() => getSchemaEntry(props.schema, path.value))
const label = computed(
  () =>
    props.uischema.label ||
    schemaEntry.value?.title ||
    path.value?.join('.') ||
    '',
)
const inputId = computed(() => `jsonform-edit-${path.value?.join('-') || 'ctrl'}`)
const placeholder = computed(() => schemaEntry.value?.title ?? '')

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
  }
  setLocalValue(v)
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

function onSelectChange(e) {
  const raw = e.target.value
  if (raw === '' && isRoomIDInRoomsArray.value) {
    setLocalValue(null)
    return
  }
  if (isSelectOptionNull(raw)) {
    setLocalValue(null)
    return
  }
  if (inputType.value === 'number') {
    const n = raw === '' ? undefined : Number(raw)
    setLocalValue(Number.isNaN(n) ? raw : n)
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
    (availableRooms?.value?.length > 0 || hasOneOf)
  return hasEnum || hasOneOf || roomIdUsesAvailableList
})

/** True when this control is roomID inside booking.rooms array — then we filter options and may disable until roomType set */
const isRoomIDInRoomsArray = computed(
  () =>
    path.value?.length === 1 &&
    path.value[0] === 'roomID' &&
    props.arrayItemIndex !== undefined &&
    Array.isArray(props.fullData?.booking?.rooms),
)

/**
 * When roomID in rooms array: disable until roomType is chosen.
 * roomType may be oneOf with `const: null` ("Любой"); null is a valid choice — do not treat it as unset.
 */
const effectiveDisabled = computed(() => {
  if (props.disabled) return true
  if (!isRoomIDInRoomsArray.value) return false
  const rt = props.modelValue?.roomType
  if (rt === undefined || rt === '') return true
  return false
})

/** Build options for select from enum or oneOf. For roomID in booking.rooms: use injected availableRooms when present (from dates), else schema oneOf; then filter by roomType and exclude selected. */
const selectOptions = computed(() => {
  const entry = schemaEntry.value
  if (Array.isArray(entry?.enum)) {
    return entry.enum.map((v) => ({ value: v, label: String(v) }))
  }
  if (Array.isArray(entry?.oneOf) || isRoomIDInRoomsArray.value) {
    let oneOf = entry?.oneOf ?? []
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
        label: opt.title ?? String(opt.const ?? ''),
      }))
    }
  }
  return []
})

const scopeStr = computed(() => props.uischema.scope || '')
const errorMessage = computed(() => {
  const errs = props.errorsMap?.[scopeStr.value]
  return Array.isArray(errs) && errs.length > 0 ? errs[0] : null
})
</script>
