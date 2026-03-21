<template>
  <Transition name="slide-panel">
    <aside
      v-if="booking"
      class="booking-panel"
      role="dialog"
      aria-labelledby="booking-panel-title"
    >
      <div class="booking-panel-header">
        <h2 id="booking-panel-title">{{ bookingPanelTitle }}</h2>
        <button
          type="button"
          class="booking-panel-close"
          :aria-label="t('common.closePanel')"
          @click="emit('close')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <div class="booking-panel-body">
        <dl class="booking-panel-dl">
          <dt>{{ t('fields.guest') }}</dt>
          <dd>{{ bookingGuestName(booking) }}</dd>
          <dt>{{ t('fields.checkIn') }}</dt>
          <dd>{{ formatDate(booking.check_in) }}</dd>
          <dt>{{ t('fields.checkOut') }}</dt>
          <dd>{{ formatDate(booking.check_out) }}</dd>
          <dt>{{ t('fields.status') }}</dt>
          <dd>
            <BookingStatusBadge :status="booking.status" />
          </dd>
        </dl>
      </div>
      <div class="booking-panel-footer">
        <router-link
          :to="{ name: 'booking-detail', params: { id: booking.id } }"
          class="btn-open-full-page"
          @click="emit('close')"
        >
          {{ t('common.openFullPage') }}
        </router-link>
      </div>
    </aside>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BookingStatusBadge from '@/shared/components/BookingStatusBadge.vue'

const { t, locale } = useI18n()

const props = defineProps({
  /**
   * List-style booking (id, check_in, check_out, status, guest?, guest_name?).
   * @type {{ id: string, check_in: string, check_out: string, status: string, guest?: { first_name?: string, last_name?: string, email?: string }, guest_name?: string } | null}
   */
  booking: { type: Object, default: null },
})

const emit = defineEmits(['close'])

function bookingGuestName(b) {
  if (!b) return '—'
  if (b.guest_name) return b.guest_name
  const g = b.guest
  if (!g) return '—'
  const first = g.first_name ?? ''
  const last = g.last_name ?? ''
  const parts = [first, last].filter(Boolean)
  return parts.length ? parts.join(' ') : (g.email ?? '—')
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
  } catch {
    return iso
  }
}

const bookingPanelTitle = computed(() => {
  void locale.value
  const b = props.booking
  if (!b) return ''
  const name = bookingGuestName(b)
  return name ? t('pageTitle.bookingWithGuest', { name }) : t('pageTitle.booking')
})
</script>

<style scoped>
.booking-panel {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 60%;
  min-width: 280px;
  max-width: 720px;
  background: var(--surface-1);
  border-left: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  min-height: 0;
  box-shadow: -4px 0 20px rgba(30, 41, 59, 0.12);
  z-index: 10;
}

.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: transform 0.25s ease;
}

.slide-panel-enter-from,
.slide-panel-leave-to {
  transform: translateX(100%);
}

.slide-panel-enter-to,
.slide-panel-leave-from {
  transform: translateX(0);
}

.booking-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--border-subtle);
}

.booking-panel-header h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-subheading-size);
  font-weight: var(--text-subheading-weight);
  letter-spacing: var(--text-subheading-tracking);
  color: var(--ink-primary);
}

.booking-panel-close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--ink-tertiary);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}

.booking-panel-close:hover {
  color: var(--ink-primary);
  background: var(--surface-2);
}

.booking-panel-close svg {
  width: 18px;
  height: 18px;
}

.booking-panel-body {
  flex: 1;
  min-height: 0;
  padding: var(--space-lg);
  overflow-y: auto;
}

.booking-panel-dl {
  margin: 0;
  font-size: var(--text-body-size);
}

.booking-panel-dl dt {
  font-weight: var(--text-label-weight);
  color: var(--ink-tertiary);
  margin-top: var(--space-sm);
  margin-bottom: var(--space-micro);
}

.booking-panel-dl dt:first-child {
  margin-top: 0;
}

.booking-panel-dl dd {
  margin: 0;
  color: var(--ink-primary);
}

.booking-panel-footer {
  flex-shrink: 0;
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
}

.btn-open-full-page {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xs) var(--space-md);
  font-size: var(--text-label-size);
  font-weight: var(--text-label-weight);
  color: var(--brand-primary);
  background: transparent;
  border: 1px solid var(--brand-primary);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.btn-open-full-page:hover {
  background: var(--semantic-info-bg);
  color: var(--brand-primary-hover);
}
</style>
