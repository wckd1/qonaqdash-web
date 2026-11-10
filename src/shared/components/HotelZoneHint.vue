<template>
  <span v-if="zone" class="hotel-zone-hint" :title="hint || undefined">
    {{ t('time.hotel_time', { zone }) }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHotelTime } from '@/shared/composables/useHotelTime'

/**
 * Next to a date-time input: the time is entered on the hotel clock. Shown only
 * when the browser clock differs; the entered moment on the employee's clock is on hover.
 */
const props = defineProps<{
  /** The moment in the input (RFC 3339); the label is for now without one. */
  value?: string | null
}>()

const { t } = useI18n()
const { zoneLabel, employeeTime } = useHotelTime()

const zone = computed(() => zoneLabel(props.value))
const hint = computed(() => {
  const own = employeeTime(props.value)
  return own ? t('time.employee_time', { time: own }) : ''
})
</script>

<style scoped>
.hotel-zone-hint {
  display: inline-block;
  margin-top: var(--space-xs);
  font-size: var(--text-caption-size);
  font-weight: var(--text-caption-weight);
  color: var(--ink-muted);
}

.hotel-zone-hint[title] {
  cursor: help;
  text-decoration: underline dotted;
  text-underline-offset: 0.2em;
}
</style>
