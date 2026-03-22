import axios from 'axios'
import { formatApiError } from '@/shared/i18n/apiError'
import { useNotification } from '@/shared/composables/useNotification'

const TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (err) => {
    const { error: showError } = useNotification()

    if (!err.response) {
      showError('Network error. Please check your connection.')
      return Promise.reject(err)
    }

    const { status, data } = err.response

    if (status === 401) {
      const isAuthRequest = err.config?.url?.startsWith('/api/auth/')
      /** Wrong current password on profile update — must not clear session. */
      const isAccountPut =
        String(err.config?.method || '').toLowerCase() === 'put' &&
        String(err.config?.url || '').includes('/api/account')
      if (!isAuthRequest && !isAccountPut) {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
        window.location.href = '/auth/login'
      }
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
