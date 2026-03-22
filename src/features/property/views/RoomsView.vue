<template>
  <header class="page-header">
    <h1>{{ t('nav.rooms') }}</h1>
    <button type="button" class="btn-add-outline" @click="openAddTypeDialog" :aria-label="t('rooms.addTypeAria')">
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      {{ t('rooms.addType') }}
    </button>
  </header>

  <SearchBar
    v-if="roomTypes.length"
    v-model="searchQuery"
    :placeholder="t('rooms.searchPlaceholder')"
    :aria-label="t('rooms.searchAria')"
    :searching="searching"
  />

  <section class="list-content">
    <div class="list-content__viewport">
      <p v-if="loadError" class="error-message">{{ loadError }}</p>
      <div v-else-if="initialLoading" class="loading-state">{{ t('common.loading') }}</div>
      <template v-else>
        <p v-if="!roomTypes.length && !searchQuery" class="empty-state">{{ t('rooms.empty') }}</p>
        <p v-else-if="!roomTypes.length && searchQuery" class="empty-state">{{ t('rooms.emptySearch') }}</p>
        <div v-else class="accordion-list">
          <details
            v-for="rt in roomTypes"
            :key="rt.id"
            class="accordion"
            :open="!!searchQuery"
          >
            <summary class="accordion-header">
              <span class="accordion-title">
                <strong>{{ rt.name }}</strong>
                <span v-if="rt.description" class="accordion-desc">{{ rt.description }}</span>
              </span>
              <div class="accordion-header-actions">
                <button
                  type="button"
                  class="btn-room-type-action"
                  @click.stop="openEditTypeDialog(rt)"
                  :aria-label="t('common.edit')"
                >
                  {{ t('common.edit') }}
                </button>
                <button
                  type="button"
                  class="btn-room-type-action btn-room-type-action--danger"
                  @click.stop="openRemoveTypeConfirm(rt)"
                  :aria-label="t('rooms.removeTypeAria', { name: rt.name })"
                >
                  {{ t('rooms.removeTypeFromCatalog') }}
                </button>
                <button
                  type="button"
                  class="btn-add-room"
                  @click.stop="openAddRoomDialog(rt)"
                  :aria-label="t('rooms.addRoomAria', { name: rt.name })"
                >
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  {{ t('rooms.addRoom') }}
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
                        <span v-if="room.status" class="room-status-badge" :class="statusBadgeClass(room.status)">{{ roomStatusLabel(room.status) }}</span>
                        <span v-else class="room-status-empty">—</span>
                      </td>
                    </tr>
                  </tbody>
              </table>
              <p v-else class="room-list-empty">{{ t('rooms.emptyInType') }}</p>
            </div>
          </details>
        </div>
      </template>
    </div>

    <Transition name="slide-panel">
      <aside
        v-if="selectedRoom"
        class="room-panel"
        aria-labelledby="room-panel-title"
      >
        <div class="room-panel-header">
          <h2 id="room-panel-title">{{ selectedRoom.room?.number }} — {{ selectedRoom.roomType?.name }}</h2>
          <button
            type="button"
            class="room-panel-close"
            :aria-label="t('common.closePanel')"
            @click="closePanel"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div
          class="booking-lifecycle-toolbar"
          role="toolbar"
          :aria-label="t('rooms.panelToolbarAria')"
        >
          <template v-if="!roomPanelEditing">
            <button
              type="button"
              class="booking-lifecycle-action booking-lifecycle-action--check-out"
              @click="startRoomEdit"
            >
              {{ t('common.edit') }}
            </button>
            <button
              type="button"
              class="booking-lifecycle-action booking-lifecycle-action--cancel"
              :disabled="removeRoomSaving"
              :aria-label="t('rooms.removeRoomAria', { number: selectedRoom.room?.number ?? '' })"
              @click="openRemoveRoomConfirm"
            >
              {{ t('rooms.removeRoomFromCatalog') }}
            </button>
          </template>
          <template v-else>
            <button
              type="button"
              class="booking-lifecycle-action booking-lifecycle-action--check-out"
              :disabled="roomSaveSaving"
              @click="cancelRoomEdit"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              class="booking-lifecycle-action booking-lifecycle-action--check-in"
              :aria-busy="roomSaveSaving"
              :disabled="roomSaveSaving"
              @click="submitRoomEdit"
            >
              {{ roomSaveSaving ? t('common.saving') : t('common.save') }}
            </button>
          </template>
        </div>
        <div class="room-panel-body">
          <p v-if="roomPanelError" class="form-error">{{ roomPanelError }}</p>
          <template v-if="!roomPanelEditing">
            <dl class="room-panel-dl">
              <dt>{{ t('fields.roomType') }}</dt>
              <dd>{{ selectedRoom.roomType?.name ?? '—' }}</dd>
              <dt>{{ t('fields.status') }}</dt>
              <dd>
                <span v-if="selectedRoom.room?.status" class="room-status-badge" :class="statusBadgeClass(selectedRoom.room.status)">{{ roomStatusLabel(selectedRoom.room.status) }}</span>
                <span v-else>—</span>
              </dd>
            </dl>
          </template>
          <form v-else class="room-panel-edit-form" @submit.prevent="submitRoomEdit">
            <label>
              {{ t('fields.roomNumber') }}
              <input v-model="editRoomForm.number" type="text" required :disabled="roomSaveSaving" />
            </label>
            <label>
              {{ t('fields.roomType') }}
              <select v-model="editRoomForm.room_type_id" required :disabled="roomSaveSaving">
                <option v-for="opt in roomTypes" :key="opt.id" :value="opt.id">{{ opt.name }}</option>
              </select>
            </label>
            <label>
              {{ t('fields.status') }}
              <select v-model="editRoomForm.status" required :disabled="roomSaveSaving">
                <option v-for="s in ROOM_STATUSES" :key="s" :value="s">{{ t(`rooms.roomStatus.${s}`) }}</option>
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
      <h2 id="add-type-title">{{ t('rooms.addTypeTitle') }}</h2>
      <form @submit.prevent="submitAddType">
        <label>
          {{ t('fields.name') }}
          <input v-model="addTypeForm.name" type="text" :placeholder="t('rooms.namePlaceholder')" required :disabled="addTypeSaving" />
        </label>
        <label>
          {{ t('fields.description') }} <span class="optional">{{ t('common.optional') }}</span>
          <input v-model="addTypeForm.description" type="text" :placeholder="t('rooms.descPlaceholder')" :disabled="addTypeSaving" />
        </label>
        <div class="dialog-actions">
          <button type="button" class="btn-secondary" @click="closeAddTypeDialog">{{ t('common.cancel') }}</button>
          <button type="submit" :aria-busy="addTypeSaving" :disabled="addTypeSaving">{{ t('common.add') }}</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Edit room type dialog -->
  <div v-if="editTypeOpen" class="dialog-backdrop" @click.self="closeEditTypeDialog">
    <div class="dialog" role="dialog" aria-labelledby="edit-type-title">
      <h2 id="edit-type-title">{{ t('rooms.editTypeTitle') }}</h2>
      <p v-if="editTypeError" class="form-error">{{ editTypeError }}</p>
      <form @submit.prevent="submitEditType">
        <label>
          {{ t('fields.name') }}
          <input v-model="editTypeForm.name" type="text" :placeholder="t('rooms.namePlaceholder')" required :disabled="editTypeSaving" />
        </label>
        <label>
          {{ t('fields.description') }} <span class="optional">{{ t('common.optional') }}</span>
          <input v-model="editTypeForm.description" type="text" :placeholder="t('rooms.descPlaceholder')" :disabled="editTypeSaving" />
        </label>
        <div class="dialog-actions">
          <button type="button" class="btn-secondary" @click="closeEditTypeDialog">{{ t('common.cancel') }}</button>
          <button type="submit" :aria-busy="editTypeSaving" :disabled="editTypeSaving">{{ t('common.save') }}</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Add room dialog -->
  <div v-if="addRoomOpen" class="dialog-backdrop" @click.self="closeAddRoomDialog">
    <div class="dialog" role="dialog" aria-labelledby="add-room-title">
      <h2 id="add-room-title">{{ t('rooms.addRoomTitle', { name: addRoomType?.name ?? '' }) }}</h2>
      <form @submit.prevent="submitAddRoom">
        <label>
          {{ t('fields.roomNumber') }}
          <input v-model="addRoomForm.number" type="text" :placeholder="t('rooms.numberPlaceholder')" required :disabled="addRoomSaving" />
        </label>
        <div class="dialog-actions">
          <button type="button" class="btn-secondary" @click="closeAddRoomDialog">{{ t('common.cancel') }}</button>
          <button type="submit" :aria-busy="addRoomSaving" :disabled="addRoomSaving">{{ t('common.add') }}</button>
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
        <h2 :id="removeTypeTitleId">{{ t('rooms.confirmRemoveTypeTitle') }}</h2>
        <p v-if="removeTypeError" class="form-error">{{ removeTypeError }}</p>
        <p class="rooms-confirm-body">{{ t('rooms.confirmRemoveTypeBody', { name: removeTypeTarget?.name ?? '' }) }}</p>
        <div class="dialog-actions">
          <button type="button" class="btn-secondary" :disabled="removeTypeSaving" @click="closeRemoveTypeConfirm">
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="btn-room-type-action btn-room-type-action--danger"
            :disabled="removeTypeSaving"
            @click="confirmRemoveType"
          >
            {{ removeTypeSaving ? t('common.loading') : t('rooms.removeTypeFromCatalog') }}
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
        <h2 :id="removeRoomTitleId">{{ t('rooms.confirmRemoveRoomTitle') }}</h2>
        <p v-if="removeRoomError" class="form-error">{{ removeRoomError }}</p>
        <p class="rooms-confirm-body">{{ t('rooms.confirmRemoveRoomBody', { number: removeRoomTarget?.number ?? '' }) }}</p>
        <div class="dialog-actions">
          <button type="button" class="btn-secondary" :disabled="removeRoomSaving" @click="closeRemoveRoomConfirm">
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="btn-room-type-action btn-room-type-action--danger"
            :disabled="removeRoomSaving"
            @click="confirmRemoveRoom"
          >
            {{ removeRoomSaving ? t('common.loading') : t('rooms.removeRoomFromCatalog') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, watch, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import SearchBar from '@/shared/components/SearchBar.vue'
import { usePropertyStore } from '@/features/property/stores/usePropertyStore'
import { formatApiError } from '@/shared/i18n/apiError'

const DEBOUNCE_MS = 300

const ROOM_STATUSES = ['available', 'maintenance', 'out_of_order']

const { t } = useI18n()
const store = usePropertyStore()
const { roomTypes, rooms } = storeToRefs(store)

const removeTypeTitleId = useId()
const removeRoomTitleId = useId()

const initialLoading = ref(true)
const searching = ref(false)
const loadError = ref('')
const searchQuery = ref('')
const selectedRoom = ref(null)
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
const removeTypeTarget = ref(null)
const removeTypeSaving = ref(false)
const removeTypeError = ref('')

const addRoomOpen = ref(false)
const addRoomType = ref(null)
const addRoomForm = ref({ number: '' })
const addRoomSaving = ref(false)

const removeRoomConfirmOpen = ref(false)
const removeRoomTarget = ref(null)
const removeRoomSaving = ref(false)
const removeRoomError = ref('')

let searchDebounceId = null

function roomsByType(roomTypeId) {
  return rooms.value.filter((r) => r.room_type_id === roomTypeId)
}

function openPanel(room, roomType) {
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
  if (ROOM_STATUSES.includes(s)) return t(`rooms.roomStatus.${s}`)
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
    status: ROOM_STATUSES.includes(sel.room.status) ? sel.room.status : 'available',
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
  } catch (err) {
    roomPanelError.value = formatApiError(err.response?.data?.error) || t('rooms.loadFailed')
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
  } catch (err) {
    removeRoomError.value = formatApiError(err.response?.data?.error) || t('rooms.loadFailed')
  } finally {
    removeRoomSaving.value = false
  }
}

function openAddTypeDialog() {
  addTypeForm.value = { name: '', description: '' }
  addTypeOpen.value = true
}

function closeAddTypeDialog() {
  addTypeOpen.value = false
}

async function submitAddType() {
  if (!addTypeForm.value.name?.trim()) return
  addTypeSaving.value = true
  try {
    await store.createRoomType(addTypeForm.value.name.trim(), addTypeForm.value.description?.trim() || '')
    closeAddTypeDialog()
  } catch {
    // Error surfaced by API client
  } finally {
    addTypeSaving.value = false
  }
}

function openEditTypeDialog(rt) {
  editTypeId.value = rt.id
  editTypeForm.value = { name: rt.name, description: rt.description ?? '' }
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
  } catch (err) {
    editTypeError.value = formatApiError(err.response?.data?.error) || t('rooms.loadFailed')
  } finally {
    editTypeSaving.value = false
  }
}

function openRemoveTypeConfirm(rt) {
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
  } catch (err) {
    removeTypeError.value = formatApiError(err.response?.data?.error) || t('rooms.loadFailed')
  } finally {
    removeTypeSaving.value = false
  }
}

function openAddRoomDialog(rt) {
  addRoomType.value = rt
  addRoomForm.value = { number: '' }
  addRoomOpen.value = true
}

function closeAddRoomDialog() {
  addRoomOpen.value = false
  addRoomType.value = null
}

async function submitAddRoom() {
  if (!addRoomType.value || !addRoomForm.value.number?.trim()) return
  addRoomSaving.value = true
  try {
    await store.createRoom(addRoomType.value.id, addRoomForm.value.number.trim())
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
async function load(params = {}, isInitial = false) {
  loadError.value = ''
  if (isInitial) {
    initialLoading.value = true
  } else {
    searching.value = true
  }
  try {
    await store.fetchRoomTypes(params)
    await store.fetchRooms(params)
  } catch (err) {
    loadError.value = formatApiError(err.response?.data?.error) || t('rooms.loadFailed')
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
.room-panel-edit-form label {
  display: block;
  margin-top: var(--space-sm);
}

.room-panel-edit-form label:first-child {
  margin-top: 0;
}

.rooms-confirm-body {
  margin: 0 0 var(--space-md);
  font-size: var(--text-body-size);
  color: var(--ink-secondary);
}
</style>
