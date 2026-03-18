<template>
  <div class="booking-form-view">
    <header class="page-header">
      <h1 class="page-title">New booking</h1>
    </header>
    <p class="placeholder-text">The form to create a new booking will be available in P5 with JSONForm renderer.</p>
  </div>
</template>

<script setup>
</script>

<style scoped>
.booking-form-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.page-header {
  margin: 0;
}

.page-title {
  font-family: var(--font-display);
  font-size: var(--text-heading-size);
  font-weight: var(--text-heading-weight);
  letter-spacing: var(--text-heading-tracking);
  color: var(--ink-primary);
  margin: 0;
}

.placeholder-text {
  color: var(--ink-tertiary);
  font-size: var(--text-body-size);
  margin: 0;
}
</style>
