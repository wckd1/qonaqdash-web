<template>
  <div v-if="hasAnyAction" class="booking-status-actions-root">
    <div
      v-if="layout === 'row'"
      class="action-toolbar"
      :class="{ 'action-toolbar--inset': detailInset }"
      role="toolbar"
      :aria-label="t('bookings.lifecycle_toolbar_aria')"
    >
      <button
        v-if="allowsCheckIn"
        type="button"
        class="action-toolbar__btn action-toolbar__btn--check-in"
        :disabled="running"
        @click="openConfirm('checkIn')"
      >
        {{ t('bookings.action_check_in') }}
      </button>
      <button
        v-if="allowsCheckOut"
        type="button"
        class="action-toolbar__btn action-toolbar__btn--check-out"
        :disabled="running"
        @click="openConfirm('checkOut')"
      >
        {{ t('bookings.action_check_out') }}
      </button>
      <button
        v-if="allowsCancel"
        type="button"
        class="action-toolbar__btn action-toolbar__btn--cancel"
        :disabled="running"
        @click="openConfirm('cancel')"
      >
        {{ t('bookings.action_cancel_booking') }}
      </button>
    </div>
    <template v-else>
      <button
        v-if="allowsCheckIn"
        type="button"
        class="menu-row menu-row--check-in"
        role="menuitem"
        :disabled="running"
        @click="openConfirm('checkIn')"
      >
        {{ t('bookings.action_check_in') }}
      </button>
      <button
        v-if="allowsCheckOut"
        type="button"
        class="menu-row menu-row--check-out"
        role="menuitem"
        :disabled="running"
        @click="openConfirm('checkOut')"
      >
        {{ t('bookings.action_check_out') }}
      </button>
      <button
        v-if="allowsCancel"
        type="button"
        class="menu-row menu-row--cancel"
        role="menuitem"
        :disabled="running"
        @click="openConfirm('cancel')"
      >
        {{ t('bookings.action_cancel_booking') }}
      </button>
    </template>

    <Teleport to="body">
      <div v-if="pending" class="dialog-backdrop" role="presentation" @click.self="closeConfirm">
        <div class="dialog" role="dialog" :aria-labelledby="dialogTitleId" aria-modal="true">
          <h2 :id="dialogTitleId" class="booking-status-dialog-title">{{ dialogTitle }}</h2>
          <p class="booking-status-dialog-body">{{ dialogBody }}</p>

          <template v-if="pending === 'checkOut' && checkoutRequiresForceAck">
            <hr class="booking-status-dialog-separator" />
            <p class="booking-status-dialog-body booking-status-dialog-body--warning">
              {{ t('bookings.checkout_unpaid_notice') }}
            </p>
            <label class="booking-status-dialog-check">
              <input v-model="forceUnpaidAck" type="checkbox" />
              {{ t('bookings.checkout_force_unpaid_label') }}
            </label>
          </template>

          <div class="dialog-actions">
            <button type="button" class="btn-secondary" :disabled="running" @click="closeConfirm">
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              class="action-toolbar__btn"
              :class="primaryActionModifierClass"
              :disabled="running || !canConfirm"
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

<script setup lang="ts">
import { ref, computed, watch, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBookingStore } from '@/features/bookings/stores/useBookingStore'
import {
  bookingStatusAllowsCheckIn,
  bookingStatusAllowsCheckOut,
  bookingStatusAllowsCancel,
} from '@/features/bookings/bookingStatus'
import { useNotification } from '@/shared/composables/useNotification'
import { usePermissions } from '@/shared/composables/usePermissions'

const props = defineProps({
  bookingId: { type: String, required: true },
  /** From list row, grid entry, or FormResponse (via getBookingStatusFromResponse). */
  status: { type: String, default: undefined },
  /**
   * Outstanding balance (minor units) from booking aggregate / grid.
   * When > 0, check-out requires acknowledging force-unpaid; otherwise normal check-out.
   */
  outstandingBalanceMinor: { type: Number, default: undefined },
  /** `row`: toolbar strip; `menu`: grid context menu items. */
  layout: { type: String, default: 'row' },
  /** Full-page in `main`: add `action-toolbar--inset` for horizontal inset + `--radius-md` shell (see main.css). */
  detailInset: { type: Boolean, default: false },
})

const emit = defineEmits(['updated'])

const { t } = useI18n()
const store = useBookingStore()
const { success } = useNotification()
const { canOperateBookings, canCancelBookings } = usePermissions()

const pending = ref(null)
const running = ref(false)
const forceUnpaidAck = ref(false)
const dialogTitleId = useId()

const allowsCheckIn = computed(
  () => canOperateBookings.value && bookingStatusAllowsCheckIn(props.status),
)
const allowsCheckOut = computed(
  () => canOperateBookings.value && bookingStatusAllowsCheckOut(props.status),
)
const allowsCancel = computed(
  () => canCancelBookings.value && bookingStatusAllowsCancel(props.status),
)

const hasAnyAction = computed(
  () => allowsCheckIn.value || allowsCheckOut.value || allowsCancel.value,
)

/** True when guest still owes (per `BookingItem.outstanding_balance` / detail aggregate). */
const checkoutRequiresForceAck = computed(() => {
  const v = props.outstandingBalanceMinor
  return typeof v === 'number' && v > 0
})

const canConfirm = computed(() => {
  if (pending.value === 'checkOut' && checkoutRequiresForceAck.value) return forceUnpaidAck.value
  return true
})

const primaryActionModifierClass = computed(() => {
  if (pending.value === 'checkIn') return 'action-toolbar__btn--check-in'
  if (pending.value === 'checkOut') return 'action-toolbar__btn--check-out'
  if (pending.value === 'cancel') return 'action-toolbar__btn--cancel'
  return ''
})

const dialogTitle = computed(() => {
  if (pending.value === 'checkIn') return t('bookings.confirm_check_in_title')
  if (pending.value === 'checkOut') return t('bookings.confirm_check_out_title')
  if (pending.value === 'cancel') return t('bookings.confirm_cancel_title')
  return ''
})

const dialogBody = computed(() => {
  if (pending.value === 'checkIn') return t('bookings.confirm_check_in_body')
  if (pending.value === 'checkOut') return t('bookings.confirm_check_out_body')
  if (pending.value === 'cancel') return t('bookings.confirm_cancel_body')
  return ''
})

const dialogPrimaryLabel = computed(() => {
  if (pending.value === 'checkIn') return t('bookings.action_check_in')
  if (pending.value === 'checkOut') return t('bookings.action_check_out')
  if (pending.value === 'cancel') return t('bookings.action_cancel_booking')
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
  forceUnpaidAck.value = false
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
    else if (kind === 'checkOut')
      await store.checkOut(id, {
        forceUnpaid: checkoutRequiresForceAck.value ? forceUnpaidAck.value : false,
      })
    else if (kind === 'cancel') await store.cancel(id)
    success(t('bookings.status_action_success'))
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

.booking-status-dialog-separator {
  border: none;
  border-top: 1px solid var(--border-subtle);
  margin: 0 0 var(--space-md);
}

.booking-status-dialog-body--warning {
  margin-bottom: var(--space-sm);
  color: var(--ink-secondary);
}

.booking-status-dialog-check {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: var(--text-body-size);
  margin-bottom: var(--space-lg);
  cursor: pointer;
}

.booking-status-dialog-check input[type='checkbox'] {
  margin: 0;
  flex-shrink: 0;
}
</style>
