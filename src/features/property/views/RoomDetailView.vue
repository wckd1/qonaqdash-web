<template>
  <header class="page-header">
    <h1>{{ headerTitle }}</h1>
    <div v-if="room && canManageRooms && !editing" class="page-header-actions">
      <button
        type="button"
        class="btn-secondary room-detail-delete-btn"
        :disabled="deleteSaving"
        @click="openDeleteConfirm"
      >
        {{ t('rooms.remove_room_from_catalog') }}
      </button>
      <button type="button" class="btn-secondary" @click="startEdit">
        {{ t('common.edit') }}
      </button>
    </div>
    <div v-else-if="room && canManageRooms && editing" class="page-header-actions">
      <button type="button" :disabled="editSaving" @click="onSave">
        {{ editSaving ? t('common.saving') : t('common.save') }}
      </button>
      <button type="button" class="btn-secondary" :disabled="editSaving" @click="cancelEdit">
        {{ t('common.cancel') }}
      </button>
    </div>
  </header>

  <p v-if="loadError" class="error-message">{{ loadError }}</p>
  <p v-else-if="notFound" class="error-message">
    {{ t('rooms.not_found') }}
    <router-link :to="{ name: 'rooms' }" class="inline-link">
      {{ t('rooms.back_to_list') }}
    </router-link>
  </p>
  <template v-else-if="room">
    <div
      v-if="!editing && (canCleaning || canMaintenance || canManageRooms)"
      class="action-toolbar action-toolbar--inset"
      role="toolbar"
      :aria-label="t('rooms.panel_toolbar_aria')"
    >
      <button
        v-if="canCleaning"
        type="button"
        class="action-toolbar__btn action-toolbar__btn--check-out"
        :disabled="axisSaving"
        @click="openCleaningDialog"
      >
        {{ t('rooms.action.cleaning') }}
      </button>
      <button
        v-if="canMaintenance"
        type="button"
        class="action-toolbar__btn action-toolbar__btn--check-out"
        :disabled="axisSaving"
        @click="openMaintenanceDialog"
      >
        {{ t('rooms.action.maintenance') }}
      </button>
      <button
        v-if="canManageRooms"
        type="button"
        class="action-toolbar__btn action-toolbar__btn--check-out"
        :disabled="axisSaving"
        @click="toggleAvailability"
      >
        {{
          room.availability_status === 'ooo'
            ? t('rooms.availability_action.mark_available')
            : t('rooms.availability_action.mark_ooo')
        }}
      </button>
    </div>

    <p v-if="roomError" class="form-error">{{ roomError }}</p>
    <p v-if="editError" class="form-error">{{ editError }}</p>

    <div class="room-detail-body">
      <section class="panel room-detail-section room-detail-section--summary">
        <dl v-if="!editing" class="side-panel-dl">
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
        <form v-else class="room-detail-edit" @submit.prevent="onSave">
          <label>
            {{ t('fields.room_number') }}
            <abbr class="required" :title="t('common.required')">*</abbr>
            <input v-model="editForm.number" type="text" required :disabled="editSaving" />
          </label>
          <label>
            {{ t('fields.room_type') }}
            <abbr class="required" :title="t('common.required')">*</abbr>
            <select v-model="editForm.room_type_id" required :disabled="editSaving">
              <option v-for="opt in roomTypes" :key="opt.id" :value="opt.id">
                {{ opt.name }}
              </option>
            </select>
          </label>
        </form>
      </section>

      <section
        class="panel room-detail-section room-detail-section--activity"
        aria-labelledby="room-activity-heading"
      >
        <h2 id="room-activity-heading" class="room-detail-section__title">
          {{ t('rooms.activity.title') }}
        </h2>
        <p v-if="activityError" class="form-error">{{ activityError }}</p>
        <p v-else-if="activityLoading" class="empty-state">{{ t('common.loading') }}</p>
        <p v-else-if="!activityEntries.length" class="empty-state">
          {{ t('rooms.activity.empty') }}
        </p>
        <ul v-else class="room-activity__list">
          <li v-for="entry in activityEntries" :key="entry.event_id" class="room-activity__item">
            <span class="room-activity__title">{{ activityTitle(entry) }}</span>
            <span class="room-activity__meta">{{ formatDateTime(entry.occurred_at) }}</span>
          </li>
        </ul>
      </section>
    </div>
  </template>
  <div v-else class="loading-state">{{ t('common.loading') }}</div>

  <CleaningDialog
    :open="cleaningOpen"
    :room="room"
    :allowed-statuses="cleaningStatuses"
    @close="cleaningOpen = false"
    @saved="onAxisSaved"
  />

  <MaintenanceDialog
    :open="maintenanceOpen"
    :room="room"
    :allowed-statuses="maintenanceStatuses"
    @close="maintenanceOpen = false"
    @saved="onAxisSaved"
  />

  <!-- Delete confirm dialog -->
  <Teleport to="body">
    <div
      v-if="deleteOpen"
      class="dialog-backdrop"
      role="presentation"
      @click.self="closeDeleteConfirm"
    >
      <div class="dialog" role="dialog" aria-modal="true" :aria-labelledby="deleteTitleId">
        <h2 :id="deleteTitleId">{{ t('rooms.confirm_remove_room_title') }}</h2>
        <p v-if="deleteError" class="form-error">{{ deleteError }}</p>
        <p class="rooms-confirm-body">
          {{ t('rooms.confirm_remove_room_body', { number: room?.number ?? '' }) }}
        </p>
        <div class="dialog-actions">
          <button
            type="button"
            class="btn-secondary"
            :disabled="deleteSaving"
            @click="closeDeleteConfirm"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="btn-room-type-action btn-room-type-action--danger"
            :disabled="deleteSaving"
            @click="confirmDelete"
          >
            {{ deleteSaving ? t('common.loading') : t('rooms.remove_room_from_catalog') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import CleaningDialog from '@/features/property/components/CleaningDialog.vue'
import MaintenanceDialog from '@/features/property/components/MaintenanceDialog.vue'
import { usePropertyStore } from '@/features/property/stores/usePropertyStore'
import { useRoomActionAccess } from '@/features/property/composables/useRoomActionAccess'
import { usePermissions } from '@/shared/composables/usePermissions'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import { httpErrorResponse } from '@/shared/unknownError'
import { formatDocumentTitle } from '@/shared/i18n/documentTitle'
import type { Room, RoomActivityEntry, RoomAvailabilityStatus } from '@/shared/types/property'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const store = usePropertyStore()
const { canManageRooms } = usePermissions()
const { cleaningStatuses, maintenanceStatuses, canCleaning, canMaintenance } = useRoomActionAccess()
const { roomTypes, rooms } = storeToRefs(store)

const deleteTitleId = useId()

const loadError = ref('')
const notFound = ref(false)
const roomError = ref('')
const axisSaving = ref(false)

const activityEntries = ref<RoomActivityEntry[]>([])
const activityLoading = ref(false)
const activityError = ref('')

const cleaningOpen = ref(false)
const maintenanceOpen = ref(false)

const editing = ref(false)
const editForm = ref({ room_type_id: '', number: '' })
const editSaving = ref(false)
const editError = ref('')

const deleteOpen = ref(false)
const deleteSaving = ref(false)
const deleteError = ref('')

const roomId = computed(() => {
  const id = route.params.id
  if (typeof id === 'string' && id) return id
  if (Array.isArray(id) && id[0]) return id[0]
  return null
})

const room = computed<Room | null>(() => {
  const id = roomId.value
  if (!id) return null
  return rooms.value.find((r) => r.id === id) ?? null
})

const roomType = computed(() => {
  const r = room.value
  if (!r) return null
  return roomTypes.value.find((t) => t.id === r.room_type_id) ?? null
})

const headerTitle = computed(() => {
  const r = room.value
  if (!r) return t('page_title.room')
  const typeName = roomType.value?.name ?? ''
  return typeName
    ? t('rooms.detail_title_with_type', { number: r.number, type: typeName })
    : t('rooms.detail_title', { number: r.number })
})

async function ensureLists() {
  try {
    await store.fetchRoomTypes()
    await store.fetchRooms()
  } catch (err: unknown) {
    loadError.value = formatUnknownApiError(err) || t('rooms.load_failed')
  }
}

async function loadRoom() {
  const id = roomId.value
  if (!id) return
  loadError.value = ''
  notFound.value = false
  try {
    await ensureLists()
    if (!room.value) {
      await store.refreshRoom(id)
    }
  } catch (err: unknown) {
    if (httpErrorResponse(err)?.status === 404) {
      notFound.value = true
    } else {
      loadError.value = formatUnknownApiError(err) || t('rooms.load_failed')
    }
  }
}

async function loadActivity() {
  const id = roomId.value
  if (!id) return
  activityLoading.value = true
  activityError.value = ''
  try {
    activityEntries.value = await store.fetchRoomActivity(id)
  } catch (err: unknown) {
    activityError.value = formatUnknownApiError(err) || t('rooms.load_failed')
  } finally {
    activityLoading.value = false
  }
}

watch(
  () => roomId.value,
  async (id) => {
    if (!id) return
    await loadRoom()
    if (!notFound.value && !loadError.value) {
      await loadActivity()
    }
  },
  { immediate: true },
)

watch(
  [headerTitle, locale],
  () => {
    document.title = formatDocumentTitle(headerTitle.value)
  },
  { immediate: true },
)

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

function activityTitle(entry: RoomActivityEntry): string {
  const payload = (entry.payload ?? {}) as Record<string, unknown>
  const readString = (key: string) =>
    typeof payload[key] === 'string' ? (payload[key] as string) : ''

  switch (entry.event_type) {
    case 'RoomAvailabilityChanged':
      return t('rooms.activity.status_changed', {
        value: availabilityLabel(readString('availability')),
      })
    case 'RoomHousekeepingChanged':
      return t('rooms.activity.status_changed', {
        value: housekeepingLabel(readString('housekeeping')),
      })
    case 'RoomMaintenanceChanged':
      return t('rooms.activity.status_changed', {
        value: maintenanceLabel(readString('maintenance')),
      })
    case 'RoomMaintenancePlannedEndChanged':
      return t('rooms.activity.planned_end_changed', {
        value: formatDateTime(readString('planned_end')),
      })
    default:
      return t(`rooms.activity.event.${entry.event_type}`, entry.event_type)
  }
}

async function toggleAvailability() {
  const r = room.value
  if (!r?.id) return
  const next: RoomAvailabilityStatus = r.availability_status === 'ooo' ? 'available' : 'ooo'
  axisSaving.value = true
  roomError.value = ''
  try {
    await store.changeRoomAvailability(r.id, next)
    await loadActivity()
  } catch (err: unknown) {
    roomError.value = formatUnknownApiError(err) || t('rooms.load_failed')
  } finally {
    axisSaving.value = false
  }
}

async function openCleaningDialog() {
  const r = room.value
  if (!r?.id) return
  const allowed = cleaningStatuses.value
  if (allowed.length === 1) {
    axisSaving.value = true
    roomError.value = ''
    try {
      await store.changeRoomHousekeeping(r.id, allowed[0])
      await loadActivity()
    } catch (err: unknown) {
      roomError.value = formatUnknownApiError(err) || t('rooms.load_failed')
    } finally {
      axisSaving.value = false
    }
    return
  }
  cleaningOpen.value = true
}

async function openMaintenanceDialog() {
  const r = room.value
  if (!r?.id) return
  const allowed = maintenanceStatuses.value
  if (allowed.length === 1 && allowed[0] !== 'under_maintenance') {
    axisSaving.value = true
    roomError.value = ''
    try {
      await store.changeRoomMaintenance(r.id, { status: allowed[0] })
      await loadActivity()
    } catch (err: unknown) {
      roomError.value = formatUnknownApiError(err) || t('rooms.load_failed')
    } finally {
      axisSaving.value = false
    }
    return
  }
  maintenanceOpen.value = true
}

async function onAxisSaved() {
  cleaningOpen.value = false
  maintenanceOpen.value = false
  await loadActivity()
}

function startEdit() {
  const r = room.value
  if (!r) return
  editForm.value = { room_type_id: r.room_type_id, number: r.number }
  editError.value = ''
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  editError.value = ''
}

async function onSave() {
  const r = room.value
  if (!r?.id) return
  const { room_type_id, number } = editForm.value
  if (!number?.trim() || !room_type_id) return
  editSaving.value = true
  editError.value = ''
  try {
    await store.updateRoom(r.id, { room_type_id, number: number.trim() })
    editing.value = false
  } catch (err: unknown) {
    editError.value = formatUnknownApiError(err) || t('rooms.load_failed')
  } finally {
    editSaving.value = false
  }
}

function openDeleteConfirm() {
  deleteError.value = ''
  deleteOpen.value = true
}

function closeDeleteConfirm() {
  deleteOpen.value = false
  deleteError.value = ''
}

async function confirmDelete() {
  const r = room.value
  if (!r?.id) return
  deleteSaving.value = true
  deleteError.value = ''
  try {
    await store.deleteRoom(r.id)
    deleteOpen.value = false
    router.push({ name: 'rooms' })
  } catch (err: unknown) {
    deleteError.value = formatUnknownApiError(err) || t('rooms.load_failed')
  } finally {
    deleteSaving.value = false
  }
}
</script>

<style scoped>
.room-detail-body {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding-bottom: var(--space-md);
  box-sizing: border-box;
}

.room-detail-section {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.room-detail-section--summary {
  flex: 0 0 auto;
  width: 100%;
}

.room-detail-section--activity {
  flex: auto;
  min-width: 0;
  min-height: 0;
  width: 100%;
}

.room-detail-section__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-lg);
}

.room-state-chips {
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--space-micro);
}

.room-detail-edit {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.room-detail-edit label {
  display: block;
}

.room-activity__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.room-activity__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--border-subtle);
}

.room-activity__item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.room-activity__item:first-child {
  padding-top: 0;
}

.room-activity__title {
  font-size: var(--text-body-size);
  font-weight: var(--text-label-weight);
  color: var(--ink-primary);
}

.room-activity__meta {
  font-size: var(--text-caption-size);
  color: var(--ink-tertiary);
}

.rooms-confirm-body {
  margin: 0 0 var(--space-md);
  font-size: var(--text-body-size);
  color: var(--ink-secondary);
}

.inline-link {
  color: var(--brand-primary);
  margin-left: var(--space-xs);
}

.error-message {
  color: var(--semantic-error);
  font-size: var(--text-body-size);
  margin: 0;
}

.loading-state {
  color: var(--ink-tertiary);
  font-size: var(--text-body-size);
  margin: 0;
}
</style>
