<template>
  <header class="page-header">
    <h1>{{ t('profile.title') }}</h1>
    <div class="page-header-actions">
      <button type="button" :disabled="saving || loading || !dirty" @click="onSave">
        {{ saving ? t('common.saving') : t('common.save') }}
      </button>
    </div>
  </header>

  <div class="form-content__viewport profile-view">
    <p v-if="loadError" class="error-message">{{ loadError }}</p>
    <div v-else-if="loading" class="loading-state">{{ t('common.loading') }}</div>
    <template v-else>
      <p v-if="validationError" class="form-field-error">{{ validationError }}</p>
      <section class="panel profile-view__section">
        <h2 class="profile-view__heading">{{ t('profile.accountSection') }}</h2>
        <label>
          {{ t('profile.email') }}
          <input v-model="email" type="email" autocomplete="email" :disabled="saving" />
        </label>
        <h3 class="profile-view__subheading">{{ t('profile.passwordSection') }}</h3>
        <p class="profile-view__hint">{{ t('profile.passwordHint') }}</p>
        <label>
          {{ t('profile.currentPassword') }}
          <input
            v-model="currentPassword"
            type="password"
            autocomplete="current-password"
            :disabled="saving"
          />
        </label>
        <label>
          {{ t('profile.newPassword') }}
          <input
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            :disabled="saving"
          />
        </label>
      </section>

      <section class="panel profile-view__section">
        <h2 class="profile-view__heading">{{ t('profile.settingsSection') }}</h2>
        <div class="profile-view__field">
          <label class="profile-view__control-label" for="profile-locale">{{ t('profile.language') }}</label>
          <p id="profile-locale-desc" class="profile-view__hint profile-view__hint--below-label">
            {{ t('profile.languageHint') }}
          </p>
          <select
            id="profile-locale"
            v-model="localeChoice"
            :disabled="saving"
            aria-describedby="profile-locale-desc"
          >
            <option value="">{{ t('profile.languageUnset') }}</option>
            <option value="en">{{ t('profile.languageEn') }}</option>
            <option value="ru">{{ t('profile.languageRu') }}</option>
          </select>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import * as authApi from '@/features/auth/api'
import { formatApiError, formatUnknownApiError } from '@/shared/i18n/apiError'
import { useSettingsStore } from '@/shared/stores/useSettingsStore'

const { t } = useI18n()
const settingsStore = useSettingsStore()

const loading = ref(true)
const saving = ref(false)
const loadError = ref('')
const validationError = ref('')

const email = ref('')
const originalEmail = ref('')

const currentPassword = ref('')
const newPassword = ref('')

/** '' → server `null`; 'en' | 'ru' */
const localeChoice = ref('')
const originalLocaleChoice = ref('')

const dirty = computed(() => {
  if (email.value.trim() !== originalEmail.value.trim()) return true
  if (localeChoice.value !== originalLocaleChoice.value) return true
  if (newPassword.value.length > 0 || currentPassword.value.length > 0) return true
  return false
})

function serverLocaleToChoice(loc: unknown) {
  if (loc === 'en' || loc === 'ru') return loc
  return ''
}

function choiceToPayloadLocale(choice: string) {
  if (choice === 'en' || choice === 'ru') return choice
  return null
}

async function load() {
  loadError.value = ''
  loading.value = true
  try {
    const data = await authApi.fetchAccount()
    const em = data?.account?.email ?? ''
    email.value = em
    originalEmail.value = em
    const choice = serverLocaleToChoice(data?.settings?.locale ?? null)
    localeChoice.value = choice
    originalLocaleChoice.value = choice
    currentPassword.value = ''
    newPassword.value = ''
  } catch (err: unknown) {
    loadError.value = formatUnknownApiError(err) || t('profile.loadError')
  } finally {
    loading.value = false
  }
}

function buildPayload(): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (email.value.trim() !== originalEmail.value.trim()) {
    payload.account = { email: email.value.trim() }
  }
  if (newPassword.value.length > 0) {
    const prev = (payload.account as Record<string, string> | undefined) ?? {}
    payload.account = {
      ...prev,
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    }
  }
  if (localeChoice.value !== originalLocaleChoice.value) {
    payload.settings = { locale: choiceToPayloadLocale(localeChoice.value) }
  }
  return payload
}

async function onSave() {
  validationError.value = ''
  if (newPassword.value.length > 0 && !currentPassword.value) {
    validationError.value = t('profile.currentPasswordRequired')
    return
  }
  const payload = buildPayload()
  if (!Object.keys(payload).length) return

  saving.value = true
  try {
    await authApi.updateAccount(payload)
    await settingsStore.fetchUserSettings()
    originalEmail.value = email.value.trim()
    originalLocaleChoice.value = localeChoice.value
    currentPassword.value = ''
    newPassword.value = ''
  } catch {
    // API client toasts 4xx/5xx; 401 wrong password does not log out
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.profile-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.profile-view__section {
  margin: 0;
}

.profile-view__section label {
  display: block;
  margin-bottom: var(--space-sm);
}

.profile-view__field {
  margin-bottom: var(--space-sm);
}

.profile-view__field:last-child {
  margin-bottom: 0;
}

.profile-view__control-label {
  margin-bottom: var(--space-xs);
}

.profile-view__heading {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  margin: 0 0 var(--space-lg);
}

.profile-view__subheading {
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: 600;
  margin: var(--space-md) 0 var(--space-md);
}

.profile-view__hint {
  margin: 0 0 var(--space-sm);
  font-size: var(--text-caption-size);
  font-weight: var(--text-caption-weight);
  line-height: 1.45;
  color: var(--ink-muted);
}

.profile-view__hint--below-label {
  margin-top: 0;
  margin-bottom: var(--space-xs);
}
</style>
