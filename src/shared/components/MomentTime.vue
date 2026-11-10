<template>
  <time v-if="text" class="moment-time" :datetime="String(value)" :title="hint || undefined"
    >{{ text }}{{ zone ? ' ' : ''
    }}<span v-if="zone" class="moment-time__zone">{{ zone }}</span></time
  >
  <template v-else>{{ empty }}</template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHotelTime } from '@/shared/composables/useHotelTime'
import { MEDIUM_DATE, SHORT_DATE_TIME } from '@/shared/lib/moment'

/**
 * A moment on the hotel clock. When the browser clock shows another time, the
 * hotel zone label follows the time and the employee's own time is on hover.
 */
const props = withDefaults(
  defineProps<{
    /** RFC 3339 moment. */
    value: string | null | undefined
    /** Only the date of the hotel (`Mar 5, 2026`); otherwise date and time (`3/5/26, 2:30 PM`). */
    dateOnly?: boolean
    /** Text for no value. */
    empty?: string
  }>(),
  { dateOnly: false, empty: '' },
)

const { t } = useI18n()
const { formatMoment, zoneLabel, employeeTime } = useHotelTime()

const text = computed(() =>
  formatMoment(props.value, props.dateOnly ? MEDIUM_DATE : SHORT_DATE_TIME),
)
const zone = computed(() => (props.dateOnly ? '' : zoneLabel(props.value)))
const hint = computed(() => {
  const own = employeeTime(props.value)
  return own ? t('time.employee_time', { time: own }) : ''
})
</script>

<style scoped>
.moment-time__zone {
  font-size: var(--text-caption-size);
  font-weight: var(--text-caption-weight);
  color: var(--ink-muted);
  white-space: nowrap;
}

.moment-time[title] .moment-time__zone {
  cursor: help;
  text-decoration: underline dotted;
  text-underline-offset: 0.2em;
}
</style>
