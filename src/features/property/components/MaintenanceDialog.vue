<template>
  <Teleport to="body">
    <div v-if="open" class="dialog-backdrop" role="presentation" @click.self="emit('close')">
      <div class="dialog" role="dialog" aria-modal="true" :aria-labelledby="titleId">
        <h2 :id="titleId">{{ t('rooms.maintenance_dialog.title') }}</h2>
        <p v-if="errorMsg" class="form-error">{{ errorMsg }}</p>
        <form @submit.prevent="submit">
          <label>
            {{ t('fields.status') }}
            <select v-model="form.status" :disabled="saving">
              <option v-for="s in allowedStatuses" :key="s" :value="s">
                {{ t(`rooms.maintenance_status.${s}`) }}
              </option>
            </select>
          </label>
          <label v-if="form.status === 'under_maintenance'">
            {{ t('rooms.fields.planned_end') }}
            <abbr class="required" :title="t('common.required')">*</abbr>
            <input v-model="form.planned_end" type="datetime-local" required :disabled="saving" />
          </label>
          <div class="dialog-actions">
            <button type="button" class="btn-secondary" :disabled="saving" @click="emit('close')">
              {{ t('common.cancel') }}
            </button>
            <button type="submit" :aria-busy="saving" :disabled="saving">
              {{ saving ? t('common.saving') : t('common.save') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePropertyStore } from '@/features/property/stores/usePropertyStore'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import type { Room, RoomMaintenanceStatus } from '@/shared/types/property'

const props = withDefaults(
  defineProps<{
    open: boolean
    room: Room | null
    allowedStatuses?: RoomMaintenanceStatus[]
  }>(),
  { allowedStatuses: () => ['none', 'required', 'under_maintenance'] },
)

const emit = defineEmits<{
  close: []
  saved: [room: Room]
}>()

const { t } = useI18n()
const store = usePropertyStore()
const titleId = useId()

const form = ref<{
  status: RoomMaintenanceStatus
  planned_end: string
}>({ status: 'none', planned_end: '' })
const saving = ref(false)
const errorMsg = ref('')

watch(
  () => [props.open, props.room?.id] as const,
  ([open]) => {
    if (!open) return
    const r = props.room
    const allowed = props.allowedStatuses
    const current = r?.maintenance_status as RoomMaintenanceStatus | undefined
    const initial: RoomMaintenanceStatus =
      current && allowed.includes(current) ? current : (allowed[0] ?? 'none')
    form.value = {
      status: initial,
      planned_end: toLocalDateTimeInput(r?.maintenance_planned_end ?? ''),
    }
    errorMsg.value = ''
    saving.value = false
  },
  { immediate: true },
)

function toLocalDateTimeInput(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function submit() {
  const r = props.room
  if (!r?.id) return
  const body: {
    status: RoomMaintenanceStatus
    planned_end?: string | null
  } = { status: form.value.status }
  if (form.value.status === 'under_maintenance') {
    if (!form.value.planned_end) return
    body.planned_end = new Date(form.value.planned_end).toISOString()
  }
  saving.value = true
  errorMsg.value = ''
  try {
    const updated = await store.changeRoomMaintenance(r.id, body)
    emit('saved', updated)
  } catch (err: unknown) {
    errorMsg.value = formatUnknownApiError(err) || t('rooms.load_failed')
  } finally {
    saving.value = false
  }
}
</script>
