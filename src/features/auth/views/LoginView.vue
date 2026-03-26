<template>
  <AuthLayout :title="t('auth.login.title')" :subtitle="t('auth.login.subtitle')">
    <div v-if="formError" class="form-error">{{ formError }}</div>

    <form @submit.prevent="handleSubmit">
      <label>
        {{ t('auth.login.email') }}
        <input
          v-model="email"
          type="email"
          :placeholder="t('auth.login.email_placeholder')"
          autocomplete="email"
          required
          :disabled="loading"
        />
      </label>

      <label>
        {{ t('auth.login.password') }}
        <input
          v-model="password"
          type="password"
          :placeholder="t('auth.login.password_placeholder')"
          autocomplete="current-password"
          required
          :disabled="loading"
        />
      </label>

      <button type="submit" :aria-busy="loading" :disabled="loading">
        {{ loading ? t('auth.login.signing_in') : t('auth.login.sign_in') }}
      </button>
    </form>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { formatApiError, formatUnknownApiError } from '@/shared/i18n/apiError'
import { httpErrorData, httpErrorResponse } from '@/shared/unknownError'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import { useSettingsStore } from '@/shared/stores/useSettingsStore'
import AuthLayout from '@/features/auth/components/AuthLayout.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const formError = ref('')

async function handleSubmit() {
  formError.value = ''
  loading.value = true

  try {
    await authStore.login(email.value, password.value)
    void settingsStore.fetchUserSettings().catch(() => {})
    const r = route.query.redirect
    const redirect = typeof r === 'string' && r.startsWith('/') ? r : '/'
    await router.push(redirect)
  } catch (err: unknown) {
    if (httpErrorResponse(err)) {
      const msg = formatApiError(httpErrorData(err)?.error)
      formError.value = msg || t('auth.login.error_invalid')
    } else {
      formError.value = formatUnknownApiError(err) || t('auth.login.error_network')
    }
  } finally {
    loading.value = false
  }
}
</script>
