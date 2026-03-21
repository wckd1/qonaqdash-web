<template>
  <nav v-if="hasTrail" class="breadcrumbs" :aria-label="t('breadcrumb.navLabel')">
    <router-link
      v-if="backHref"
      :to="backHref"
      class="breadcrumbs-back"
      :aria-label="t('breadcrumb.goBack')"
    >
      <svg class="breadcrumbs-back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 12H5" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
    </router-link>
    <span v-if="backHref && trail.length" class="breadcrumbs-sep" aria-hidden="true"></span>
    <ol class="breadcrumbs-trail">
      <li
        v-for="(segment, i) in trail"
        :key="i"
        class="breadcrumbs-item"
      >
        <template v-if="i > 0">
          <span class="breadcrumbs-sep" aria-hidden="true">/</span>
        </template>
        <router-link
          v-if="segment.path"
          :to="segment.path"
          class="breadcrumbs-link"
        >
          {{ breadcrumbLabel(segment) }}
        </router-link>
        <span v-else class="breadcrumbs-text">{{ breadcrumbLabel(segment) }}</span>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBreadcrumb } from '@/shared/composables/useBreadcrumb'

const { t } = useI18n()
const { items } = useBreadcrumb()

function breadcrumbLabel(segment) {
  if (segment?.labelKey) return t(segment.labelKey)
  return segment?.label ?? ''
}

/** Path to current: all segments except the last (current page is not shown). */
const trail = computed(() => {
  const list = items.value
  if (list.length <= 1) return []
  return list.slice(0, -1)
})

/** Back arrow goes to parent (second-to-last segment's path). */
const backHref = computed(() => {
  const list = items.value
  if (list.length < 2) return null
  const parent = list[list.length - 2]
  return parent?.path ?? null
})

const hasTrail = computed(() => backHref.value !== null || trail.value.length > 0)
</script>

<style scoped>
.breadcrumbs {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0;
  min-height: 0;
}

.breadcrumbs-back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--brand-primary);
  border-radius: var(--radius-md);
  transition: color 0.15s ease, background 0.15s ease;
}

.breadcrumbs-back:hover {
  color: var(--brand-primary-hover);
  background: var(--semantic-info-bg);
}

.breadcrumbs-back-icon {
  width: 18px;
  height: 18px;
}

.breadcrumbs-sep {
  color: var(--ink-muted);
  font-size: var(--text-body-size);
  user-select: none;
  padding: 0 var(--space-xs);
}

.breadcrumbs-trail {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: var(--text-body-size);
  color: var(--ink-secondary);
}

.breadcrumbs-item {
  display: flex;
  align-items: center;
}

.breadcrumbs-link {
  color: var(--brand-primary);
  text-decoration: none;
  transition: color 0.15s ease;
}

.breadcrumbs-link:hover {
  color: var(--brand-primary-hover);
}

.breadcrumbs-text {
  color: var(--ink-primary);
}
</style>
