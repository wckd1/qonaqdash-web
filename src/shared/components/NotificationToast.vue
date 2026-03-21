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
        <button type="button" class="toast-close" @click="dismiss(n.id)" :aria-label="t('common.dismissToast')">
          &times;
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useNotification } from '@/shared/composables/useNotification'

const { t } = useI18n()
const { notifications, dismiss } = useNotification()
</script>
