<template>
  <Teleport to="body">
    <div class="dialog-backdrop" role="presentation" @click.self="onCancel">
      <div
        class="dialog manage-permissions-dialog"
        role="dialog"
        :aria-labelledby="titleId"
        aria-modal="true"
      >
        <h2 :id="titleId" class="manage-permissions-dialog__title">
          {{ t('employees.manage_permissions_action') }}
        </h2>

        <div class="manage-permissions-dialog__body">
          <PermissionMatrix v-model="merged" :disabled="saving" />
        </div>

        <div class="dialog-actions">
          <button type="button" class="btn-secondary" :disabled="saving" @click="onCancel">
            {{ t('common.cancel') }}
          </button>
          <button type="button" :disabled="saving" @click="onSave">
            {{ saving ? t('common.saving') : t('common.save') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import PermissionMatrix from '@/features/employees/components/PermissionMatrix.vue'
import { replaceEmployeePermissions } from '@/features/employees/api'
import type { EmployeePermissionsResponse, Permissions } from '@/shared/types/permissions'
import {
  clonePermissions,
  permissionLevel,
  PERMISSION_AREA_ORDER,
  permissionActionsFor,
} from '@/shared/lib/permissions'
import { useNotification } from '@/shared/composables/useNotification'

const props = defineProps<{
  employeeId: string
  initialPermissions: Permissions
  initialOverrides: Permissions
}>()

const emit = defineEmits<{
  close: []
  saved: [EmployeePermissionsResponse]
}>()

const { t } = useI18n()
const { success } = useNotification()
const titleId = useId()

// The actual state: overrides. Display is derived (effective + overrides on top).
const overrides = ref<Permissions>(clonePermissions(props.initialOverrides))
const saving = ref(false)

const merged = computed<Permissions>({
  get: () => {
    const m = clonePermissions(props.initialPermissions)
    for (const area of PERMISSION_AREA_ORDER) {
      const section = overrides.value[area] as Record<string, number | undefined> | undefined
      if (!section) continue
      for (const action of permissionActionsFor(area)) {
        const level = section[action]
        if (level === undefined) continue
        const target = (m[area] ?? {}) as Record<string, number>
        target[action] = level
        m[area] = target as Permissions[typeof area]
      }
    }
    return m
  },
  set: (next) => {
    const prev = merged.value
    const updated = clonePermissions(overrides.value)
    for (const area of PERMISSION_AREA_ORDER) {
      for (const action of permissionActionsFor(area)) {
        const nextLevel = permissionLevel(next, area, action)
        if (nextLevel === permissionLevel(prev, area, action)) continue
        const section = (updated[area] ?? {}) as Record<string, number>
        section[action] = nextLevel
        updated[area] = section as Permissions[typeof area]
      }
    }
    overrides.value = updated
  },
})

function onCancel() {
  if (!saving.value) emit('close')
}

async function onSave() {
  if (saving.value) return
  saving.value = true
  try {
    const res = await replaceEmployeePermissions(props.employeeId, overrides.value)
    success(t('employees.access_settings_saved'))
    emit('saved', res)
  } catch {
    /* Global toast via interceptor */
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.manage-permissions-dialog {
  max-width: 640px;
  width: 100%;
}

.manage-permissions-dialog__title {
  font-size: var(--text-heading-size);
  font-weight: var(--text-heading-weight);
  color: var(--ink-primary);
  margin: 0 0 var(--space-md);
}

.manage-permissions-dialog__body {
  max-height: 60vh;
  overflow-y: auto;
  margin-bottom: var(--space-md);
}
</style>
