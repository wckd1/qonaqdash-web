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
        @click="setLocalValue(uischema.options.action.value)"
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
          :disabled="disabled"
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
import { computed } from 'vue'
import ArrayRenderer from './ArrayRenderer.vue'
import { scopeToPath, getValueByPath, setValueByPath, getSchemaEntry } from '../utils'

const props = defineProps({
  schema: { type: Object, default: () => ({}) },
  uischema: { type: Object, required: true },
  modelValue: { type: Object, default: () => ({}) },
  fullData: { type: Object, default: () => ({}) },
  errorsMap: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

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
  return (
    (Array.isArray(entry?.enum) && entry.enum.length > 0) ||
    (Array.isArray(entry?.oneOf) && entry.oneOf.length > 0)
  )
})

/** Build options for select from enum or oneOf. For oneOf with roomID, filter by roomType when implemented. */
const selectOptions = computed(() => {
  const entry = schemaEntry.value
  if (Array.isArray(entry?.enum)) {
    return entry.enum.map((v) => ({ value: v, label: String(v) }))
  }
  if (Array.isArray(entry?.oneOf)) {
    return entry.oneOf.map((opt) => ({
      value: opt.const,
      label: opt.title ?? String(opt.const ?? ''),
    }))
  }
  return []
})

const scopeStr = computed(() => props.uischema.scope || '')
const errorMessage = computed(() => {
  const errs = props.errorsMap?.[scopeStr.value]
  return Array.isArray(errs) && errs.length > 0 ? errs[0] : null
})
</script>
