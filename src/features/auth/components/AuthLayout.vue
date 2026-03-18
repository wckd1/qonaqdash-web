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
          <p class="brand-tagline">Hospitality, simplified</p>
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
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-lg);
  background: var(--canvas);
}

/* ---- Card shell ---- */

.auth-card {
  display: flex;
  width: 100%;
  max-width: 840px;
  min-height: 520px;
  border-radius: var(--content-area-radius);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  animation: cardEnter 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* ---- Brand panel (left) ---- */

.auth-brand {
  width: 320px;
  flex-shrink: 0;
  background: linear-gradient(160deg, var(--sidebar-bg) 0%, #162a2e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: var(--space-block) var(--space-xl);
}

.brand-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.brand-logo {
  width: 60px;
  height: 60px;
  border: 2px solid rgba(42, 157, 143, 0.35);
  background: rgba(42, 157, 143, 0.08);
  color: var(--brand-primary);
  border-radius: var(--content-area-radius);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 1.875rem;
  margin-bottom: var(--space-lg);
  animation: brandFadeIn 0.6s ease-out 0.2s both;
}

.brand-name {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--ink-inverse);
  margin-bottom: var(--space-xs);
  letter-spacing: 0.01em;
  animation: brandFadeIn 0.6s ease-out 0.3s both;
}

.brand-tagline {
  color: var(--sidebar-text-muted);
  font-size: var(--text-label-size);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin: 0;
  animation: brandFadeIn 0.6s ease-out 0.4s both;
}

/* Decorative rings */

.brand-decor {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.decor-ring {
  position: absolute;
  width: 160px;
  height: 160px;
  border: 1px solid rgba(42, 157, 143, 0.07);
  border-radius: 50%;
}

.decor-ring--md {
  width: 280px;
  height: 280px;
  border-color: rgba(42, 157, 143, 0.05);
}

.decor-ring--lg {
  width: 420px;
  height: 420px;
  border-color: rgba(42, 157, 143, 0.03);
}

/* ---- Form panel (right) ---- */

.auth-form {
  flex: 1;
  padding: var(--space-block) var(--space-xl);
  background: var(--surface-1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  animation: formEnter 0.5s ease-out 0.15s both;
}

.auth-form-header {
  margin-bottom: var(--space-lg);
}

.auth-form-header h2 {
  font-family: var(--font-display);
  font-size: var(--text-heading-size);
  font-weight: var(--text-heading-weight);
  color: var(--ink-primary);
  margin-bottom: var(--space-micro);
}

.auth-subtitle {
  color: var(--ink-secondary);
  font-size: var(--text-body-size);
  margin: 0;
}

.auth-footer {
  text-align: center;
  margin-top: var(--space-lg);
  padding-top: var(--space-md);
  border-top: 1px solid var(--border-subtle);
  font-size: var(--text-body-size);
  color: var(--ink-secondary);
}

.auth-footer :slotted(a) {
  color: var(--brand-primary);
  text-decoration: none;
  font-weight: var(--text-label-weight);
}

.auth-footer :slotted(a:hover) {
  text-decoration: underline;
}

/* ---- Animations ---- */

@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(var(--space-md)) scale(0.99);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes brandFadeIn {
  from {
    opacity: 0;
    transform: translateY(var(--space-sm));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes formEnter {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-card,
  .brand-logo,
  .brand-name,
  .brand-tagline,
  .auth-form {
    animation: none;
  }

}

/* ---- Mobile ---- */

@media (max-width: 640px) {
  .auth-page {
    padding: 0;
    align-items: stretch;
  }

  .auth-card {
    flex-direction: column;
    min-height: 100vh;
    border-radius: 0;
    box-shadow: none;
  }

  .auth-brand {
    width: 100%;
    padding: var(--space-xl) var(--space-lg);
    min-height: auto;
  }

  .decor-ring,
  .decor-ring--md,
  .decor-ring--lg {
    display: none;
  }

  .auth-form {
    flex: 1;
    padding: var(--space-xl) var(--space-lg);
    justify-content: flex-start;
  }
}
</style>
