<template>
  <header class="page-header">
    <h1>{{ pageTitle }}</h1>
    <button
      v-if="canCreate"
      type="button"
      class="btn-add-outline"
      :aria-label="t('tasks.create_aria')"
      @click="openCreateDialog"
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
      {{ t('tasks.create') }}
    </button>
  </header>

  <div class="content-toolbar" role="toolbar" :aria-label="t('tasks.filter_aria')">
    <div class="toolbar-cluster toolbar-cluster--start">
      <label class="toolbar-field">
        <span class="toolbar-field-label">{{ t('fields.status') }}</span>
        <select v-model="statusFilter" class="toolbar-picker" @change="reload">
          <option value="">{{ t('tasks.filter_any_status') }}</option>
          <option v-for="s in statusOptions" :key="s" :value="s">
            {{ t(`tasks.status.${s}`) }}
          </option>
        </select>
      </label>
      <label class="toolbar-check">
        <input v-model="unassignedOnly" type="checkbox" @change="reload" />
        <span>{{ t('tasks.filter_unassigned') }}</span>
      </label>
    </div>
  </div>

  <section class="list-content">
    <div class="list-content__viewport">
      <p v-if="loadError" class="error-message">{{ loadError }}</p>
      <div v-else-if="initialLoading" class="loading-state">{{ t('common.loading') }}</div>
      <template v-else>
        <p v-if="!tasks.length" class="empty-state">{{ t('tasks.empty') }}</p>
        <table v-else class="list-table" role="grid">
          <thead>
            <tr>
              <th scope="col">{{ t('fields.room_number') }}</th>
              <th scope="col">{{ t('tasks.col_description') }}</th>
              <th scope="col" class="col-status">{{ t('fields.status') }}</th>
              <th scope="col">{{ t('tasks.col_assignee') }}</th>
              <th scope="col">{{ t('tasks.col_updated') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="task in tasks"
              :key="task.id"
              class="list-row"
              :class="{ 'list-row--selected': selectedTask?.id === task.id }"
              @click="openPanel(task)"
            >
              <td :data-label="t('fields.room_number')">{{ roomLabel(task.room_id) }}</td>
              <td :data-label="t('tasks.col_description')">{{ task.description || '—' }}</td>
              <td :data-label="t('fields.status')" class="col-status">
                <span class="task-status-badge" :class="statusBadgeClass(task.status)">{{
                  t(`tasks.status.${task.status}`)
                }}</span>
              </td>
              <td :data-label="t('tasks.col_assignee')">
                {{ employeeLabel(task.assignee_employee_id) }}
              </td>
              <td :data-label="t('tasks.col_updated')">{{ formatDateTime(task.updated_at) }}</td>
            </tr>
          </tbody>
        </table>
      </template>
    </div>

    <Transition name="slide-panel">
      <aside v-if="selectedTask" class="side-panel" aria-labelledby="task-panel-title">
        <div class="side-panel-header">
          <h2 id="task-panel-title">
            {{ t('tasks.panel_title', { room: roomLabel(selectedTask.room_id) }) }}
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
          v-if="canOperate && !editing && allowedTransitions(selectedTask.status).length"
          class="action-toolbar"
          role="toolbar"
          :aria-label="t('tasks.panel_toolbar_aria')"
        >
          <button
            v-for="next in allowedTransitions(selectedTask.status)"
            :key="next"
            type="button"
            class="action-toolbar__btn"
            :class="transitionBtnClass(next)"
            :disabled="actionSaving"
            @click="applyStatus(next)"
          >
            {{ t(`tasks.status_action.${next}`) }}
          </button>
        </div>

        <div class="side-panel-body">
          <p v-if="panelError" class="form-error">{{ panelError }}</p>

          <template v-if="!editing">
            <dl class="side-panel-dl">
              <dt>{{ t('fields.status') }}</dt>
              <dd>
                <span class="task-status-badge" :class="statusBadgeClass(selectedTask.status)">{{
                  t(`tasks.status.${selectedTask.status}`)
                }}</span>
              </dd>
              <dt>{{ t('fields.room_number') }}</dt>
              <dd>{{ roomLabel(selectedTask.room_id) }}</dd>
              <template v-if="selectedTask.source === 'auto_checkout'">
                <dt>{{ t('tasks.source_label') }}</dt>
                <dd>{{ t('tasks.source.auto_checkout') }}</dd>
              </template>
              <template v-if="selectedTask.description">
                <dt>{{ t('tasks.col_description') }}</dt>
                <dd class="tasks-notes">{{ selectedTask.description }}</dd>
              </template>
              <template v-if="isMaintenance(selectedTask) && selectedTask.planned_end">
                <dt>{{ t('rooms.fields.planned_end') }}</dt>
                <dd>{{ formatDateTime(selectedTask.planned_end) }}</dd>
              </template>
              <dt>{{ t('tasks.col_assignee') }}</dt>
              <dd>{{ employeeLabel(selectedTask.assignee_employee_id) }}</dd>
              <dt>{{ t('tasks.col_updated') }}</dt>
              <dd>{{ formatDateTime(selectedTask.updated_at) }}</dd>
              <template v-if="selectedTask.completed_at">
                <dt>{{ t('tasks.completed_at') }}</dt>
                <dd>{{ formatDateTime(selectedTask.completed_at) }}</dd>
              </template>
              <template v-if="selectedTask.cancelled_at">
                <dt>{{ t('tasks.cancelled_at') }}</dt>
                <dd>{{ formatDateTime(selectedTask.cancelled_at) }}</dd>
              </template>
            </dl>

            <div
              v-if="canEdit && !isTerminal(selectedTask.status)"
              class="side-panel-inline-actions"
            >
              <button
                type="button"
                class="btn-secondary btn-compact"
                :disabled="actionSaving"
                @click="beginEdit"
              >
                {{ t('common.edit') }}
              </button>
            </div>

            <section
              v-if="canAssign && !canOperate && !isTerminal(selectedTask.status)"
              class="task-action-section"
            >
              <h3 class="task-action-section__title">{{ t('tasks.assign_title') }}</h3>
              <div class="task-action-section__row">
                <select
                  v-model="quickAssignSelection"
                  :disabled="actionSaving"
                  class="task-action-section__select"
                >
                  <option value="">{{ t('tasks.unassigned') }}</option>
                  <option v-for="emp in employees" :key="emp.id" :value="emp.id">
                    {{ employeeDisplay(emp) }}
                  </option>
                </select>
                <button
                  type="button"
                  class="btn-secondary btn-compact"
                  :disabled="
                    actionSaving ||
                    quickAssignSelection === (selectedTask.assignee_employee_id ?? '')
                  "
                  @click="submitQuickAssign"
                >
                  {{ t('common.save') }}
                </button>
              </div>
            </section>
          </template>

          <form v-else class="task-edit-form" @submit.prevent="submitEdit">
            <label v-if="canOperate">
              {{ t('tasks.col_description') }}
              <span class="optional">{{ t('common.optional') }}</span>
              <textarea
                v-model="editForm.description"
                rows="3"
                :placeholder="t('tasks.description_placeholder')"
                :disabled="actionSaving"
              />
            </label>
            <label v-if="canOperate && isMaintenanceDomain">
              {{ t('rooms.fields.planned_end') }}
              <abbr class="required" :title="t('common.required')">*</abbr>
              <input
                v-model="editForm.planned_end"
                type="datetime-local"
                required
                :disabled="actionSaving"
              />
            </label>
            <label v-if="canAssign">
              {{ t('tasks.col_assignee') }}
              <span class="optional">{{ t('common.optional') }}</span>
              <select v-model="editForm.assignee_employee_id" :disabled="actionSaving">
                <option value="">{{ t('tasks.unassigned') }}</option>
                <option v-for="emp in employees" :key="emp.id" :value="emp.id">
                  {{ employeeDisplay(emp) }}
                </option>
              </select>
            </label>
            <div class="task-edit-form__actions">
              <button
                type="button"
                class="btn-secondary"
                :disabled="actionSaving"
                @click="cancelEdit"
              >
                {{ t('common.cancel') }}
              </button>
              <button type="submit" :aria-busy="actionSaving" :disabled="actionSaving">
                {{ actionSaving ? t('common.saving') : t('common.save') }}
              </button>
            </div>
          </form>

        </div>
      </aside>
    </Transition>
  </section>

  <!-- Create task dialog -->
  <div v-if="createOpen" class="dialog-backdrop" @click.self="closeCreateDialog">
    <div class="dialog" role="dialog" aria-labelledby="task-create-title">
      <h2 id="task-create-title">{{ t('tasks.create_title', { domain: domainLabel }) }}</h2>
      <p v-if="createError" class="form-error">{{ createError }}</p>
      <form @submit.prevent="submitCreate">
        <label>
          {{ t('fields.room_number') }}
          <abbr class="required" :title="t('common.required')">*</abbr>
          <select v-model="createForm.room_id" required :disabled="createSaving">
            <option value="" disabled>{{ t('tasks.select_room_placeholder') }}</option>
            <option v-for="room in rooms" :key="room.id" :value="room.id">
              {{ roomDisplay(room) }}
            </option>
          </select>
        </label>
        <label>
          {{ t('tasks.col_description') }}
          <span class="optional">{{ t('common.optional') }}</span>
          <textarea
            v-model="createForm.description"
            rows="3"
            :placeholder="t('tasks.description_placeholder')"
            :disabled="createSaving"
          />
        </label>
        <template v-if="isMaintenanceDomain">
          <label>
            {{ t('rooms.fields.planned_end') }}
            <abbr class="required" :title="t('common.required')">*</abbr>
            <input
              v-model="createForm.planned_end"
              type="datetime-local"
              required
              :disabled="createSaving"
            />
          </label>
        </template>
        <label v-if="canAssign">
          {{ t('tasks.col_assignee') }}
          <span class="optional">{{ t('common.optional') }}</span>
          <select v-model="createForm.assignee_employee_id" :disabled="createSaving">
            <option value="">{{ t('tasks.unassigned') }}</option>
            <option v-for="emp in employees" :key="emp.id" :value="emp.id">
              {{ employeeDisplay(emp) }}
            </option>
          </select>
        </label>
        <div class="dialog-actions">
          <button type="button" class="btn-secondary" @click="closeCreateDialog">
            {{ t('common.cancel') }}
          </button>
          <button type="submit" :aria-busy="createSaving" :disabled="createSaving">
            {{ t('common.add') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useTasksStore } from '@/features/tasks/stores/useTasksStore'
import { usePropertyStore } from '@/features/property/stores/usePropertyStore'
import { useEmployeeStore } from '@/features/employees/stores/useEmployeeStore'
import type {
  HousekeepingTask,
  HousekeepingTaskStatus,
  MaintenanceTask,
  MaintenanceTaskStatus,
  TaskDomain,
  TaskStatus,
} from '@/shared/types/tasks'
import type { Room } from '@/shared/types/property'
import type { EmployeeListItem } from '@/shared/types/employees'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import { usePermissions } from '@/shared/composables/usePermissions'

type AnyTask = HousekeepingTask | MaintenanceTask

const props = defineProps<{
  domain: TaskDomain
}>()

const HOUSEKEEPING_STATUSES: HousekeepingTaskStatus[] = [
  'open',
  'in_progress',
  'inspection',
  'done',
  'cancelled',
]
const MAINTENANCE_STATUSES: MaintenanceTaskStatus[] = ['open', 'in_progress', 'done', 'cancelled']

const { t } = useI18n()
const tasksStore = useTasksStore()
const propertyStore = usePropertyStore()
const employeeStore = useEmployeeStore()
const permissions = usePermissions()
const { rooms } = storeToRefs(propertyStore)
const { employees } = storeToRefs(employeeStore)
const { housekeeping, maintenance } = storeToRefs(tasksStore)

const isMaintenanceDomain = computed(() => props.domain === 'maintenance')

const pageTitle = computed(() =>
  isMaintenanceDomain.value ? t('tasks.maintenance_title') : t('tasks.housekeeping_title'),
)
const domainLabel = computed(() =>
  isMaintenanceDomain.value ? t('tasks.domain.maintenance') : t('tasks.domain.housekeeping'),
)

const canCreate = computed(() =>
  isMaintenanceDomain.value
    ? permissions.canCreateMaintenanceTasks.value
    : permissions.canCreateHousekeepingTasks.value,
)
const canOperate = computed(() =>
  isMaintenanceDomain.value
    ? permissions.canOperateMaintenanceTasks.value
    : permissions.canOperateHousekeepingTasks.value,
)
const canAssign = computed(() =>
  isMaintenanceDomain.value
    ? permissions.canAssignMaintenanceTasks.value
    : permissions.canAssignHousekeepingTasks.value,
)

const tasks = computed<AnyTask[]>(() =>
  isMaintenanceDomain.value ? maintenance.value : housekeeping.value,
)
const statusOptions = computed<TaskStatus[]>(() =>
  isMaintenanceDomain.value ? MAINTENANCE_STATUSES : HOUSEKEEPING_STATUSES,
)

const statusFilter = ref<TaskStatus | ''>('')
const unassignedOnly = ref(false)

const initialLoading = ref(true)
const loadError = ref('')

const selectedTask = ref<AnyTask | null>(null)
const panelError = ref('')
const actionSaving = ref(false)
const quickAssignSelection = ref('')

const editing = ref(false)
const editForm = ref({
  description: '',
  planned_end: '',
  assignee_employee_id: '',
})

const canEdit = computed(() => canOperate.value || canAssign.value)

const createOpen = ref(false)
const createSaving = ref(false)
const createError = ref('')
const createForm = ref({
  room_id: '',
  description: '',
  planned_end: '',
  assignee_employee_id: '',
})

function isMaintenance(task: AnyTask): task is MaintenanceTask {
  return props.domain === 'maintenance'
}

function roomLabel(id: string | undefined): string {
  if (!id) return '—'
  const room = rooms.value.find((r) => r.id === id)
  return room?.number ?? id
}

function roomDisplay(room: Room): string {
  return `${room.number}${room.room_type_name ? ` — ${room.room_type_name}` : ''}`
}

function employeeLabel(id: string | null | undefined): string {
  if (!id) return t('tasks.unassigned')
  const emp = employees.value.find((e) => e.id === id)
  if (!emp) return id
  return employeeDisplay(emp)
}

function employeeDisplay(emp: EmployeeListItem): string {
  const name = [emp.first_name, emp.last_name].filter(Boolean).join(' ').trim()
  if (name) return name
  return emp.email || emp.id
}

function statusBadgeClass(status: TaskStatus): string {
  return `task-status-badge--${status}`
}

function transitionBtnClass(next: TaskStatus): string {
  // Start / Complete → positive (check-in); Send to inspection → neutral (check-out); Cancel → destructive.
  if (next === 'cancelled') return 'action-toolbar__btn--cancel'
  if (next === 'inspection') return 'action-toolbar__btn--check-out'
  return 'action-toolbar__btn--check-in'
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

function allowedTransitions(status: TaskStatus): TaskStatus[] {
  if (isMaintenanceDomain.value) {
    switch (status as MaintenanceTaskStatus) {
      case 'open':
        return ['in_progress', 'cancelled']
      case 'in_progress':
        return ['done', 'cancelled']
      default:
        return []
    }
  }
  switch (status as HousekeepingTaskStatus) {
    case 'open':
      return ['in_progress', 'cancelled']
    case 'in_progress':
      return ['inspection', 'cancelled']
    case 'inspection':
      return ['done', 'cancelled']
    default:
      return []
  }
}

async function reload() {
  loadError.value = ''
  const query = {
    status: statusFilter.value || undefined,
    unassigned: unassignedOnly.value || undefined,
  }
  try {
    if (isMaintenanceDomain.value) {
      await tasksStore.fetchMaintenance(query)
    } else {
      await tasksStore.fetchHousekeeping(query)
    }
  } catch (err: unknown) {
    loadError.value = formatUnknownApiError(err) || t('tasks.load_failed')
  } finally {
    initialLoading.value = false
  }
}

async function loadSupporting() {
  const ops: Promise<unknown>[] = []
  if (!rooms.value.length) ops.push(propertyStore.fetchRooms())
  if (!employees.value.length && canAssign.value) {
    ops.push(employeeStore.fetchEmployees())
  }
  try {
    await Promise.all(ops)
  } catch {
    // non-fatal
  }
}

function isTerminal(status: TaskStatus): boolean {
  return status === 'done' || status === 'cancelled'
}

function toDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function openPanel(task: AnyTask) {
  selectedTask.value = task
  panelError.value = ''
  editing.value = false
  quickAssignSelection.value = task.assignee_employee_id ?? ''
}

function closePanel() {
  selectedTask.value = null
  editing.value = false
}

function beginEdit() {
  const task = selectedTask.value
  if (!task) return
  editForm.value = {
    description: task.description ?? '',
    planned_end: isMaintenance(task) ? toDateTimeLocal(task.planned_end) : '',
    assignee_employee_id: task.assignee_employee_id ?? '',
  }
  panelError.value = ''
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  panelError.value = ''
}

async function submitEdit() {
  const task = selectedTask.value
  if (!task) return
  actionSaving.value = true
  panelError.value = ''
  try {
    let updated: AnyTask
    if (isMaintenanceDomain.value) {
      const body: {
        description?: string
        planned_end?: string | null
        assignee_employee_id?: string | null
      } = {}
      if (canOperate.value) {
        body.description = editForm.value.description.trim()
        body.planned_end = editForm.value.planned_end
          ? new Date(editForm.value.planned_end).toISOString()
          : null
      }
      if (canAssign.value) {
        body.assignee_employee_id = editForm.value.assignee_employee_id || null
      }
      updated = await tasksStore.updateMaintenance(task.id, body)
    } else {
      const body: { description?: string; assignee_employee_id?: string | null } = {}
      if (canOperate.value) {
        body.description = editForm.value.description.trim()
      }
      if (canAssign.value) {
        body.assignee_employee_id = editForm.value.assignee_employee_id || null
      }
      updated = await tasksStore.updateHousekeeping(task.id, body)
    }
    selectedTask.value = updated
    quickAssignSelection.value = updated.assignee_employee_id ?? ''
    editing.value = false
    if (updated.room_id) {
      void propertyStore.refreshRoom(updated.room_id).catch(() => {})
    }
  } catch (err: unknown) {
    panelError.value = formatUnknownApiError(err) || t('tasks.save_failed')
  } finally {
    actionSaving.value = false
  }
}

async function submitQuickAssign() {
  const task = selectedTask.value
  if (!task) return
  const next = quickAssignSelection.value || null
  actionSaving.value = true
  panelError.value = ''
  try {
    const updated = isMaintenanceDomain.value
      ? await tasksStore.updateMaintenance(task.id, { assignee_employee_id: next })
      : await tasksStore.updateHousekeeping(task.id, { assignee_employee_id: next })
    selectedTask.value = updated
  } catch (err: unknown) {
    panelError.value = formatUnknownApiError(err) || t('tasks.save_failed')
  } finally {
    actionSaving.value = false
  }
}

async function applyStatus(next: TaskStatus) {
  const task = selectedTask.value
  if (!task) return
  actionSaving.value = true
  panelError.value = ''
  try {
    const updated = isMaintenanceDomain.value
      ? await tasksStore.changeMaintenanceStatus(task.id, {
          status: next as Exclude<MaintenanceTaskStatus, 'open'>,
        })
      : await tasksStore.changeHousekeepingStatus(task.id, {
          status: next as Exclude<HousekeepingTaskStatus, 'open'>,
        })
    selectedTask.value = updated
    if (updated.room_id) {
      void propertyStore.refreshRoom(updated.room_id).catch(() => {})
    }
  } catch (err: unknown) {
    panelError.value = formatUnknownApiError(err) || t('tasks.save_failed')
  } finally {
    actionSaving.value = false
  }
}

function openCreateDialog() {
  createForm.value = {
    room_id: '',
    description: '',
    planned_end: '',
    assignee_employee_id: '',
  }
  createError.value = ''
  createOpen.value = true
}

function closeCreateDialog() {
  createOpen.value = false
}

async function submitCreate() {
  if (!createForm.value.room_id) return
  createSaving.value = true
  createError.value = ''
  try {
    const description = createForm.value.description?.trim() || undefined
    const assignee = createForm.value.assignee_employee_id || undefined
    if (isMaintenanceDomain.value) {
      if (!createForm.value.planned_end) return
      await tasksStore.createMaintenance({
        room_id: createForm.value.room_id,
        description,
        planned_end: new Date(createForm.value.planned_end).toISOString(),
        assignee_employee_id: assignee,
      })
    } else {
      await tasksStore.createHousekeeping({
        room_id: createForm.value.room_id,
        description,
        assignee_employee_id: assignee,
      })
    }
    closeCreateDialog()
  } catch (err: unknown) {
    createError.value = formatUnknownApiError(err) || t('tasks.save_failed')
  } finally {
    createSaving.value = false
  }
}

watch(
  () => props.domain,
  () => {
    selectedTask.value = null
    initialLoading.value = true
    statusFilter.value = ''
    unassignedOnly.value = false
    void loadSupporting()
    void reload()
  },
)

onMounted(async () => {
  await loadSupporting()
  await reload()
})
</script>

<style scoped>
.content-toolbar {
  margin-bottom: var(--space-micro);
}

.toolbar-cluster--start {
  gap: var(--space-md);
}

.toolbar-check {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  margin: 0;
  font-size: var(--text-caption-size);
  font-weight: var(--text-label-weight);
  color: var(--ink-tertiary);
  cursor: pointer;
}

.toolbar-check input {
  margin: 0;
}

.tasks-notes {
  white-space: pre-line;
}

.task-status-badge {
  display: inline-block;
  padding: var(--space-micro) var(--space-xs);
  font-size: var(--text-caption-size);
  font-weight: var(--text-label-weight);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.task-status-badge--open {
  color: var(--semantic-warning);
  background: var(--semantic-warning-bg);
  border-color: color-mix(in srgb, var(--semantic-warning) 40%, var(--border-default));
}

.task-status-badge--in_progress {
  color: var(--semantic-info);
  background: var(--semantic-info-bg);
  border-color: color-mix(in srgb, var(--semantic-info) 30%, var(--border-default));
}

.task-status-badge--inspection {
  color: var(--brand-primary);
  background: color-mix(in srgb, var(--brand-primary) 10%, var(--surface-1));
  border-color: color-mix(in srgb, var(--brand-primary) 35%, var(--border-default));
}

.task-status-badge--done {
  color: var(--semantic-success);
  background: var(--semantic-success-bg);
  border-color: rgba(45, 138, 62, 0.3);
}

.task-status-badge--cancelled {
  color: var(--ink-tertiary);
  background: var(--surface-2);
}

.task-action-section {
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--border-subtle);
}

.task-action-section__title {
  margin: 0 0 var(--space-xs);
  font-family: var(--font-display);
  font-size: var(--text-label-size);
  font-weight: var(--text-label-weight);
  color: var(--ink-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.task-action-section__row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.task-action-section__select {
  margin: 0;
  flex: 1 1 12rem;
}

.btn-compact {
  padding: var(--space-micro) var(--space-sm);
  font-size: var(--text-caption-size);
}

.side-panel-inline-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-sm);
}

.task-edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-top: var(--space-xs);
}

.task-edit-form label {
  display: block;
}

.task-edit-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-xs);
}
</style>
