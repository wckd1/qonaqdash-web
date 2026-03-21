<template>
  <AuthLayout :title="t('auth.invite.title')" :subtitle="t('auth.invite.subtitle')">
    <div v-if="loadError" class="form-error">{{ loadError }}</div>

    <template v-else-if="inviteLoading">
      <p aria-busy="true">{{ t('auth.invite.loading') }}</p>
    </template>

    <template v-else-if="invite">
      <div class="invite-info">
        <i18n-t keypath="auth.invite.summary" tag="span">
          <template #org>
            <strong>{{ invite.organization_name }}</strong>
          </template>
          <template #email>
            <strong>{{ invite.email }}</strong>
          </template>
        </i18n-t>
      </div>

      <div v-if="formError" class="form-error">{{ formError }}</div>

      <form @submit.prevent="handleSubmit">
        <label>
          {{ t('auth.invite.password') }}
          <input
            v-model="password"
            type="password"
            :placeholder="t('auth.invite.passwordPlaceholder')"
            autocomplete="new-password"
            required
            minlength="8"
            :disabled="submitting"
          />
        </label>

        <label>
          {{ t('auth.invite.confirmPassword') }}
          <input
            v-model="confirmPassword"
            type="password"
            :placeholder="t('auth.invite.confirmPasswordPlaceholder')"
            autocomplete="new-password"
            required
            minlength="8"
            :disabled="submitting"
          />
        </label>

        <button type="submit" :aria-busy="submitting" :disabled="submitting">
          {{ submitting ? t('auth.invite.submitting') : t('auth.invite.submit') }}
        </button>
      </form>
    </template>

    <template #footer>
      {{ t('auth.invite.footerPrompt') }}
      <router-link :to="{ name: 'login' }">{{ t('auth.invite.footerSignIn') }}</router-link>
    </template>
  </AuthLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import { fetchInvite } from '@/features/auth/api'
import AuthLayout from '@/features/auth/components/AuthLayout.vue'

const { t } = useI18n()
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
      loadError.value = msg || t('auth.invite.loadErrorInvalid')
    } else {
      loadError.value = t('auth.login.errorNetwork')
    }
  } finally {
    inviteLoading.value = false
  }
})

async function handleSubmit() {
  formError.value = ''

  if (password.value !== confirmPassword.value) {
    formError.value = t('auth.invite.passwordMismatch')
    return
  }

  submitting.value = true

  try {
    await authStore.completeInvite(route.params.token, password.value)
    router.push('/')
  } catch (err) {
    if (err.response) {
      const msg = err.response.data?.error
      formError.value = msg || t('auth.invite.submitError')
    } else {
      formError.value = t('auth.login.errorNetwork')
    }
  } finally {
    submitting.value = false
  }
}
</script>
