<template>
  <AuthLayout title="Accept Invitation" subtitle="Set your password to get started">
    <div v-if="loadError" class="form-error">{{ loadError }}</div>

    <template v-else-if="inviteLoading">
      <p aria-busy="true">Loading invitation…</p>
    </template>

    <template v-else-if="invite">
      <div class="invite-info">
        You've been invited to <strong>{{ invite.organization_name }}</strong>
        as <strong>{{ invite.email }}</strong>
      </div>

      <div v-if="formError" class="form-error">{{ formError }}</div>

      <form @submit.prevent="handleSubmit">
        <label>
          Password
          <input
            v-model="password"
            type="password"
            placeholder="Create a password"
            autocomplete="new-password"
            required
            minlength="8"
            :disabled="submitting"
          />
        </label>

        <label>
          Confirm password
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            autocomplete="new-password"
            required
            minlength="8"
            :disabled="submitting"
          />
        </label>

        <button type="submit" :aria-busy="submitting" :disabled="submitting">
          {{ submitting ? 'Setting up…' : 'Set password & sign in' }}
        </button>
      </form>
    </template>

    <template #footer>
      Already have an account? <router-link :to="{ name: 'login' }">Sign in</router-link>
    </template>
  </AuthLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import { fetchInvite } from '@/features/auth/api'
import AuthLayout from '@/features/auth/components/AuthLayout.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const invite = ref(null)
const inviteLoading = ref(true)
const loadError = ref('')

const password = ref('')
const confirmPassword = ref('')
const submitting = ref(false)
const formError = ref('')

onMounted(async () => {
  try {
    invite.value = await fetchInvite(route.params.token)
  } catch (err) {
    if (err.response) {
      const msg = err.response.data?.error
      loadError.value = msg || 'This invitation link is invalid or has expired.'
    } else {
      loadError.value = 'Unable to reach the server. Please check your connection.'
    }
  } finally {
    inviteLoading.value = false
  }
})

async function handleSubmit() {
  formError.value = ''

  if (password.value !== confirmPassword.value) {
    formError.value = 'Passwords do not match.'
    return
  }

  submitting.value = true

  try {
    await authStore.completeInvite(route.params.token, password.value)
    router.push('/')
  } catch (err) {
    if (err.response) {
      const msg = err.response.data?.error
      formError.value = msg || 'Failed to complete invitation. Please try again.'
    } else {
      formError.value = 'Unable to reach the server. Please check your connection.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.invite-info strong {
  color: var(--brand-primary);
}
</style>
