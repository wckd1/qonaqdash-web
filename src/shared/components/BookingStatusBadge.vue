<template>
  <span
    v-if="status"
    class="status-chip"
    :class="chipClass"
    :aria-label="label"
  >
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** API status: confirmed | checked_in | checked_out | canceled */
  status: { type: String, default: '' },
})

const label = computed(() => {
  const s = (props.status || '').toLowerCase()
  if (s === 'confirmed') return 'Confirmed'
  if (s === 'checked_in') return 'Checked in'
  if (s === 'checked_out') return 'Checked out'
  if (s === 'canceled' || s === 'cancelled') return 'Canceled'
  return props.status || '—'
})

const chipClass = computed(() => {
  const s = (props.status || '').toLowerCase().replace(/_/g, '-')
  if (s === 'confirmed') return 'status-chip--confirmed'
  if (s === 'checked-in') return 'status-chip--checked-in'
  if (s === 'checked-out') return 'status-chip--checked-out'
  if (s === 'canceled' || s === 'cancelled') return 'status-chip--canceled'
  return ''
})
</script>
