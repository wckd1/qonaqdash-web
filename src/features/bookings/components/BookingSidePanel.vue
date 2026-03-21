<template>
  <Transition name="slide-panel">
    <aside
      v-if="booking"
      class="booking-panel"
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
