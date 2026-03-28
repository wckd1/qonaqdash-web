<template>
  <AuthLayout :title="t('auth.invite.title')" :subtitle="t('auth.invite.subtitle')">
    <div v-if="loadError" class="form-error">{{ loadError }}</div>

    <template v-else-if="inviteLoading">
      <p aria-busy="true">{{ t('auth.invite.loading') }}</p>
    </template>

    <template v-else-if="invite">
      <div class="form-info">
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
          <abbr class="required" :title="t('common.required')">*</abbr>
          <input
            v-model="password"
            type="password"
            :placeholder="t('auth.invite.password_placeholder')"
            autocomplete="new-password"
            required
            minlength="8"
            :disabled="submitting"
          />
        </label>

        <label>
          {{ t('auth.invite.confirm_password') }}
          <abbr class="required" :title="t('common.required')">*</abbr>
          <input
            v-model="confirmPassword"
            type="password"
            :placeholder="t('auth.invite.confirm_password_placeholder')"
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
      {{ t('auth.invite.footer_prompt') }}
      <router-link :to="{ name: 'login' }">{{ t('auth.invite.footer_sign_in') }}</router-link>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import { useSettingsStore } from '@/shared/stores/useSettingsStore'
import { fetchInvite } from '@/features/auth/api'
import { formatApiError, formatUnknownApiError } from '@/shared/i18n/apiError'
import { httpErrorData, httpErrorResponse } from '@/shared/unknownError'
import AuthLayout from '@/features/auth/components/AuthLayout.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()

interface InvitePreview {
  organization_name?: string
  email?: string
}

const invite = ref<InvitePreview | null>(null)
const inviteLoading = ref(true)
const loadError = ref('')

const password = ref('')
const confirmPassword = ref('')
const submitting = ref(false)
const formError = ref('')

onMounted(async () => {
  const token = route.params.token
  const tok = typeof token === 'string' ? token : Array.isArray(token) ? token[0] : ''
  if (!tok) {
    loadError.value = t('auth.invite.load_error_invalid')
    inviteLoading.value = false
    return
  }
  try {
    invite.value = (await fetchInvite(tok)) as InvitePreview
  } catch (err: unknown) {
    if (httpErrorResponse(err)) {
      const msg = formatApiError(httpErrorData(err)?.error)
      loadError.value = msg || t('auth.invite.load_error_invalid')
    } else {
      loadError.value = formatUnknownApiError(err) || t('auth.login.error_network')
    }
  } finally {
    inviteLoading.value = false
  }
})

async function handleSubmit() {
  formError.value = ''

  if (password.value !== confirmPassword.value) {
    formError.value = t('auth.invite.password_mismatch')
    return
  }

  const token = route.params.token
  const tok = typeof token === 'string' ? token : Array.isArray(token) ? token[0] : ''
  if (!tok) {
    formError.value = t('auth.invite.load_error_invalid')
    return
  }

  submitting.value = true

  try {
    await authStore.completeInvite(tok, password.value)
    void settingsStore.fetchUserSettings().catch(() => {})
    router.push('/')
  } catch (err: unknown) {
    if (httpErrorResponse(err)) {
      const msg = formatApiError(httpErrorData(err)?.error)
      formError.value = msg || t('auth.invite.submit_error')
    } else {
      formError.value = formatUnknownApiError(err) || t('auth.login.error_network')
    }
  } finally {
    submitting.value = false
  }
}
</script>
