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
import { usePermissions } from '@/shared/composables/usePermissions'

const { t } = useI18n()
const { canAccessHotelGeneral, canAccessRooms, canManageOccupations } = usePermissions()

const items = computed(() =>
  [
    canAccessHotelGeneral.value ? { to: '/manage/hotel', label: t('hotel.tab_general') } : null,
    canAccessRooms.value ? { to: '/manage/rooms', label: t('hotel.tab_rooms') } : null,
    canManageOccupations.value
      ? { to: '/manage/hotel/occupations', label: t('hotel.tab_occupations') }
      : null,
  ].filter((item): item is { to: string; label: string } => item !== null),
)
</script>
