<template>
  <Transition name="slide-panel">
    <aside
      v-if="guest"
      class="guest-panel"
      aria-labelledby="guest-panel-title"
    >
      <div class="guest-panel-header">
        <h2 id="guest-panel-title">{{ guestPanelTitle }}</h2>
        <button
          type="button"
          class="guest-panel-close"
          :aria-label="t('common.closePanel')"
          @click="emit('close')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <div class="guest-panel-body">
        <dl class="guest-panel-dl">
          <dt>{{ t('fields.email') }}</dt>
          <dd>{{ guest.email ?? '—' }}</dd>
          <dt>{{ t('fields.phone') }}</dt>
          <dd>{{ guest.phone ?? '—' }}</dd>
        </dl>
      </div>
      <div class="guest-panel-footer">
        <router-link
          :to="{ name: 'guest-detail', params: { id: guest.id } }"
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

const { t, locale } = useI18n()

const props = defineProps({
  /**
   * @type {{ id: string, first_name?: string, last_name?: string, email?: string, phone?: string } | null}
   */
  guest: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const guestPanelTitle = computed(() => {
  void locale.value
  const g = props.guest
  if (!g) return ''
  const first = g.first_name ?? ''
  const last = g.last_name ?? ''
  return [first, last].filter(Boolean).join(' ') || t('pageTitle.guest')
})
</script>
