import api, { refreshTransport } from '@/shared/api/client'
import type { AuthTokenPair } from '@/shared/types/auth'

export type { AuthTokenPair } from '@/shared/types/auth'

export function login(email: string, password: string): Promise<AuthTokenPair> {
  return api.post('/api/auth/login', { email, password }).then(({ data }) => ({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  }))
}

export function completeInvite(token: string, password: string): Promise<AuthTokenPair> {
  return api.post(`/api/auth/invite/${token}`, { password }).then(({ data }) => ({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  }))
}

export function fetchInvite(token: string) {
  return api.get(`/api/auth/invite/${token}`).then(({ data }) => data)
}

/**
 * Exchange refresh JWT for a new access/refresh pair. Uses transport without main API interceptors.
 */
export function refreshTokens(refreshToken: string): Promise<AuthTokenPair> {
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
export function updateAccount(body: Record<string, unknown>) {
  return api.put('/api/account', body).then(({ data }) => data)
}
