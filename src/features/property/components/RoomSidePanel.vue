<template>
  <Transition name="slide-panel">
    <aside v-if="room" class="side-panel" aria-labelledby="side-panel-title">
      <div class="side-panel-header">
        <h2 id="side-panel-title">{{ panelTitle }}</h2>
        <button
          type="button"
          class="side-panel-close"
          :aria-label="t('common.close_panel')"
          @click="emit('close')"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <div
        v-if="canCleaning || canMaintenance"
        class="action-toolbar"
        role="toolbar"
        :aria-label="t('rooms.panel_toolbar_aria')"
      >
        <button
          v-if="canCleaning"
          type="button"
          class="action-toolbar__btn action-toolbar__btn--check-out"
          @click="emit('cleaning')"
        >
          {{ t('rooms.action.cleaning') }}
        </button>
        <button
          v-if="canMaintenance"
          type="button"
          class="action-toolbar__btn action-toolbar__btn--check-out"
          @click="emit('maintenance')"
        >
          {{ t('rooms.action.maintenance') }}
        </button>
      </div>
      <div class="side-panel-body">
        <dl class="side-panel-dl">
          <dt>{{ t('fields.room_type') }}</dt>
          <dd>{{ roomType?.name ?? '—' }}</dd>
          <dt>{{ t('fields.status') }}</dt>
          <dd>
            <div class="room-state-chips">
              <span
                class="room-status-badge"
                :class="availabilityBadgeClass(room.availability_status)"
                >{{ availabilityLabel(room.availability_status) }}</span
              >
              <span
                class="room-status-badge"
                :class="housekeepingBadgeClass(room.housekeeping_status)"
                >{{ housekeepingLabel(room.housekeeping_status) }}</span
              >
              <span
                v-if="showMaintenanceBadge(room.maintenance_status)"
                class="room-status-badge"
                :class="maintenanceBadgeClass(room.maintenance_status)"
                >{{ maintenanceLabel(room.maintenance_status) }}</span
              >
            </div>
          </dd>
          <template
            v-if="room.maintenance_status === 'under_maintenance' && room.maintenance_planned_end"
          >
            <dt>{{ t('rooms.fields.planned_end') }}</dt>
            <dd>{{ formatDateTime(room.maintenance_planned_end) }}</dd>
          </template>
        </dl>
      </div>
      <div class="side-panel-footer">
        <router-link
          :to="{ name: 'room-detail', params: { id: room.id } }"
          class="btn-open-full-page"
        >
          {{ t('common.open_full_page') }}
        </router-link>
      </div>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoomActionAccess } from '@/features/property/composables/useRoomActionAccess'
import type { Room, RoomType } from '@/shared/types/property'

const { t } = useI18n()
const { canCleaning, canMaintenance } = useRoomActionAccess()

const props = defineProps<{
  room: Room | null
  roomType: RoomType | null
}>()

const emit = defineEmits<{
  close: []
  cleaning: []
  maintenance: []
}>()

const panelTitle = computed(() => {
  const r = props.room
  if (!r) return ''
  const typeName = props.roomType?.name ?? ''
  return typeName
    ? t('rooms.detail_title_with_type', { number: r.number, type: typeName })
    : t('rooms.detail_title', { number: r.number })
})

function availabilityLabel(v: string | undefined) {
  if (!v) return '—'
  return t(`rooms.availability_status.${v}`, v)
}

function housekeepingLabel(v: string | undefined) {
  if (!v) return '—'
  return t(`rooms.housekeeping_status.${v}`, v)
}

function maintenanceLabel(v: string | undefined) {
  if (!v) return '—'
  return t(`rooms.maintenance_status.${v}`, v)
}

function showMaintenanceBadge(v: string | undefined) {
  return !!v && v !== 'none'
}

function availabilityBadgeClass(v: string | undefined): string {
  return `room-status-badge--availability-${v ?? 'available'}`
}

function housekeepingBadgeClass(v: string | undefined): string {
  return `room-status-badge--housekeeping-${v ?? 'clean'}`
}

function maintenanceBadgeClass(v: string | undefined): string {
  return `room-status-badge--maintenance-${v ?? 'none'}`
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}
</script>

<style scoped>
.room-state-chips {
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--space-micro);
}
</style>
