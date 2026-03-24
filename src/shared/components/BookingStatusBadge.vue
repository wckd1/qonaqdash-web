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

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { normalizeBookingStatus } from '@/features/bookings/bookingStatus'

const props = defineProps({
  /** API status: confirmed | checked_in | checked_out | canceled */
  status: { type: String, default: '' },
})

const { t, te } = useI18n()

const label = computed(() => {
  const raw = (props.status || '').trim()
  const n = normalizeBookingStatus(raw)
  if (n) {
    const path = `bookings.statusChip.${n}`
    if (te(path)) return t(path)
  }
  return raw || '—'
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
