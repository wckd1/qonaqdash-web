<template>
  <nav class="subnav" :aria-label="t('tasks.subnav_aria')">
    <router-link v-for="item in items" :key="item.to" :to="item.to" class="subnav__link">
      {{ item.label }}
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePermissions } from '@/shared/composables/usePermissions'

const { t } = useI18n()
const { canAccessHousekeepingTasks, canAccessMaintenanceTasks } = usePermissions()

const items = computed(() =>
  [
    canAccessHousekeepingTasks.value
      ? { to: '/tasks/housekeeping', label: t('tasks.tab_housekeeping') }
      : null,
    canAccessMaintenanceTasks.value
      ? { to: '/tasks/maintenance', label: t('tasks.tab_maintenance') }
      : null,
  ].filter((item): item is { to: string; label: string } => item !== null),
)
</script>
