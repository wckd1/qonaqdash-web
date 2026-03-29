<template>
  <nav class="subnav" :aria-label="t('hotel.subnav_aria')">
    <router-link v-for="item in items" :key="item.to" :to="item.to" class="subnav__link">
      {{ item.label }}
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const items = computed(() => [
  { to: '/manage/hotel', label: t('hotel.tab_general') },
  { to: '/manage/rooms', label: t('hotel.tab_rooms') },
])
</script>
