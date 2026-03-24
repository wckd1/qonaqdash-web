import * as axiosNs from 'axios'
import { formatApiError, getApiErrorCode } from '@/shared/i18n/apiError'
import { useNotification } from '@/shared/composables/useNotification'

/**
 * Axios typings resolve as namespace-only under `moduleResolution: "bundler"` + package `exports`;
 * runtime exposes the client on `default`.
 */
const axios: any = (axiosNs as any).default ?? axiosNs

const TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

/** No JWT / app interceptors — used for refresh only (§2). */
export const refreshTransport = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
})

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
})

/** Single-flight refresh so concurrent 401s share one POST /api/auth/refresh. */
let refreshPromise: Promise<void> | null = null

function refreshAccessToken() {
  if (refreshPromise) return refreshPromise

  const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!storedRefresh) {
    return Promise.reject(new Error('missing refresh token'))
  }

  refreshPromise = refreshTransport
    .post('/api/auth/refresh', { refresh_token: storedRefresh })
    .then(async ({ data }) => {
      const access = data.access_token
      const nextRefresh = data.refresh_token
      localStorage.setItem(TOKEN_KEY, access)
      localStorage.setItem(REFRESH_TOKEN_KEY, nextRefresh)
      const { useAuthStore } = await import('@/features/auth/stores/useAuthStore')
      useAuthStore().setTokens(access, nextRefresh)
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

async function clearSessionAndRedirectLogin() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  const { useAuthStore } = await import('@/features/auth/stores/useAuthStore')
  useAuthStore().logout()
  window.location.href = '/auth/login'
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (err) => {
    const { error: showError } = useNotification()

    if (!err.response) {
      showError('Network error. Please check your connection.')
      return Promise.reject(err)
    }

    const { status, data } = err.response

    if (status === 401) {
      const url = String(err.config?.url || '')
      const method = String(err.config?.method || '').toLowerCase()
      /** Wrong current password on profile update — must not clear session. */
      const isAccountPut =
        method === 'put' && url.includes('/api/account')
      /** Login / invite — no session recovery via refresh here. */
      const isPublicAuth =
        (method === 'post' && url.includes('/api/auth/login')) ||
        (url.includes('/api/auth/invite/') && (method === 'get' || method === 'post'))
      const isAuthRoute = url.startsWith('/api/auth/')

      const errorCode = getApiErrorCode(data)
      const canTryRefresh =
        errorCode === 'common.jwt_expired' &&
        !err.config?.__authRefreshRetried &&
        !isPublicAuth

      if (canTryRefresh) {
        err.config.__authRefreshRetried = true
        try {
          await refreshAccessToken()
          const token = localStorage.getItem(TOKEN_KEY)
          if (!token) {
            await clearSessionAndRedirectLogin()
            return Promise.reject(err)
          }
          err.config.headers = err.config.headers || {}
          err.config.headers.Authorization = `Bearer ${token}`
          return api.request(err.config)
        } catch (refreshErr: unknown) {
          const refreshHadResponse =
            axios.isAxiosError(refreshErr) &&
            !!(refreshErr as { response?: unknown }).response
          const noRefreshStored = !localStorage.getItem(REFRESH_TOKEN_KEY)
          if (refreshHadResponse || noRefreshStored) {
            await clearSessionAndRedirectLogin()
          }
          return Promise.reject(err)
        }
      }

      if (isAccountPut || isAuthRoute) {
        return Promise.reject(err)
      }
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      window.location.href = '/auth/login'
      return Promise.reject(err)
    }

    const url = String(err.config?.url || '')
    const method = String(err.config?.method || '').toLowerCase()
    /** Login, invite fetch, invite-complete: inline errors only, no global toast. */
    if (method === 'get' && /\/api\/auth\/invite\//.test(url)) {
      return Promise.reject(err)
    }
    if (
      method === 'post' &&
      (url.includes('/api/auth/login') || /\/api\/auth\/invite\/[^/]+$/.test(url))
    ) {
      return Promise.reject(err)
    }

    if (status === 409) {
      showError(
        formatApiError(data?.error) ||
          'Conflict: the resource was modified. Please retry.',
      )
      return Promise.reject(err)
    }

    const message = formatApiError(data?.error) || `Request failed (${status})`
    showError(message)
    return Promise.reject(err)
  },
)

export default api
