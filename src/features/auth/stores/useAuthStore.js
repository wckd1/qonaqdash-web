import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useJwt } from '@/shared/composables/useJwt'
import * as authApi from '@/features/auth/api'

const TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export const useAuthStore = defineStore('auth', () => {
  const { getClaims, isExpired } = useJwt()

  const accessToken = ref(localStorage.getItem(TOKEN_KEY) || '')
  const refreshToken = ref(localStorage.getItem(REFRESH_TOKEN_KEY) || '')

  const user = computed(() => {
    if (!accessToken.value) return null
    return getClaims(accessToken.value)
  })

  const isAuthenticated = computed(() => {
    return !!accessToken.value && !isExpired(accessToken.value)
  })

  const orgId = computed(() => user.value?.orgId ?? null)
  const hotelId = computed(() => user.value?.hotelId ?? null)
  const userId = computed(() => user.value?.sub ?? null)

  function setTokens(access, refresh) {
    accessToken.value = access
    refreshToken.value = refresh || ''
    localStorage.setItem(TOKEN_KEY, access)
    if (refresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    }
  }

  function clearTokens() {
    accessToken.value = ''
    refreshToken.value = ''
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }

  async function login(email, password) {
    const tokens = await authApi.login(email, password)
    setTokens(tokens.accessToken, tokens.refreshToken)
  }

  async function completeInvite(token, password) {
    const tokens = await authApi.completeInvite(token, password)
    setTokens(tokens.accessToken, tokens.refreshToken)
  }

  function logout() {
    clearTokens()
  }

  return {
    accessToken,
    refreshToken,
    user,
    isAuthenticated,
    orgId,
    hotelId,
    userId,
    login,
    completeInvite,
    logout,
  }
})
