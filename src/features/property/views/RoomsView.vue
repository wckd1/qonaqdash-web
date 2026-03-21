<template>
  <header class="page-header">
    <h1>{{ t('nav.rooms') }}</h1>
    <button type="button" class="btn-add-type" @click="openAddTypeDialog" :aria-label="t('rooms.addTypeAria')">
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
          </summary>
          <div class="accordion-body">
            <div v-if="roomsByType(rt.id).length" class="room-table-wrap">
              <table class="room-table" role="grid">
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
                      <span v-if="room.status" class="room-status-badge" :class="statusBadgeClass(room.status)">{{ room.status }}</span>
                      <span v-else class="room-status-empty">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="room-list-empty">{{ t('rooms.emptyInType') }}</p>
          </div>
        </details>
      </div>
    </template>
  </section>

  <Transition name="slide-panel">
    <aside
      v-if="selectedRoom"
      class="room-panel"
        role="dialog"
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
        <div class="room-panel-body">
          <dl class="room-panel-dl">
            <dt>{{ t('fields.roomType') }}</dt>
            <dd>{{ selectedRoom.roomType?.name ?? '—' }}</dd>
            <dt>{{ t('fields.status') }}</dt>
            <dd>
              <span v-if="selectedRoom.room?.status" class="room-status-badge" :class="statusBadgeClass(selectedRoom.room.status)">{{ selectedRoom.room.status }}</span>
              <span v-else>—</span>
            </dd>
          </dl>
        </div>
      </aside>
  </Transition>

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
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import SearchBar from '@/shared/components/SearchBar.vue'
import { usePropertyStore } from '@/features/property/stores/usePropertyStore'

const DEBOUNCE_MS = 300

const { t } = useI18n()
const store = usePropertyStore()
const { roomTypes, rooms } = storeToRefs(store)

const initialLoading = ref(true)
const searching = ref(false)
const loadError = ref('')
const searchQuery = ref('')
const selectedRoom = ref(null)
let searchDebounceId = null

const addTypeOpen = ref(false)
const addTypeForm = ref({ name: '', description: '' })
const addTypeSaving = ref(false)

const addRoomOpen = ref(false)
const addRoomType = ref(null)
const addRoomForm = ref({ number: '' })
const addRoomSaving = ref(false)

function roomsByType(roomTypeId) {
  return rooms.value.filter((r) => r.room_type_id === roomTypeId)
}

function openPanel(room, roomType) {
  selectedRoom.value = { room, roomType }
}

function closePanel() {
  selectedRoom.value = null
}

/** @param {string} status */
function statusBadgeClass(status) {
  const s = (status || '').toLowerCase().replace(/-|_/g, '')
  if (s === 'confirmed') return 'room-status-badge--confirmed'
  if (s === 'checkedin') return 'room-status-badge--checked-in'
  if (s === 'checkedout') return 'room-status-badge--checked-out'
  if (s === 'canceled' || s === 'cancelled') return 'room-status-badge--canceled'
  return ''
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
    loadError.value = err.response?.data?.error || t('rooms.loadFailed')
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
.btn-add-type {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--text-label-size);
  font-weight: var(--text-label-weight);
  color: var(--brand-primary);
  background: transparent;
  border: 1px solid var(--brand-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.btn-add-type:hover {
  background: var(--semantic-info-bg);
  color: var(--brand-primary-hover);
}

.btn-icon {
  width: 14px;
  height: 14px;
}

.error-message {
  color: var(--semantic-error);
  font-size: var(--text-body-size);
  margin: 0;
}

.loading-state,
.empty-state {
  color: var(--ink-tertiary);
  font-size: var(--text-body-size);
  margin: 0;
}

.accordion-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-micro);
}

.accordion {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface-2);
  overflow: hidden;
}

.accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  cursor: pointer;
  list-style: none;
  min-height: 44px;
}

.accordion[open] .accordion-header {
  margin-bottom: 0;
}

.accordion-header::-webkit-details-marker {
  display: none;
}

.accordion-header::marker {
  content: none;
}

.accordion-title {
  display: flex;
  flex-direction: column;
  gap: var(--space-micro);
  flex: 1;
  min-width: 0;
}

.accordion-title strong {
  font-size: var(--text-body-size);
  font-weight: var(--text-label-weight);
  color: var(--ink-primary);
}

.accordion-desc {
  font-size: var(--text-caption-size);
  color: var(--ink-tertiary);
}

.btn-add-room {
  display: inline-flex;
  align-items: center;
  gap: var(--space-micro);
  padding: var(--space-micro) var(--space-xs);
  font-size: var(--text-caption-size);
  font-weight: var(--text-label-weight);
  color: var(--ink-tertiary);
  background: transparent;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.btn-add-room:hover {
  color: var(--brand-primary);
  border-color: var(--brand-primary);
  background: var(--semantic-info-bg);
}

.accordion-body {
  padding: 0;
  border-top: none;
}

.room-table-wrap {
  overflow: hidden;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--surface-1);
  margin: var(--space-micro);
}

.room-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-body-size);
}

.room-table thead {
  background: var(--surface-2);
}

.room-table th {
  text-align: left;
  font-size: var(--text-label-size);
  font-weight: var(--text-label-weight);
  color: var(--ink-secondary);
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--border-subtle);
}

.room-table th:first-child {
  padding-left: var(--space-md);
}

.room-table .col-status {
  text-align: right;
  width: 1%;
  white-space: nowrap;
}

.room-table td.col-status {
  text-align: right;
  padding-right: var(--space-md);
}

.room-table td {
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--border-subtle);
  color: var(--ink-primary);
}

.room-table tbody tr:last-child td {
  border-bottom: none;
}

.room-table tbody tr:hover {
  background: var(--surface-2);
}

.room-row {
  cursor: pointer;
  transition: background 0.12s ease;
}

.room-row:hover {
  background: var(--surface-2);
}

.room-row--selected {
  background: var(--semantic-info-bg);
}

.room-row--selected:hover {
  background: var(--semantic-info-bg);
}

.room-panel {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 60%;
  min-width: 280px;
  max-width: 720px;
  background: var(--surface-1);
  border-left: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  min-height: 0;
  box-shadow: -4px 0 20px rgba(30, 41, 59, 0.12);
  z-index: 10;
}

.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: transform 0.25s ease;
}

.slide-panel-enter-from,
.slide-panel-leave-to {
  transform: translateX(100%);
}

.slide-panel-enter-to,
.slide-panel-leave-from {
  transform: translateX(0);
}

.room-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--border-subtle);
}

.room-panel-close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--ink-tertiary);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}

.room-panel-close:hover {
  color: var(--ink-primary);
  background: var(--surface-2);
}

.room-panel-close svg {
  width: 18px;
  height: 18px;
}

.room-panel-body {
  flex: 1;
  min-height: 0;
  padding: var(--space-lg);
  overflow-y: auto;
}

.room-panel-dl {
  margin: 0;
  font-size: var(--text-body-size);
}

.room-panel-dl dt {
  font-weight: var(--text-label-weight);
  color: var(--ink-tertiary);
  margin-top: var(--space-sm);
  margin-bottom: var(--space-micro);
}

.room-panel-dl dt:first-child {
  margin-top: 0;
}

.room-panel-dl dd {
  margin: 0;
  color: var(--ink-primary);
}

.room-status-badge {
  display: inline-block;
  padding: var(--space-micro) var(--space-xs);
  font-size: var(--text-caption-size);
  font-weight: var(--text-label-weight);
  color: var(--ink-secondary);
  background: var(--control-bg);
  border-radius: var(--radius-sm);
}

.room-status-badge--confirmed {
  color: var(--status-confirmed);
  background: var(--semantic-info-bg);
}

.room-status-badge--checked-in {
  color: var(--status-checked-in);
  background: var(--semantic-success-bg);
}

.room-status-badge--checked-out {
  color: var(--status-checked-out);
  background: var(--surface-2);
}

.room-status-badge--canceled {
  color: var(--status-canceled);
  background: var(--semantic-error-bg);
}

.room-status-empty {
  color: var(--ink-muted);
}

.room-list-empty {
  margin: var(--space-micro);
  padding: var(--space-sm) 0;
  font-size: var(--text-caption-size);
  color: var(--ink-tertiary);
}

/* Dialogs */
.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: var(--overlay-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-lg);
}

.dialog {
  background: var(--surface-1);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-subtle);
}

.dialog form label {
  display: block;
  margin-bottom: var(--space-md);
}

.dialog form label:last-of-type {
  margin-bottom: 0;
}

.dialog form .dialog-actions {
  margin-top: var(--space-xl);
}

.optional {
  font-weight: var(--text-body-weight);
  color: var(--ink-tertiary);
}

.dialog-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
}

.btn-secondary {
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--text-label-size);
  color: var(--ink-secondary);
  background: var(--control-bg);
  border: 1px solid var(--control-border);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.btn-secondary:hover {
  color: var(--ink-primary);
  border-color: var(--border-emphasis);
}
</style>
