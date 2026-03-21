<template>
  <!-- Swap row/column: arrows up-down vs left-right -->
  <svg v-if="horizontal" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="8 6 12 2 16 6" />
    <polyline points="16 18 12 22 8 18" />
    <line x1="12" y1="2" x2="12" y2="22" />
  </svg>
  <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="6 8 2 12 6 16" />
    <polyline points="18 16 22 12 18 8" />
    <line x1="2" y1="12" x2="22" y2="12" />
  </svg>
</template>

<script setup>
defineProps({
  horizontal: { type: Boolean, default: false },
})
</script>
