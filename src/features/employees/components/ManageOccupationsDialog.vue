<template>
  <Teleport to="body">
    <div class="dialog-backdrop" role="presentation" @click.self="onCancel">
      <div
        class="dialog manage-occupations-dialog"
        role="dialog"
        :aria-labelledby="titleId"
        aria-modal="true"
      >
        <h2 :id="titleId" class="manage-occupations-dialog__title">
          {{ t('employees.manage_occupations_action') }}
        </h2>

        <p v-if="loading" class="loading-state">{{ t('common.loading') }}</p>
        <p v-else-if="loadError" class="error-message">{{ loadError }}</p>
        <p v-else-if="!roleGroups.length" class="empty-state">
          {{ t('employees.occupations_empty') }}
        </p>
        <div v-else class="manage-occupations-dialog__body">
          <div
            v-for="group in roleGroups"
            :key="group.role_key"
            class="manage-occupations-dialog__group"
          >
            <h3 class="manage-occupations-dialog__group-title">
              {{ roleLabel(group.role_key, group.role_title) }}
            </h3>
            <label
              v-for="occ in group.occupations"
              :key="occ.id"
              class="manage-occupations-dialog__item"
            >
              <input
                type="checkbox"
                :checked="selected.includes(occ.id)"
                :disabled="saving"
                @change="toggle(occ.id, $event)"
              />
              <span>{{ displayTitle(occ.title) }}</span>
            </label>
          </div>
        </div>

        <div class="dialog-actions">
          <button type="button" class="btn-secondary" :disabled="saving" @click="onCancel">
            {{ t('common.cancel') }}
          </button>
          <button type="button" :disabled="saving || loading || !!loadError" @click="onSave">
            {{ saving ? t('common.saving') : t('common.save') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  listOccupations,
  replaceEmployeeOccupations,
  type OccupationRoleGroup,
} from '@/features/employees/api'
import type { EmployeeOccupationsResponse } from '@/shared/types/permissions'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import { useNotification } from '@/shared/composables/useNotification'

const props = defineProps<{
  employeeId: string
  initialOccupationIds: string[]
}>()

const emit = defineEmits<{
  close: []
  saved: [EmployeeOccupationsResponse]
}>()

const { t, te } = useI18n()
const { success } = useNotification()
const titleId = useId()

const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const roleGroups = ref<OccupationRoleGroup[]>([])
const selected = ref<string[]>([...props.initialOccupationIds])

function roleLabel(roleKey: string, roleTitleKey: string): string {
  if (roleTitleKey && te(roleTitleKey)) return t(roleTitleKey)
  const src = roleKey.trim()
  if (!src) return t('employees.role_unknown')
  return src
    .split('_')
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

function displayTitle(title: string): string {
  const src = (title ?? '').trim()
  if (!src) return t('occupations.untitled')
  return te(src) ? t(src) : src
}

function toggle(id: string, event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  if (checked) {
    if (!selected.value.includes(id)) selected.value = [...selected.value, id]
  } else {
    selected.value = selected.value.filter((x) => x !== id)
  }
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    roleGroups.value = await listOccupations()
  } catch (err: unknown) {
    loadError.value = formatUnknownApiError(err) || t('employees.access_settings_load_failed')
  } finally {
    loading.value = false
  }
}

function onCancel() {
  if (!saving.value) emit('close')
}

async function onSave() {
  if (saving.value) return
  saving.value = true
  try {
    const res = await replaceEmployeeOccupations(props.employeeId, selected.value)
    success(t('employees.access_settings_saved'))
    emit('saved', res)
  } catch {
    /* Global toast via interceptor */
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.manage-occupations-dialog {
  max-width: 520px;
  width: 100%;
}

.manage-occupations-dialog__title {
  font-size: var(--text-heading-size);
  font-weight: var(--text-heading-weight);
  color: var(--ink-primary);
  margin: 0 0 var(--space-md);
}

.manage-occupations-dialog__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-height: 60vh;
  overflow-y: auto;
  margin-bottom: var(--space-md);
}

.manage-occupations-dialog__group-title {
  font-family: var(--font-display);
  font-size: var(--text-caption-size);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-muted);
  margin: 0 0 var(--space-xs);
}

.manage-occupations-dialog__item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) 0;
  margin: 0;
  font-size: var(--text-label-size);
  cursor: pointer;
}

.manage-occupations-dialog__item input {
  margin: 0;
}
</style>
