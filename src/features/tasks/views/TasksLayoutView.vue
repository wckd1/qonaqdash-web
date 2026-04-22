<template>
  <header class="page-header">
    <h1>{{ t('page_title.tasks') }}</h1>
  </header>
  <TasksSubNav />
  <router-view />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TasksSubNav from '@/features/tasks/components/TasksSubNav.vue'

const { t } = useI18n()
</script>
