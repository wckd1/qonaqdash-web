<template>
  <div class="not-found">
    <h1 class="not-found-title">403</h1>
    <p class="not-found-message">{{ t('forbidden.message') }}</p>
    <router-link :to="{ name: homeRouteName }" class="not-found-link">
      {{ t('forbidden.link') }}
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { usePermissions } from '@/shared/composables/usePermissions'

const { t } = useI18n()
const { homeRouteName } = usePermissions()
</script>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  text-align: center;
}

.not-found-title {
  font-family: var(--font-display);
  font-size: 3rem;
  font-weight: var(--text-heading-weight);
  color: var(--ink-tertiary);
  margin: 0;
  line-height: 1;
}

.not-found-message {
  font-size: var(--text-body-size);
  color: var(--ink-secondary);
  margin: 0;
}

.not-found-link {
  font-size: var(--text-body-size);
  font-weight: var(--text-label-weight);
  color: var(--brand-primary);
  text-decoration: none;
}

.not-found-link:hover {
  text-decoration: underline;
}
</style>
