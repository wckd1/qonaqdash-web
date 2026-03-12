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
  padding: 1.5rem;
  background: var(--bg-base, #f5f7fa);
}

/* ---- Card shell ---- */

.auth-card {
  display: flex;
  width: 100%;
  max-width: 840px;
  min-height: 520px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 8px 40px rgba(26, 35, 50, 0.08),
    0 1px 3px rgba(26, 35, 50, 0.04);
  animation: cardEnter 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* ---- Brand panel (left) ---- */

.auth-brand {
  width: 320px;
  flex-shrink: 0;
  background: linear-gradient(160deg, #1a2332 0%, #162a2e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 3rem 2.5rem;
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
  color: var(--color-teal, #2a9d8f);
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display, serif);
  font-size: 1.875rem;
  margin-bottom: 1.5rem;
  animation: brandFadeIn 0.6s ease-out 0.2s both;
}

.brand-name {
  font-family: var(--font-display, serif);
  font-size: 1.5rem;
  color: #fff;
  margin-bottom: 0.5rem;
  letter-spacing: 0.01em;
  animation: brandFadeIn 0.6s ease-out 0.3s both;
}

.brand-tagline {
  color: rgba(200, 214, 229, 0.5);
  font-size: 0.8125rem;
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
  padding: 3rem;
  background: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  animation: formEnter 0.5s ease-out 0.15s both;
}

.auth-form-header {
  margin-bottom: 1.75rem;
}

.auth-form-header h2 {
  font-family: var(--font-display, serif);
  font-weight: 400;
  font-size: 1.625rem;
  color: #1a1a1a;
  margin-bottom: 0.375rem;
}

.auth-subtitle {
  color: #6b7280;
  font-size: 0.9375rem;
  margin: 0;
}

.auth-footer {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 0.875rem;
  color: #6b7280;
}

.auth-footer :slotted(a) {
  color: var(--color-teal, #2a9d8f);
  text-decoration: none;
  font-weight: 500;
}

.auth-footer :slotted(a:hover) {
  text-decoration: underline;
}

/* ---- Slotted content styles ---- */

:slotted(.form-error) {
  background: #fef2f2;
  border: 1px solid rgba(239, 68, 68, 0.15);
  color: #b91c1c;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  margin-bottom: 1.25rem;
  animation: slideDown 0.25s ease-out;
}

:slotted(.invite-info) {
  background: rgba(42, 157, 143, 0.06);
  border: 1px solid rgba(42, 157, 143, 0.15);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.9375rem;
  color: #134e4a;
}

/* ---- Animations ---- */

@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.99);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes brandFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
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

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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

  :slotted(.form-error) {
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
    padding: 2rem 1.5rem;
    min-height: auto;
  }

  .decor-ring,
  .decor-ring--md,
  .decor-ring--lg {
    display: none;
  }

  .auth-form {
    flex: 1;
    padding: 2rem 1.5rem;
    justify-content: flex-start;
  }
}
</style>
