<template>
  <search :class="{ 'has-value': modelValue && !searching }">
    <span class="search-bar-icon" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    </span>
    <input
      :value="modelValue"
      type="text"
      :placeholder="placeholder"
      :aria-label="ariaLabel"
      autocomplete="off"
      @input="onInput"
    />
    <span v-if="searching" class="search-bar-spinner-wrap" aria-hidden="true">
      <span class="search-bar-spinner"></span>
    </span>
    <button
      v-else-if="modelValue"
      type="button"
      class="search-bar-clear"
      :aria-label="t('common.clearSearch')"
      @click="emit('update:modelValue', '')"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </button>
  </search>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Search…' },
  ariaLabel: { type: String, default: 'Search' },
  searching: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

function onInput(e) {
  emit('update:modelValue', (e.target.value ?? '').trim())
}
</script>
