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
                    <th scope="col" class="col-status">{{ t('fields.status') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="room in roomsByType(rt.id)"
                    :key="room.id"
                    class="room-row"
                    :class="{ 'room-row--selected': selectedRoom?.room?.id === room.id }"
                    @click="openPanel(room, rt)"
                  >
                    <td :data-label="t('fields.number')">{{ room.number }}</td>
                    <td :data-label="t('fields.status')" class="col-status">
                      <span
                        v-if="room.status"
                        class="room-status-badge"
                        :class="statusBadgeClass(room.status)"
                        >{{ roomStatusLabel(room.status) }}</span
                      >
                      <span v-else class="room-status-empty">—</span>
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

    <Transition name="slide-panel">
      <aside v-if="selectedRoom" class="side-panel" aria-labelledby="side-panel-title">
        <div class="side-panel-header">
          <h2 id="side-panel-title">
            {{ selectedRoom.room?.number }} — {{ selectedRoom.roomType?.name }}
          </h2>
          <button
            type="button"
            class="side-panel-close"
            :aria-label="t('common.close_panel')"
            @click="closePanel"
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
          v-if="canManageRooms"
          class="action-toolbar"
          role="toolbar"
          :aria-label="t('rooms.panel_toolbar_aria')"
        >
          <template v-if="!roomPanelEditing">
            <button
              type="button"
              class="action-toolbar__btn action-toolbar__btn--check-out"
              @click="startRoomEdit"
            >
              {{ t('common.edit') }}
            </button>
            <button
              type="button"
              class="action-toolbar__btn action-toolbar__btn--cancel"
              :disabled="removeRoomSaving"
              :aria-label="t('rooms.remove_room_aria', { number: selectedRoom.room?.number ?? '' })"
              @click="openRemoveRoomConfirm"
            >
              {{ t('rooms.remove_room_from_catalog') }}
            </button>
          </template>
          <template v-else>
            <button
              type="button"
              class="action-toolbar__btn action-toolbar__btn--check-out"
              :disabled="roomSaveSaving"
              @click="cancelRoomEdit"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              class="action-toolbar__btn action-toolbar__btn--check-in"
              :aria-busy="roomSaveSaving"
              :disabled="roomSaveSaving"
              @click="submitRoomEdit"
            >
              {{ roomSaveSaving ? t('common.saving') : t('common.save') }}
            </button>
          </template>
        </div>
        <div class="side-panel-body">
          <p v-if="roomPanelError" class="form-error">{{ roomPanelError }}</p>
          <template v-if="!roomPanelEditing">
            <dl class="side-panel-dl">
              <dt>{{ t('fields.room_type') }}</dt>
              <dd>{{ selectedRoom.roomType?.name ?? '—' }}</dd>
              <dt>{{ t('fields.status') }}</dt>
              <dd>
                <span
                  v-if="selectedRoom.room?.status"
                  class="room-status-badge"
                  :class="statusBadgeClass(selectedRoom.room.status)"
                  >{{ roomStatusLabel(selectedRoom.room.status) }}</span
                >
                <span v-else>—</span>
              </dd>
            </dl>
          </template>
          <form v-else class="side-panel-edit-form" @submit.prevent="submitRoomEdit">
            <label>
              {{ t('fields.room_number') }}
              <abbr class="required" :title="t('common.required')">*</abbr>
              <input
                v-model="editRoomForm.number"
                type="text"
                required
                :disabled="roomSaveSaving"
              />
            </label>
            <label>
              {{ t('fields.room_type') }}
              <abbr class="required" :title="t('common.required')">*</abbr>
              <select v-model="editRoomForm.room_type_id" required :disabled="roomSaveSaving">
                <option v-for="opt in roomTypes" :key="opt.id" :value="opt.id">
                  {{ opt.name }}
                </option>
              </select>
            </label>
            <label>
              {{ t('fields.status') }} <abbr class="required" :title="t('common.required')">*</abbr>
              <select v-model="editRoomForm.status" required :disabled="roomSaveSaving">
                <option v-for="s in ROOM_STATUSES" :key="s" :value="s">
                  {{ t(`rooms.room_status.${s}`) }}
                </option>
              </select>
            </label>
          </form>
        </div>
      </aside>
    </Transition>
  </section>

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

  <Teleport to="body">
    <div
      v-if="removeRoomConfirmOpen"
      class="dialog-backdrop"
      role="presentation"
      @click.self="closeRemoveRoomConfirm"
    >
      <div class="dialog" role="dialog" aria-modal="true" :aria-labelledby="removeRoomTitleId">
        <h2 :id="removeRoomTitleId">{{ t('rooms.confirm_remove_room_title') }}</h2>
        <p v-if="removeRoomError" class="form-error">{{ removeRoomError }}</p>
        <p class="rooms-confirm-body">
          {{ t('rooms.confirm_remove_room_body', { number: removeRoomTarget?.number ?? '' }) }}
        </p>
        <div class="dialog-actions">
          <button
            type="button"
            class="btn-secondary"
            :disabled="removeRoomSaving"
            @click="closeRemoveRoomConfirm"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="btn-room-type-action btn-room-type-action--danger"
            :disabled="removeRoomSaving"
            @click="confirmRemoveRoom"
          >
            {{ removeRoomSaving ? t('common.loading') : t('rooms.remove_room_from_catalog') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, watch, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import PropertySubNav from '@/features/property/components/PropertySubNav.vue'
import SearchBar from '@/shared/components/SearchBar.vue'
import { usePropertyStore } from '@/features/property/stores/usePropertyStore'
import type { Room, RoomType } from '@/shared/types/property'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import { usePermissions } from '@/shared/composables/usePermissions'

const DEBOUNCE_MS = 300

const ROOM_STATUSES = ['available', 'maintenance', 'out_of_order']

type RoomPanelSelection = { room: Room; roomType: RoomType | undefined }

const { t } = useI18n()
const store = usePropertyStore()
const { canCreateRooms, canManageRooms } = usePermissions()
const { roomTypes, rooms } = storeToRefs(store)

const removeTypeTitleId = useId()
const removeRoomTitleId = useId()

const initialLoading = ref(true)
const searching = ref(false)
const loadError = ref('')
const searchQuery = ref('')
const selectedRoom = ref<RoomPanelSelection | null>(null)
const roomPanelEditing = ref(false)
const roomPanelError = ref('')
const editRoomForm = ref({ room_type_id: '', number: '', status: 'available' })
const roomSaveSaving = ref(false)

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

const removeRoomConfirmOpen = ref(false)
const removeRoomTarget = ref<Room | null>(null)
const removeRoomSaving = ref(false)
const removeRoomError = ref('')

let searchDebounceId: ReturnType<typeof setTimeout> | null = null

function roomsByType(roomTypeId: string) {
  return rooms.value.filter((r) => r.room_type_id === roomTypeId)
}

function openPanel(room: Room, roomType: RoomType | undefined) {
  selectedRoom.value = { room, roomType }
  roomPanelEditing.value = false
  roomPanelError.value = ''
}

function closePanel() {
  selectedRoom.value = null
}

/** @param {string | undefined} status */
function roomStatusLabel(status) {
  if (!status) return '—'
  const s = String(status)
  if (ROOM_STATUSES.includes(s)) return t(`rooms.room_status.${s}`)
  return s
}

/** @param {string | undefined} status */
function statusBadgeClass(status) {
  const s = (status || '').toLowerCase()
  if (s === 'available') return 'room-status-badge--available'
  if (s === 'maintenance') return 'room-status-badge--maintenance'
  if (s === 'out_of_order') return 'room-status-badge--out-of-order'
  const norm = s.replace(/-|_/g, '')
  if (norm === 'confirmed') return 'room-status-badge--confirmed'
  if (norm === 'checkedin') return 'room-status-badge--checked-in'
  if (norm === 'checkedout') return 'room-status-badge--checked-out'
  if (norm === 'canceled' || norm === 'cancelled') return 'room-status-badge--canceled'
  return ''
}

function startRoomEdit() {
  const sel = selectedRoom.value
  if (!sel?.room) return
  editRoomForm.value = {
    room_type_id: sel.room.room_type_id,
    number: sel.room.number,
    status:
      sel.room.status && ROOM_STATUSES.includes(sel.room.status) ? sel.room.status : 'available',
  }
  roomPanelError.value = ''
  roomPanelEditing.value = true
}

function cancelRoomEdit() {
  roomPanelEditing.value = false
  roomPanelError.value = ''
}

async function submitRoomEdit() {
  const sel = selectedRoom.value
  if (!sel?.room?.id) return
  const { room_type_id, number, status } = editRoomForm.value
  if (!number?.trim() || !room_type_id || !status) return
  roomSaveSaving.value = true
  roomPanelError.value = ''
  try {
    const updated = await store.updateRoom(sel.room.id, {
      room_type_id,
      number: number.trim(),
      status,
    })
    const rt = roomTypes.value.find((x) => x.id === updated.room_type_id)
    selectedRoom.value = { room: updated, roomType: rt }
    roomPanelEditing.value = false
  } catch (err: unknown) {
    roomPanelError.value = formatUnknownApiError(err) || t('rooms.load_failed')
  } finally {
    roomSaveSaving.value = false
  }
}

function openRemoveRoomConfirm() {
  const sel = selectedRoom.value
  if (!sel?.room) return
  removeRoomTarget.value = sel.room
  removeRoomError.value = ''
  removeRoomConfirmOpen.value = true
}

function closeRemoveRoomConfirm() {
  removeRoomConfirmOpen.value = false
  removeRoomTarget.value = null
  removeRoomError.value = ''
}

async function confirmRemoveRoom() {
  const room = removeRoomTarget.value
  if (!room?.id) return
  removeRoomSaving.value = true
  removeRoomError.value = ''
  try {
    await store.deleteRoom(room.id)
    if (selectedRoom.value?.room?.id === room.id) {
      selectedRoom.value = null
      roomPanelEditing.value = false
    }
    closeRemoveRoomConfirm()
  } catch (err: unknown) {
    removeRoomError.value = formatUnknownApiError(err) || t('rooms.load_failed')
  } finally {
    removeRoomSaving.value = false
  }
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
    syncSelectedRoomFromStore()
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
    if (selectedRoom.value?.roomType?.id === rt.id) {
      selectedRoom.value = null
      roomPanelEditing.value = false
    }
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

function syncSelectedRoomFromStore() {
  if (!selectedRoom.value || roomPanelEditing.value) return
  const id = selectedRoom.value.room?.id
  if (!id) return
  const room = rooms.value.find((r) => r.id === id)
  if (!room) {
    selectedRoom.value = null
    return
  }
  const roomType = roomTypes.value.find((x) => x.id === room.room_type_id)
  selectedRoom.value = { room, roomType }
}

watch([rooms, roomTypes], syncSelectedRoomFromStore, { deep: true })

watch(selectedRoom, (v) => {
  if (!v) {
    roomPanelEditing.value = false
    roomPanelError.value = ''
  }
})

/**
 * @param {{ q?: string }} [params]
 * @param {boolean} [isInitial] - If true, show full-page "Loading…"; otherwise show spinner in search bar.
 */
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
.side-panel-edit-form label {
  display: block;
  margin-top: var(--space-sm);
}

.side-panel-edit-form label:first-child {
  margin-top: 0;
}

.rooms-confirm-body {
  margin: 0 0 var(--space-md);
  font-size: var(--text-body-size);
  color: var(--ink-secondary);
}
</style>
