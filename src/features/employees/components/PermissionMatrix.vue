<template>
  <div class="permission-matrix">
    <section
      v-for="area in PERMISSION_AREA_ORDER"
      :key="area"
      class="panel permission-matrix__section"
    >
      <h3 class="permission-matrix__title">{{ t(`permissions.areas.${area}`) }}</h3>
      <div class="permission-matrix__list">
        <div
          v-for="action in permissionActionsFor(area)"
          v-show="isActionVisible(modelValue, area, action)"
          :key="`${area}.${action}`"
          class="permission-matrix__row"
        >
          <span class="permission-matrix__action">
            {{ t(`permissions.actions.${area}.${action}`) }}
          </span>
          <select
            class="permission-matrix__select"
            :disabled="disabled"
            :value="displayValue(area, action)"
            @change="onChange(area, action, $event)"
          >
            <option v-if="allowUnset" value="">
              {{ t('permissions.level.unset') }}
            </option>
            <option
              v-for="level in levelOptionsFor(area, action)"
              :key="level"
              :value="String(level)"
            >
              {{ t(`permissions.level.${level}`) }}
            </option>
          </select>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import type { Permissions } from '@/shared/types/permissions'
import {
  PERMISSION_AREA_ORDER,
  permissionActionsFor,
  clonePermissions,
  normalizePermissionLevel,
  permissionLevel,
  isActionVisible,
  cascadePermissionReset,
  type PermissionAction,
  type PermissionArea,
} from '@/shared/lib/permissions'
import { useSettingsStore } from '@/shared/stores/useSettingsStore'

const props = withDefaults(
  defineProps<{
    modelValue: Permissions | null | undefined
    allowUnset?: boolean
    disabled?: boolean
  }>(),
  {
    allowUnset: false,
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [Permissions]
}>()

const { t } = useI18n()
const settingsStore = useSettingsStore()
const { permissions: userPermissions } = storeToRefs(settingsStore)

// Cap selectable level by the current user's own `hotel.manage_permissions` level:
// you can't grant scopes broader than your own authority to manage permissions.
const userMaxLevel = computed(
  () => permissionLevel(userPermissions.value, 'hotel', 'manage_permissions') as number,
)

function levelOptionsFor(area: PermissionArea, action: PermissionAction): number[] {
  const current = permissionLevel(props.modelValue, area, action) as number
  const max = Math.max(userMaxLevel.value, current)
  return [0, 1, 2, 3].filter((level) => level <= max)
}

function displayValue(area: PermissionArea, action: PermissionAction): string {
  const current = permissionLevel(props.modelValue, area, action)
  if (props.allowUnset) {
    const section = props.modelValue?.[area] as Record<string, number | undefined> | undefined
    return section?.[action] === undefined ? '' : String(current)
  }
  return String(current)
}

function onChange(area: PermissionArea, action: PermissionAction, event: Event) {
  let next = clonePermissions(props.modelValue)
  const value = (event.target as HTMLSelectElement).value
  const section = (next[area] ?? {}) as Record<string, number | undefined>

  if (props.allowUnset && value === '') {
    delete section[action]
  } else {
    section[action] = normalizePermissionLevel(Number(value)) ?? 0
  }

  if (Object.keys(section).length) next[area] = section as Permissions[typeof area]
  else delete next[area]

  next = cascadePermissionReset(next, area, action)

  emit('update:modelValue', next)
}
</script>

<style scoped>
.permission-matrix {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.permission-matrix__section {
  margin: 0;
}

.permission-matrix__title {
  margin: 0 0 var(--space-sm);
  font-family: var(--font-display);
  font-size: var(--text-base);
}

.permission-matrix__list {
  display: flex;
  flex-direction: column;
}

.permission-matrix__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-xs) 0;
  border-bottom: 1px solid var(--border-subtle);
}

.permission-matrix__row:last-child {
  border-bottom: none;
}

.permission-matrix__action {
  font-size: var(--text-label-size);
  color: var(--ink-primary);
}

.permission-matrix__select {
  margin: 0;
  width: auto;
  min-width: 10rem;
}
</style>
