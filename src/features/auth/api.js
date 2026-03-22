import api from '@/shared/api/client'

export function login(email, password) {
  return api.post('/api/auth/login', { email, password })
    .then(({ data }) => ({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    }))
}

export function completeInvite(token, password) {
  return api.post(`/api/auth/invite/${token}`, { password })
    .then(({ data }) => ({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    }))
}

export function fetchInvite(token) {
  return api.get(`/api/auth/invite/${token}`)
    .then(({ data }) => data)
}

/**
 * @returns {Promise<{ account: { email: string }, settings: { locale: 'en' | 'ru' | null } }>}
 */
export function fetchAccount() {
  return api.get('/api/account').then(({ data }) => data)
}

/**
 * Partial update — omit keys you do not want to change.
 * @param {Record<string, unknown>} body
 * @returns {Promise<{ account: { email: string }, settings: { locale: 'en' | 'ru' | null } }>}
 */
export function updateAccount(body) {
  return api.put('/api/account', body).then(({ data }) => data)
}
