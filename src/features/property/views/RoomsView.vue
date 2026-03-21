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
                        <span v-if="room.status" class="room-status-badge" :class="statusBadgeClass(room.status)">{{ room.status }}</span>
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
