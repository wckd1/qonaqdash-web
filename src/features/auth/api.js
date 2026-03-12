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
