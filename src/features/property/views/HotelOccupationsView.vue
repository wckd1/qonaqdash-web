<template>
  <header class="page-header">
    <h1>{{ t('hotel.title') }}</h1>
  </header>

  <PropertySubNav />

  <p v-if="loadError" class="error-message">{{ loadError }}</p>
  <div v-else-if="loading" class="loading-state">{{ t('common.loading') }}</div>

  <div v-else class="occupations-explorer">
    <!-- Left: grouped tree -->
    <aside class="occupations-explorer__tree">
      <div v-for="group in roleGroups" :key="group.role_key" class="occupations-explorer__group">
        <h3 class="occupations-explorer__group-title">
          {{ roleLabel(group.role_key, group.role_title) }}
        </h3>
        <ul class="occupations-explorer__list">
          <li
            v-for="occ in group.occupations"
            :key="occ.id"
            :class="[
              'occupations-explorer__item',
              { 'occupations-explorer__item--selected': selectedId === occ.id && mode === 'edit' },
            ]"
            @click="selectOccupation(occ.id)"
          >
            {{ displayTitle(occ.title) }}
          </li>
          <li
            :class="[
              'occupations-explorer__item occupations-explorer__item--add',
              {
                'occupations-explorer__item--selected':
                  mode === 'create' && creatingRoleKey === group.role_key,
              },
            ]"
            @click="startCreate(group.role_key)"
          >
            + {{ t('occupations.create_action') }}
          </li>
        </ul>
      </div>
    </aside>

    <!-- Right: detail / create / empty -->
    <section class="occupations-explorer__detail">
      <!-- Create mode -->
      <template v-if="mode === 'create'">
        <div class="panel occupations-explorer__detail-header">
          <div class="occupations-explorer__detail-header-text">
            <h2 class="occupations-explorer__detail-title">
              {{ t('occupations.create_action') }}
            </h2>
            <p class="occupations-explorer__hint">
              {{ roleLabel(creatingRoleKey, creatingRoleTitle) }}
            </p>
          </div>
          <div class="occupations-explorer__detail-actions">
            <button type="button" class="btn-secondary" :disabled="saving" @click="clearSelection">
              {{ t('common.cancel') }}
            </button>
            <button type="button" :disabled="saving || !createDraft.title.trim()" @click="onCreate">
              {{ saving ? t('common.saving') : t('occupations.create_action') }}
            </button>
          </div>
        </div>

        <div class="occupations-explorer__detail-body">
          <label>
            {{ t('occupations.fields.title') }}
            <input v-model="createDraft.title" type="text" :disabled="saving" />
          </label>

          <PermissionMatrix v-model="createDraft.permissions" :disabled="saving" />
        </div>
      </template>

      <!-- Edit mode -->
      <template v-else-if="mode === 'edit' && editDraft">
        <div class="panel occupations-explorer__detail-header">
          <div class="occupations-explorer__detail-header-text">
            <h2 class="occupations-explorer__detail-title">
              {{ displayTitle(editDraft.title) }}
            </h2>
            <p class="occupations-explorer__hint">
              {{ roleLabel(editDraft.role_key, editDraft.role_title) }}
            </p>
          </div>
          <div class="occupations-explorer__detail-actions">
            <button
              type="button"
              class="btn-secondary"
              :disabled="editDraft.saving || !isDirty"
              @click="resetDraft"
            >
              {{ t('common.reset') }}
            </button>
            <button type="button" :disabled="editDraft.saving || !isDirty" @click="saveDraft">
              {{ editDraft.saving ? t('common.saving') : t('common.save') }}
            </button>
            <button
              type="button"
              class="btn-secondary occupations-explorer__danger"
              :disabled="editDraft.saving"
              @click="removeDraft"
            >
              {{ t('occupations.delete_action') }}
            </button>
          </div>
        </div>

        <div class="occupations-explorer__detail-body">
          <label>
            {{ t('occupations.fields.title') }}
            <input v-model="editDraft.title" type="text" :disabled="editDraft.saving" />
          </label>

          <PermissionMatrix v-model="editDraft.permissions" :disabled="editDraft.saving" />
        </div>
      </template>

      <!-- Empty state -->
      <template v-else>
        <div class="occupations-explorer__empty">
          <p>{{ t('occupations.select_hint') }}</p>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PropertySubNav from '@/features/property/components/PropertySubNav.vue'
import PermissionMatrix from '@/features/employees/components/PermissionMatrix.vue'
import {
  createOccupation,
  deleteOccupation,
  listOccupations,
  updateOccupation,
  type OccupationRoleGroup,
  type OccupationTemplate,
} from '@/features/employees/api'
import { clonePermissions } from '@/shared/lib/permissions'
import type { Permissions } from '@/shared/types/permissions'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import { useNotification } from '@/shared/composables/useNotification'

interface OccupationDraft extends OccupationTemplate {
  original: OccupationTemplate
  saving: boolean
}

const { t, te } = useI18n()
const { success } = useNotification()

const loading = ref(true)
const saving = ref(false)
const loadError = ref('')
const roleGroups = ref<OccupationRoleGroup[]>([])
const drafts = ref<OccupationDraft[]>([])

// Selection state
const selectedId = ref<string | null>(null)
const mode = ref<'none' | 'edit' | 'create'>('none')
const creatingRoleKey = ref('')
const createDraft = reactive<{ title: string; permissions: Permissions }>({
  title: '',
  permissions: {},
})

// Computed
const editDraft = computed(() =>
  mode.value === 'edit' ? (drafts.value.find((d) => d.id === selectedId.value) ?? null) : null,
)

const creatingRoleTitle = computed(() => {
  const group = roleGroups.value.find((g) => g.role_key === creatingRoleKey.value)
  return group?.role_title ?? ''
})

const isDirty = computed(() => {
  const draft = editDraft.value
  if (!draft) return false
  return (
    JSON.stringify({ title: draft.title, permissions: draft.permissions }) !==
    JSON.stringify({ title: draft.original.title, permissions: draft.original.permissions })
  )
})

// Helpers
function roleLabel(roleKey: string, roleTitleKey: string): string {
  if (roleTitleKey && te(roleTitleKey)) return t(roleTitleKey)
  const source = roleKey.trim()
  if (!source) return t('occupations.role_unknown')
  return source
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/**
 * Title may be an i18n key (e.g. `iam.occupations.chain_director`). Translate when known,
 * fall back to the raw value so custom titles still render.
 */
function displayTitle(title: string): string {
  const source = (title ?? '').trim()
  if (!source) return t('occupations.untitled')
  return te(source) ? t(source) : source
}

/**
 * Resolve a stored title to its localized form without the "Untitled" fallback, so editable
 * inputs and draft state always carry the human-readable string the admin sees.
 */
function resolveStoredTitle(title: string): string {
  const source = (title ?? '').trim()
  if (!source) return ''
  return te(source) ? t(source) : title
}

function createLocalDraft(occupation: OccupationTemplate): OccupationDraft {
  const resolvedTitle = resolveStoredTitle(occupation.title)
  return {
    ...occupation,
    title: resolvedTitle,
    permissions: clonePermissions(occupation.permissions),
    original: {
      ...occupation,
      title: resolvedTitle,
      permissions: clonePermissions(occupation.permissions),
    },
    saving: false,
  }
}

function syncGroups(groups: OccupationRoleGroup[]) {
  roleGroups.value = groups
  drafts.value = groups.flatMap((group) => group.occupations.map(createLocalDraft))
}

// Selection
function selectOccupation(id: string) {
  selectedId.value = id
  mode.value = 'edit'
}

function startCreate(roleKey: string) {
  creatingRoleKey.value = roleKey
  createDraft.title = ''
  createDraft.permissions = {}
  mode.value = 'create'
  selectedId.value = null
}

function clearSelection() {
  mode.value = 'none'
  selectedId.value = null
  creatingRoleKey.value = ''
}

// Data loading
async function load() {
  loadError.value = ''
  loading.value = true
  try {
    const groups = await listOccupations()
    syncGroups(groups)
  } catch (err: unknown) {
    loadError.value = formatUnknownApiError(err) || t('occupations.load_failed')
  } finally {
    loading.value = false
  }
}

// CRUD
async function onCreate() {
  if (!createDraft.title.trim()) return
  saving.value = true
  try {
    const created = await createOccupation({
      title: createDraft.title.trim(),
      role_key: creatingRoleKey.value,
      permissions: createDraft.permissions,
    })
    await load()
    success(t('occupations.created'))
    // Select the newly created occupation
    if (created?.id) selectOccupation(created.id)
    else clearSelection()
  } catch {
    /* Global API interceptor shows the toast. */
  } finally {
    saving.value = false
  }
}

async function saveDraft() {
  const draft = editDraft.value
  if (!draft || !isDirty.value) return
  draft.saving = true
  try {
    await updateOccupation(draft.id, {
      title: draft.title.trim(),
      role_key: draft.role_key,
      permissions: draft.permissions,
    })
    await load()
    success(t('occupations.saved'))
    // Keep current selection
    selectOccupation(draft.id)
  } catch {
    draft.saving = false
  }
}

function resetDraft() {
  const draft = editDraft.value
  if (!draft) return
  const idx = drafts.value.findIndex((d) => d.id === draft.id)
  if (idx >= 0) drafts.value[idx] = createLocalDraft(draft.original)
}

async function removeDraft() {
  const draft = editDraft.value
  if (!draft) return
  if (!window.confirm(t('occupations.delete_confirm', { title: draft.title || draft.id }))) return
  draft.saving = true
  try {
    await deleteOccupation(draft.id)
    clearSelection()
    await load()
    success(t('occupations.deleted'))
  } catch {
    draft.saving = false
  }
}

onMounted(load)
</script>

<style scoped>
.occupations-explorer {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: var(--space-lg);
  flex: 1;
  min-height: 0;
}

.occupations-explorer__tree {
  overflow-y: auto;
  border-right: 1px solid var(--border-subtle);
  padding-right: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.occupations-explorer__group {
  margin-bottom: var(--space-xs);
}

.occupations-explorer__group-title {
  font-family: var(--font-display);
  font-size: var(--text-caption-size);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-muted);
  margin: var(--space-sm) 0 var(--space-xs);
  padding: 0 var(--space-sm);
}

.occupations-explorer__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.occupations-explorer__item {
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-label-size);
  transition: background-color 0.12s ease;
}

.occupations-explorer__item:hover {
  background: color-mix(in srgb, var(--brand-primary) 6%, transparent);
}

.occupations-explorer__item--selected {
  background: color-mix(in srgb, var(--brand-primary) 14%, transparent);
  color: color-mix(in srgb, var(--brand-primary) 60%, var(--ink-primary));
  font-weight: 600;
}

.occupations-explorer__item--add {
  color: var(--brand-primary);
  font-size: var(--text-caption-size);
}

.occupations-explorer__detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  min-height: 0;
}

.occupations-explorer__detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
  flex-shrink: 0;
}

.occupations-explorer__detail-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding-bottom: var(--space-sm);
}

.occupations-explorer__detail-header-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
}

.occupations-explorer__detail-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-lg);
}

.occupations-explorer__hint {
  margin: 0;
  font-size: var(--text-caption-size);
  font-weight: var(--text-caption-weight);
  color: var(--ink-muted);
}

.occupations-explorer__detail-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

.occupations-explorer__danger {
  color: var(--semantic-error);
  border-color: color-mix(in srgb, var(--semantic-error) 28%, var(--border-default));
}

.occupations-explorer__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--ink-muted);
  font-size: var(--text-label-size);
}

.occupations-explorer__empty p {
  margin: 0;
}

@media (max-width: 680px) {
  .occupations-explorer {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .occupations-explorer__tree {
    border-right: none;
    border-bottom: 1px solid var(--border-subtle);
    padding-right: 0;
    padding-bottom: var(--space-md);
    max-height: 200px;
  }

  .occupations-explorer__detail-header {
    flex-direction: column;
  }
}
</style>
