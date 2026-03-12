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
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  border-left: 4px solid;
  font-size: 0.875rem;
}

.toast--error {
  border-left-color: var(--color-red, #e57373);
  background: #fef2f2;
}

.toast--success {
  border-left-color: var(--color-green, #4caf50);
  background: #f0fdf4;
}

.toast--info {
  border-left-color: var(--color-teal, #2a9d8f);
  background: #f0fdfa;
}

.toast-message {
  flex: 1;
  color: #1a2332;
}

.toast-close {
  all: unset;
  cursor: pointer;
  font-size: 1.25rem;
  color: #9ca3af;
  line-height: 1;
  padding: 0.125rem 0.25rem;
  border-radius: 4px;
}

.toast-close:hover {
  color: #4b5563;
  background: rgba(0, 0, 0, 0.05);
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
