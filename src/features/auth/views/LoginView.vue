<template>
  <AuthLayout title="Sign in to QonaqDash" subtitle="Enter your credentials to continue">
    <div v-if="formError" class="form-error">{{ formError }}</div>

    <form @submit.prevent="handleSubmit">
      <label>
        Email
        <input
          v-model="email"
          type="email"
          placeholder="you@example.com"
          autocomplete="email"
          required
          :disabled="loading"
        />
      </label>

      <label>
        Password
        <input
          v-model="password"
          type="password"
          placeholder="Your password"
          autocomplete="current-password"
          required
          :disabled="loading"
        />
      </label>

      <button type="submit" :aria-busy="loading" :disabled="loading">
        {{ loading ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>
  </AuthLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import AuthLayout from '@/features/auth/components/AuthLayout.vue'

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
      formError.value = msg || 'Invalid email or password. Please try again.'
    } else {
      formError.value = 'Unable to reach the server. Please check your connection.'
    }
  } finally {
    loading.value = false
  }
}
</script>
