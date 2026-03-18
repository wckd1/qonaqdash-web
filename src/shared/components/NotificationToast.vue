<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="n in notifications"
        :key="n.id"
        class="toast"
        :class="`toast--${n.type}`"
      >
        <span class="toast-message">{{ n.message }}</span>
        <button class="toast-close" @click="dismiss(n.id)" aria-label="Dismiss">&times;</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useNotification } from '@/shared/composables/useNotification'

const { notifications, dismiss } = useNotification()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: var(--space-md);
  right: var(--space-md);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-lg);
  background: var(--surface-1);
  box-shadow: var(--shadow-md);
  border-left: 2px solid;
  font-size: var(--text-body-size);
}

.toast--error {
  border-left-color: var(--semantic-error);
  background: var(--semantic-error-bg);
}

.toast--success {
  border-left-color: var(--semantic-success);
  background: var(--semantic-success-bg);
}

.toast--info {
  border-left-color: var(--semantic-info);
  background: var(--semantic-info-bg);
}

.toast-message {
  flex: 1;
  color: var(--ink-primary);
}

.toast-close {
  all: unset;
  cursor: pointer;
  font-size: var(--text-body-size);
  color: var(--ink-muted);
  line-height: 1;
  padding: var(--space-micro) var(--space-xs);
  border-radius: var(--radius-sm);
}

.toast-close:hover {
  color: var(--ink-secondary);
  background: var(--surface-2);
}

.toast-enter-active {
  transition: all 0.3s ease;
}

.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
