<template>
  <div class="rooms-view">
    <header class="page-header">
      <h1 class="page-title">Rooms</h1>
      <button type="button" class="btn-add-type" @click="openAddTypeDialog" aria-label="Add room type">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add type
      </button>
    </header>

    <p v-if="loadError" class="error-message">{{ loadError }}</p>
    <div v-else-if="loading" class="loading-state">Loading…</div>
    <template v-else>
      <p v-if="!roomTypes.length" class="empty-state">No room types yet. Click “Add type” to create one.</p>
      <div v-else class="accordion-list">
        <details
          v-for="rt in roomTypes"
          :key="rt.id"
          class="accordion"
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
              :aria-label="`Add room to ${rt.name}`"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add room
            </button>
          </summary>
          <div class="accordion-body">
            <div v-if="roomsByType(rt.id).length" class="room-table-wrap">
              <table class="room-table" role="grid">
                <thead>
                  <tr>
                    <th scope="col">Number</th>
                    <th scope="col" class="col-status">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="room in roomsByType(rt.id)" :key="room.id">
                    <td data-label="Number">{{ room.number }}</td>
                    <td data-label="Status" class="col-status">
                      <span v-if="room.status" class="room-status-badge" :class="statusBadgeClass(room.status)">{{ room.status }}</span>
                      <span v-else class="room-status-empty">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="room-list-empty">No rooms in this type.</p>
          </div>
        </details>
      </div>
    </template>

    <!-- Add room type dialog -->
    <div v-if="addTypeOpen" class="dialog-backdrop" @click.self="closeAddTypeDialog">
      <div class="dialog" role="dialog" aria-labelledby="add-type-title">
        <h2 id="add-type-title" class="dialog-title">Add room type</h2>
        <form @submit.prevent="submitAddType">
          <label>
            Name
            <input v-model="addTypeForm.name" type="text" placeholder="e.g. Double" required :disabled="addTypeSaving" />
          </label>
          <label>
            Description <span class="optional">(optional)</span>
            <input v-model="addTypeForm.description" type="text" placeholder="Short description" :disabled="addTypeSaving" />
          </label>
          <div class="dialog-actions">
            <button type="button" class="btn-secondary" @click="closeAddTypeDialog">Cancel</button>
            <button type="submit" :aria-busy="addTypeSaving" :disabled="addTypeSaving">Add</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add room dialog -->
    <div v-if="addRoomOpen" class="dialog-backdrop" @click.self="closeAddRoomDialog">
      <div class="dialog" role="dialog" aria-labelledby="add-room-title">
        <h2 id="add-room-title" class="dialog-title">Add room to {{ addRoomType?.name }}</h2>
        <form @submit.prevent="submitAddRoom">
          <label>
            Room number
            <input v-model="addRoomForm.number" type="text" placeholder="e.g. 101" required :disabled="addRoomSaving" />
          </label>
          <div class="dialog-actions">
            <button type="button" class="btn-secondary" @click="closeAddRoomDialog">Cancel</button>
            <button type="submit" :aria-busy="addRoomSaving" :disabled="addRoomSaving">Add</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { usePropertyStore } from '@/features/property/stores/usePropertyStore'

const store = usePropertyStore()
const { roomTypes, rooms } = storeToRefs(store)

const loading = ref(true)
const loadError = ref('')

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

async function load() {
  loadError.value = ''
  loading.value = true
  try {
    await store.fetchRoomTypes()
    await store.fetchRooms()
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Failed to load rooms.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.rooms-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.page-title {
  font-family: var(--font-display);
  font-size: var(--text-heading-size);
  font-weight: var(--text-heading-weight);
  letter-spacing: var(--text-heading-tracking);
  color: var(--ink-primary);
  margin: 0;
}

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

.room-table tbody tr {
  transition: background 0.12s ease;
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

.dialog-title {
  font-family: var(--font-display);
  font-size: var(--text-heading-size);
  font-weight: var(--text-heading-weight);
  color: var(--ink-primary);
  margin: 0 0 var(--space-lg) 0;
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
