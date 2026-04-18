<template>
  <header class="page-header">
    <h1>{{ t('forms.title') }}</h1>
  </header>

  <div class="forms-overview">
    <section v-if="canManageGuestForms" class="panel forms-overview__card">
      <div class="forms-overview__body">
        <h2 class="forms-overview__heading">{{ t('forms.guest_title') }}</h2>
        <p class="forms-overview__description">{{ t('forms.guest_description') }}</p>
      </div>
      <router-link to="/manage/forms/guests" class="forms-overview__action">
        {{ t('common.edit') }}
      </router-link>
    </section>

    <section v-if="canManageBookingForms" class="panel forms-overview__card">
      <div class="forms-overview__body">
        <h2 class="forms-overview__heading">{{ t('forms.booking_title') }}</h2>
        <p class="forms-overview__description">{{ t('forms.booking_description') }}</p>
      </div>
      <router-link to="/manage/forms/bookings" class="forms-overview__action">
        {{ t('common.edit') }}
      </router-link>
    </section>

    <section v-if="canManageEmployeeForms" class="panel forms-overview__card">
      <div class="forms-overview__body">
        <h2 class="forms-overview__heading">{{ t('forms.employee_title') }}</h2>
        <p class="forms-overview__description">{{ t('forms.employee_description') }}</p>
      </div>
      <router-link to="/manage/forms/employees" class="forms-overview__action">
        {{ t('common.edit') }}
      </router-link>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { usePermissions } from '@/shared/composables/usePermissions'

const { t } = useI18n()
const { canManageGuestForms, canManageBookingForms, canManageEmployeeForms } = usePermissions()
</script>

<style scoped>
.forms-overview {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.forms-overview__card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-lg);
  margin: 0;
}

.forms-overview__body {
  flex: 1;
  min-width: 0;
}

.forms-overview__heading {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  color: var(--ink-primary);
  margin: 0 0 var(--space-xs);
}

.forms-overview__description {
  font-size: var(--text-caption-size);
  font-weight: var(--text-caption-weight);
  line-height: 1.45;
  color: var(--ink-muted);
  margin: 0;
}

.forms-overview__action {
  flex-shrink: 0;
  align-self: center;
  display: inline-flex;
  align-items: center;
  padding: var(--space-xs) var(--space-md);
  font-size: var(--text-label-size);
  font-weight: 500;
  color: var(--brand-primary);
  border: 1px solid var(--brand-primary);
  border-radius: var(--radius-sm);
  text-decoration: none;
  transition:
    background 0.15s,
    color 0.15s;
}

.forms-overview__action:hover {
  background: var(--brand-primary);
  color: #fff;
}
</style>
