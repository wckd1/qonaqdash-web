<template>
  <main class="auth-page">
    <div class="auth-card">
      <aside class="auth-brand" aria-hidden="true">
        <div class="brand-decor">
          <div class="decor-ring"></div>
          <div class="decor-ring decor-ring--md"></div>
          <div class="decor-ring decor-ring--lg"></div>
        </div>
        <div class="brand-content">
          <div class="brand-logo">Q</div>
          <div class="brand-name">QonaqDash</div>
          <p class="brand-tagline">{{ t('auth.tagline') }}</p>
        </div>
      </aside>

      <div class="auth-form">
        <div class="auth-form-header">
          <h2>{{ title }}</h2>
          <p v-if="subtitle" class="auth-subtitle">{{ subtitle }}</p>
        </div>

        <slot />

        <div v-if="$slots.footer" class="auth-footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>
