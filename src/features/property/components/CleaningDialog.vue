<template>
  <Teleport to="body">
    <div v-if="open" class="dialog-backdrop" role="presentation" @click.self="emit('close')">
      <div class="dialog" role="dialog" aria-modal="true" :aria-labelledby="titleId">
        <h2 :id="titleId">{{ t('rooms.cleaning_dialog.title') }}</h2>
        <p v-if="errorMsg" class="form-error">{{ errorMsg }}</p>
        <form @submit.prevent="submit">
          <label>
            {{ t('rooms.axis.housekeeping') }}
            <select v-model="form.status" :disabled="saving">
              <option v-for="s in allowedStatuses" :key="s" :value="s">
                {{ t(`rooms.housekeeping_status.${s}`) }}
              </option>
            </select>
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
import type { Room, RoomHousekeepingStatus } from '@/shared/types/property'

const props = withDefaults(
  defineProps<{
    open: boolean
    room: Room | null
    allowedStatuses?: RoomHousekeepingStatus[]
  }>(),
  { allowedStatuses: () => ['dirty', 'cleaning', 'inspection', 'clean'] },
)

const emit = defineEmits<{
  close: []
  saved: [room: Room]
}>()

const { t } = useI18n()
const store = usePropertyStore()
const titleId = useId()

const form = ref<{ status: RoomHousekeepingStatus }>({ status: 'clean' })
const saving = ref(false)
const errorMsg = ref('')

watch(
  () => [props.open, props.room?.id] as const,
  ([open]) => {
    if (!open) return
    const r = props.room
    const allowed = props.allowedStatuses
    const current = r?.housekeeping_status as RoomHousekeepingStatus | undefined
    const initial: RoomHousekeepingStatus =
      current && allowed.includes(current) ? current : (allowed[0] ?? 'clean')
    form.value = { status: initial }
    errorMsg.value = ''
    saving.value = false
  },
  { immediate: true },
)

async function submit() {
  const r = props.room
  if (!r?.id) return
  const next = form.value.status
  if (!props.allowedStatuses.includes(next)) return
  saving.value = true
  errorMsg.value = ''
  try {
    const updated = await store.changeRoomHousekeeping(r.id, next)
    emit('saved', updated)
  } catch (err: unknown) {
    errorMsg.value = formatUnknownApiError(err) || t('rooms.load_failed')
  } finally {
    saving.value = false
  }
}
</script>
