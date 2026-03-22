import api, { refreshTransport } from '@/shared/api/client'

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
 * Exchange refresh JWT for a new access/refresh pair (§2). Uses transport without main API interceptors.
 * @param {string} refreshToken
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
export function refreshTokens(refreshToken) {
  return refreshTransport
    .post('/api/auth/refresh', { refresh_token: refreshToken })
    .then(({ data }) => ({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    }))
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
