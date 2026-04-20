<template>
  <header class="page-header">
    <h1>{{ t('hotel.title') }}</h1>
    <button
      v-if="canCreateRooms"
      type="button"
      class="btn-add-outline"
      :aria-label="t('rooms.add_type_aria')"
      @click="openAddTypeDialog"
    >
      <svg
        class="btn-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      {{ t('rooms.add_type') }}
    </button>
  </header>

  <PropertySubNav />

  <SearchBar
    v-if="roomTypes.length"
    v-model="searchQuery"
    :placeholder="t('rooms.search_placeholder')"
    :aria-label="t('rooms.search_aria')"
    :searching="searching"
  />

  <section class="list-content">
    <div class="list-content__viewport">
      <p v-if="loadError" class="error-message">{{ loadError }}</p>
      <div v-else-if="initialLoading" class="loading-state">{{ t('common.loading') }}</div>
      <template v-else>
        <div v-if="!roomTypes.length && !searchQuery" class="empty-state-widget">
          <div class="empty-state-widget__icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
              <path d="M2 20h20" />
              <path d="M14 12v.01" />
            </svg>
          </div>
          <h3 class="empty-state-widget__title">{{ t('rooms.empty_title') }}</h3>
          <p class="empty-state-widget__description">{{ t('rooms.empty_description') }}</p>
          <div class="empty-state-widget__actions">
            <button v-if="canCreateRooms" type="button" class="primary" @click="openAddTypeDialog">
              {{ t('rooms.add_type') }}
            </button>
          </div>
        </div>
        <p v-else-if="!roomTypes.length && searchQuery" class="empty-state">
          {{ t('rooms.empty_search') }}
        </p>
        <div v-else class="accordion-list">
          <details
            v-for="rt in roomTypes"
            :key="rt.id"
            class="accordion"
            :open="!!searchQuery || expandedTypes.has(rt.id)"
          >
            <summary class="accordion-header">
              <span class="accordion-title">
                <strong>{{ rt.name }}</strong>
                <span v-if="rt.description" class="accordion-desc">{{ rt.description }}</span>
              </span>
              <div class="accordion-header-actions">
                <button
                  v-if="canManageRooms"
                  type="button"
                  class="btn-room-type-action"
                  :aria-label="t('common.edit')"
                  @click.stop="openEditTypeDialog(rt)"
                >
                  {{ t('common.edit') }}
                </button>
                <button
                  v-if="canManageRooms"
                  type="button"
                  class="btn-room-type-action btn-room-type-action--danger"
                  :aria-label="t('rooms.remove_type_aria', { name: rt.name })"
                  @click.stop="openRemoveTypeConfirm(rt)"
                >
                  {{ t('rooms.remove_type_from_catalog') }}
                </button>
                <button
                  v-if="canCreateRooms"
                  type="button"
                  class="btn-add-room"
                  :aria-label="t('rooms.add_room_aria', { name: rt.name })"
                  @click.stop="openAddRoomDialog(rt)"
                >
                  <svg
                    class="btn-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  {{ t('rooms.add_room') }}
                </button>
              </div>
            </summary>
            <div class="accordion-body">
              <table v-if="roomsByType(rt.id).length" class="list-table room-table" role="grid">
                <thead>
                  <tr>
                    <th scope="col">{{ t('fields.number') }}</th>
                    <th scope="col" class="col-status">{{ t('rooms.col_state') }}</th>
                    <th scope="col" class="list-table__col--actions"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="room in roomsByType(rt.id)"
                    :key="room.id"
                    class="room-row"
                    :class="{ 'room-row--selected': selectedRoom?.id === room.id }"
                    @click="openPanel(room)"
                  >
                    <td :data-label="t('fields.number')">{{ room.number }}</td>
                    <td :data-label="t('rooms.col_state')" class="col-status">
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
                    </td>
                    <td class="list-table__cell--actions">
                      <router-link
                        :to="{ name: 'room-detail', params: { id: room.id } }"
                        class="list-table__action"
                        @click.stop
                      >
                        {{ t('common.details') }}
                      </router-link>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p v-else class="room-list-empty">{{ t('rooms.empty_in_type') }}</p>
            </div>
          </details>
        </div>
      </template>
    </div>

    <RoomSidePanel
      :room="selectedRoom"
      :room-type="selectedRoomType"
      @close="closePanel"
      @cleaning="onCleaning"
      @maintenance="onMaintenance"
    />
  </section>

  <CleaningDialog
    :open="cleaningOpen"
    :room="selectedRoom"
    :allowed-statuses="cleaningStatuses"
    @close="cleaningOpen = false"
    @saved="cleaningOpen = false"
  />

  <MaintenanceDialog
    :open="maintenanceOpen"
    :room="selectedRoom"
    :allowed-statuses="maintenanceStatuses"
    @close="maintenanceOpen = false"
    @saved="maintenanceOpen = false"
  />

  <!-- Add room type dialog -->
  <div v-if="addTypeOpen" class="dialog-backdrop" @click.self="closeAddTypeDialog">
    <div class="dialog" role="dialog" aria-labelledby="add-type-title">
      <h2 id="add-type-title">{{ t('rooms.add_type_title') }}</h2>
      <form @submit.prevent="submitAddType">
        <label>
          {{ t('fields.name') }} <abbr class="required" :title="t('common.required')">*</abbr>
          <input
            ref="addTypeNameRef"
            v-model="addTypeForm.name"
            type="text"
            :placeholder="t('rooms.name_placeholder')"
            required
            :disabled="addTypeSaving"
          />
        </label>
        <label>
          {{ t('fields.description') }} <span class="optional">{{ t('common.optional') }}</span>
          <input
            v-model="addTypeForm.description"
            type="text"
            :placeholder="t('rooms.desc_placeholder')"
            :disabled="addTypeSaving"
          />
        </label>
        <div class="dialog-actions">
          <button type="button" class="btn-secondary" @click="closeAddTypeDialog">
            {{ t('common.cancel') }}
          </button>
          <button type="submit" :aria-busy="addTypeSaving" :disabled="addTypeSaving">
            {{ t('common.add') }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Edit room type dialog -->
  <div v-if="editTypeOpen" class="dialog-backdrop" @click.self="closeEditTypeDialog">
    <div class="dialog" role="dialog" aria-labelledby="edit-type-title">
      <h2 id="edit-type-title">{{ t('rooms.edit_type_title') }}</h2>
      <p v-if="editTypeError" class="form-error">{{ editTypeError }}</p>
      <form @submit.prevent="submitEditType">
        <label>
          {{ t('fields.name') }} <abbr class="required" :title="t('common.required')">*</abbr>
          <input
            v-model="editTypeForm.name"
            type="text"
            :placeholder="t('rooms.name_placeholder')"
            required
            :disabled="editTypeSaving"
          />
        </label>
        <label>
          {{ t('fields.description') }} <span class="optional">{{ t('common.optional') }}</span>
          <input
            v-model="editTypeForm.description"
            type="text"
            :placeholder="t('rooms.desc_placeholder')"
            :disabled="editTypeSaving"
          />
        </label>
        <div class="dialog-actions">
          <button type="button" class="btn-secondary" @click="closeEditTypeDialog">
            {{ t('common.cancel') }}
          </button>
          <button type="submit" :aria-busy="editTypeSaving" :disabled="editTypeSaving">
            {{ t('common.save') }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Add room dialog -->
  <div v-if="addRoomOpen" class="dialog-backdrop" @click.self="closeAddRoomDialog">
    <div class="dialog" role="dialog" aria-labelledby="add-room-title">
      <h2 id="add-room-title">
        {{ t('rooms.add_room_title', { name: addRoomType?.name ?? '' }) }}
      </h2>
      <form @submit.prevent="submitAddRoom">
        <label>
          {{ t('fields.room_number') }}
          <abbr class="required" :title="t('common.required')">*</abbr>
          <input
            ref="addRoomNumberRef"
            v-model="addRoomForm.number"
            type="text"
            :placeholder="t('rooms.number_placeholder')"
            required
            :disabled="addRoomSaving"
          />
        </label>
        <div class="dialog-actions">
          <button type="button" class="btn-secondary" @click="closeAddRoomDialog">
            {{ t('common.cancel') }}
          </button>
          <button type="submit" :aria-busy="addRoomSaving" :disabled="addRoomSaving">
            {{ t('common.add') }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="removeTypeConfirmOpen"
      class="dialog-backdrop"
      role="presentation"
      @click.self="closeRemoveTypeConfirm"
    >
      <div class="dialog" role="dialog" aria-modal="true" :aria-labelledby="removeTypeTitleId">
        <h2 :id="removeTypeTitleId">{{ t('rooms.confirm_remove_type_title') }}</h2>
        <p v-if="removeTypeError" class="form-error">{{ removeTypeError }}</p>
        <p class="rooms-confirm-body">
          {{ t('rooms.confirm_remove_type_body', { name: removeTypeTarget?.name ?? '' }) }}
        </p>
        <div class="dialog-actions">
          <button
            type="button"
            class="btn-secondary"
            :disabled="removeTypeSaving"
            @click="closeRemoveTypeConfirm"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="btn-room-type-action btn-room-type-action--danger"
            :disabled="removeTypeSaving"
            @click="confirmRemoveType"
          >
            {{ removeTypeSaving ? t('common.loading') : t('rooms.remove_type_from_catalog') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, watch, useId, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import PropertySubNav from '@/features/property/components/PropertySubNav.vue'
import RoomSidePanel from '@/features/property/components/RoomSidePanel.vue'
import CleaningDialog from '@/features/property/components/CleaningDialog.vue'
import MaintenanceDialog from '@/features/property/components/MaintenanceDialog.vue'
import SearchBar from '@/shared/components/SearchBar.vue'
import { usePropertyStore } from '@/features/property/stores/usePropertyStore'
import { useRoomActionAccess } from '@/features/property/composables/useRoomActionAccess'
import type { Room, RoomType } from '@/shared/types/property'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import { usePermissions } from '@/shared/composables/usePermissions'

const DEBOUNCE_MS = 300

const { t } = useI18n()
const store = usePropertyStore()
const { canCreateRooms, canManageRooms } = usePermissions()
const { cleaningStatuses, maintenanceStatuses } = useRoomActionAccess()
const { roomTypes, rooms } = storeToRefs(store)

const selectedRoom = ref<Room | null>(null)
const selectedRoomType = computed(() => {
  const r = selectedRoom.value
  if (!r) return null
  return roomTypes.value.find((rt) => rt.id === r.room_type_id) ?? null
})

const cleaningOpen = ref(false)
const maintenanceOpen = ref(false)

const removeTypeTitleId = useId()

const initialLoading = ref(true)
const searching = ref(false)
const loadError = ref('')
const searchQuery = ref('')

const addTypeOpen = ref(false)
const addTypeForm = ref({ name: '', description: '' })
const addTypeSaving = ref(false)

const editTypeOpen = ref(false)
const editTypeId = ref('')
const editTypeForm = ref({ name: '', description: '' })
const editTypeSaving = ref(false)
const editTypeError = ref('')

const removeTypeConfirmOpen = ref(false)
const removeTypeTarget = ref<RoomType | null>(null)
const removeTypeSaving = ref(false)
const removeTypeError = ref('')

const addRoomOpen = ref(false)
const addRoomType = ref<RoomType | null>(null)
const addRoomForm = ref({ number: '' })
const addRoomSaving = ref(false)
const expandedTypes = ref<Set<string>>(new Set())

const addTypeNameRef = ref<HTMLInputElement | null>(null)
const addRoomNumberRef = ref<HTMLInputElement | null>(null)

let searchDebounceId: ReturnType<typeof setTimeout> | null = null

function roomsByType(roomTypeId: string) {
  return rooms.value.filter((r) => r.room_type_id === roomTypeId)
}

function openPanel(room: Room) {
  selectedRoom.value = room
}

function closePanel() {
  selectedRoom.value = null
}

async function onCleaning() {
  const r = selectedRoom.value
  if (!r?.id) return
  const allowed = cleaningStatuses.value
  if (allowed.length === 1) {
    try {
      await store.changeRoomHousekeeping(r.id, allowed[0])
    } catch (err: unknown) {
      loadError.value = formatUnknownApiError(err) || t('rooms.load_failed')
    }
    return
  }
  cleaningOpen.value = true
}

async function onMaintenance() {
  const r = selectedRoom.value
  if (!r?.id) return
  const allowed = maintenanceStatuses.value
  if (allowed.length === 1 && allowed[0] !== 'under_maintenance') {
    try {
      await store.changeRoomMaintenance(r.id, { status: allowed[0] })
    } catch (err: unknown) {
      loadError.value = formatUnknownApiError(err) || t('rooms.load_failed')
    }
    return
  }
  maintenanceOpen.value = true
}

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

function openAddTypeDialog() {
  addTypeForm.value = { name: '', description: '' }
  addTypeOpen.value = true
  nextTick(() => addTypeNameRef.value?.focus())
}

function closeAddTypeDialog() {
  addTypeOpen.value = false
}

async function submitAddType() {
  if (!addTypeForm.value.name?.trim()) return
  addTypeSaving.value = true
  try {
    const created = await store.createRoomType(
      addTypeForm.value.name.trim(),
      addTypeForm.value.description?.trim() || '',
    )
    expandedTypes.value.add(created.id)
    closeAddTypeDialog()
  } catch {
    // Error surfaced by API client
  } finally {
    addTypeSaving.value = false
  }
}

function openEditTypeDialog(rt: RoomType) {
  editTypeId.value = rt.id
  editTypeForm.value = {
    name: rt.name,
    description: rt.description ?? '',
  }
  editTypeError.value = ''
  editTypeOpen.value = true
}

function closeEditTypeDialog() {
  editTypeOpen.value = false
  editTypeId.value = ''
  editTypeError.value = ''
}

async function submitEditType() {
  if (!editTypeForm.value.name?.trim() || !editTypeId.value) return
  editTypeSaving.value = true
  editTypeError.value = ''
  try {
    await store.updateRoomType(
      editTypeId.value,
      editTypeForm.value.name.trim(),
      editTypeForm.value.description?.trim() || '',
    )
    closeEditTypeDialog()
  } catch (err: unknown) {
    editTypeError.value = formatUnknownApiError(err) || t('rooms.load_failed')
  } finally {
    editTypeSaving.value = false
  }
}

function openRemoveTypeConfirm(rt: RoomType) {
  removeTypeTarget.value = rt
  removeTypeError.value = ''
  removeTypeConfirmOpen.value = true
}

function closeRemoveTypeConfirm() {
  removeTypeConfirmOpen.value = false
  removeTypeTarget.value = null
  removeTypeError.value = ''
}

async function confirmRemoveType() {
  const rt = removeTypeTarget.value
  if (!rt?.id) return
  removeTypeSaving.value = true
  removeTypeError.value = ''
  try {
    await store.deleteRoomType(rt.id)
    closeRemoveTypeConfirm()
  } catch (err: unknown) {
    removeTypeError.value = formatUnknownApiError(err) || t('rooms.load_failed')
  } finally {
    removeTypeSaving.value = false
  }
}

function openAddRoomDialog(rt: RoomType) {
  addRoomType.value = rt
  addRoomForm.value = { number: '' }
  addRoomOpen.value = true
  nextTick(() => addRoomNumberRef.value?.focus())
}

function closeAddRoomDialog() {
  addRoomOpen.value = false
  addRoomType.value = null
}

async function submitAddRoom() {
  if (!addRoomType.value || !addRoomForm.value.number?.trim()) return
  const typeId = addRoomType.value.id
  addRoomSaving.value = true
  try {
    await store.createRoom(typeId, addRoomForm.value.number.trim())
    expandedTypes.value.add(typeId)
    closeAddRoomDialog()
  } catch {
    // Error surfaced by API client
  } finally {
    addRoomSaving.value = false
  }
}

async function load(params: { q?: string } = {}, isInitial = false) {
  loadError.value = ''
  if (isInitial) {
    initialLoading.value = true
  } else {
    searching.value = true
  }
  try {
    await store.fetchRoomTypes(params)
    await store.fetchRooms(params)
  } catch (err: unknown) {
    loadError.value = formatUnknownApiError(err) || t('rooms.load_failed')
  } finally {
    initialLoading.value = false
    searching.value = false
  }
}

watch(
  rooms,
  () => {
    const sel = selectedRoom.value
    if (!sel) return
    const fresh = rooms.value.find((r) => r.id === sel.id)
    selectedRoom.value = fresh ?? null
  },
  { deep: true },
)

watch(searchQuery, (q) => {
  if (searchDebounceId) clearTimeout(searchDebounceId)
  searchDebounceId = setTimeout(() => {
    searchDebounceId = null
    load(q ? { q } : {})
  }, DEBOUNCE_MS)
})

onMounted(() => load({}, true))
</script>

<style scoped>
.rooms-confirm-body {
  margin: 0 0 var(--space-md);
  font-size: var(--text-body-size);
  color: var(--ink-secondary);
}

.room-state-chips {
  display: inline-flex;
  flex-wrap: nowrap;
  gap: var(--space-micro);
  white-space: nowrap;
}

.room-table td.col-status {
  width: 1%;
  white-space: nowrap;
}
</style>
