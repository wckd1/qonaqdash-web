<template>
  <div v-if="hasAnyAction" class="booking-status-actions-root">
    <div
      v-if="layout === 'row'"
      class="booking-lifecycle-toolbar"
      :class="{ 'booking-detail-toolbar': detailInset }"
      role="toolbar"
      :aria-label="t('bookings.lifecycleToolbarAria')"
    >
      <button
        v-if="allowsCheckIn"
        type="button"
        class="booking-lifecycle-action booking-lifecycle-action--check-in"
        :disabled="running"
        @click="openConfirm('checkIn')"
      >
        {{ t('bookings.actionCheckIn') }}
      </button>
      <button
        v-if="allowsCheckOut"
        type="button"
        class="booking-lifecycle-action booking-lifecycle-action--check-out"
        :disabled="running"
        @click="openConfirm('checkOut')"
      >
        {{ t('bookings.actionCheckOut') }}
      </button>
      <button
        v-if="allowsCancel"
        type="button"
        class="booking-lifecycle-action booking-lifecycle-action--cancel"
        :disabled="running"
        @click="openConfirm('cancel')"
      >
        {{ t('bookings.actionCancelBooking') }}
      </button>
    </div>
    <template v-else>
      <button
        v-if="allowsCheckIn"
        type="button"
        class="booking-lifecycle-menu-item booking-lifecycle-menu-item--check-in"
        role="menuitem"
        :disabled="running"
        @click="openConfirm('checkIn')"
      >
        {{ t('bookings.actionCheckIn') }}
      </button>
      <button
        v-if="allowsCheckOut"
        type="button"
        class="booking-lifecycle-menu-item booking-lifecycle-menu-item--check-out"
        role="menuitem"
        :disabled="running"
        @click="openConfirm('checkOut')"
      >
        {{ t('bookings.actionCheckOut') }}
      </button>
      <button
        v-if="allowsCancel"
        type="button"
        class="booking-lifecycle-menu-item booking-lifecycle-menu-item--cancel"
        role="menuitem"
        :disabled="running"
        @click="openConfirm('cancel')"
      >
        {{ t('bookings.actionCancelBooking') }}
      </button>
    </template>

    <Teleport to="main">
      <div
        v-if="pending"
        class="dialog-backdrop"
        role="presentation"
        @click.self="closeConfirm"
      >
        <div class="dialog" role="dialog" :aria-labelledby="dialogTitleId" aria-modal="true">
          <h2 :id="dialogTitleId" class="booking-status-dialog-title">{{ dialogTitle }}</h2>
          <p class="booking-status-dialog-body">{{ dialogBody }}</p>
          <div class="dialog-actions">
            <button type="button" class="btn-secondary" :disabled="running" @click="closeConfirm">
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              class="booking-lifecycle-action"
              :class="primaryActionModifierClass"
              :disabled="running"
              @click="runPending"
            >
              {{ running ? t('common.loading') : dialogPrimaryLabel }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBookingStore } from '@/features/bookings/stores/useBookingStore'
import {
  bookingStatusAllowsCheckIn,
  bookingStatusAllowsCheckOut,
  bookingStatusAllowsCancel,
} from '@/features/bookings/bookingStatus'
import { useNotification } from '@/shared/composables/useNotification'

const props = defineProps({
  bookingId: { type: String, required: true },
  /** From list row, grid entry, or FormResponse (via getBookingStatusFromResponse). */
  status: { type: String, default: undefined },
  /** `row`: toolbar strip; `menu`: grid context menu items. */
  layout: { type: String, default: 'row' },
  /** Full-page booking detail: horizontal inset + card radius (see main.css `.booking-detail-toolbar`). */
  detailInset: { type: Boolean, default: false },
})

const emit = defineEmits(['updated'])

const { t } = useI18n()
const store = useBookingStore()
const { success } = useNotification()

const pending = ref(null)
const running = ref(false)
const dialogTitleId = useId()

const allowsCheckIn = computed(() => bookingStatusAllowsCheckIn(props.status))
const allowsCheckOut = computed(() => bookingStatusAllowsCheckOut(props.status))
const allowsCancel = computed(() => bookingStatusAllowsCancel(props.status))

const hasAnyAction = computed(
  () => allowsCheckIn.value || allowsCheckOut.value || allowsCancel.value,
)

const primaryActionModifierClass = computed(() => {
  if (pending.value === 'checkIn') return 'booking-lifecycle-action--check-in'
  if (pending.value === 'checkOut') return 'booking-lifecycle-action--check-out'
  if (pending.value === 'cancel') return 'booking-lifecycle-action--cancel'
  return ''
})

const dialogTitle = computed(() => {
  if (pending.value === 'checkIn') return t('bookings.confirmCheckInTitle')
  if (pending.value === 'checkOut') return t('bookings.confirmCheckOutTitle')
  if (pending.value === 'cancel') return t('bookings.confirmCancelTitle')
  return ''
})

const dialogBody = computed(() => {
  if (pending.value === 'checkIn') return t('bookings.confirmCheckInBody')
  if (pending.value === 'checkOut') return t('bookings.confirmCheckOutBody')
  if (pending.value === 'cancel') return t('bookings.confirmCancelBody')
  return ''
})

const dialogPrimaryLabel = computed(() => {
  if (pending.value === 'checkIn') return t('bookings.actionCheckIn')
  if (pending.value === 'checkOut') return t('bookings.actionCheckOut')
  if (pending.value === 'cancel') return t('bookings.actionCancelBooking')
  return t('common.save')
})

watch(
  () => props.bookingId,
  () => {
    pending.value = null
    running.value = false
  },
)

function openConfirm(kind) {
  pending.value = kind
}

function closeConfirm() {
  if (running.value) return
  pending.value = null
}

async function runPending() {
  const id = props.bookingId
  const kind = pending.value
  if (!id || !kind) return
  running.value = true
  try {
    if (kind === 'checkIn') await store.checkIn(id)
    else if (kind === 'checkOut') await store.checkOut(id)
    else if (kind === 'cancel') await store.cancel(id)
    success(t('bookings.statusActionSuccess'))
    pending.value = null
    emit('updated')
  } catch {
    /* Global API interceptor shows error toast. */
  } finally {
    running.value = false
  }
}
</script>

<style scoped>
.booking-status-dialog-title {
  margin: 0 0 var(--space-sm);
  font-size: var(--text-heading-size);
}

.booking-status-dialog-body {
  margin: 0 0 var(--space-lg);
  font-size: var(--text-body-size);
  color: var(--ink-secondary);
}
</style>
