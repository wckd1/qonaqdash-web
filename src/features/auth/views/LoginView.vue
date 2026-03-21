<template>
  <AuthLayout :title="t('auth.login.title')" :subtitle="t('auth.login.subtitle')">
    <div v-if="formError" class="form-error">{{ formError }}</div>

    <form @submit.prevent="handleSubmit">
      <label>
        {{ t('auth.login.email') }}
        <input
          v-model="email"
          type="email"
          :placeholder="t('auth.login.emailPlaceholder')"
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
          :placeholder="t('auth.login.passwordPlaceholder')"
          autocomplete="current-password"
          required
          :disabled="loading"
        />
      </label>

      <button type="submit" :aria-busy="loading" :disabled="loading">
        {{ loading ? t('auth.login.signingIn') : t('auth.login.signIn') }}
      </button>
    </form>
  </AuthLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import AuthLayout from '@/features/auth/components/AuthLayout.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const formError = ref('')

async function handleSubmit() {
  formError.value = ''
  loading.value = true

  try {
    await authStore.login(email.value, password.value)
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (err) {
    if (err.response) {
      const msg = err.response.data?.error
      formError.value = msg || t('auth.login.errorInvalid')
    } else {
      formError.value = t('auth.login.errorNetwork')
    }
  } finally {
    loading.value = false
  }
}
</script>
