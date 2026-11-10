import { refreshTransport, type RequestOptions } from '@/shared/api/client'
import { createTypedApi, typedApi, type Schemas } from '@/shared/api/typed'

export type AuthTokenPair = Schemas['iamhttp.AuthTokensResponse']
export type AccountBundleResponse = Schemas['iamhttp.AccountBundleResponse']
export type UpdateAccountRequest = Schemas['iamhttp.UpdateAccountRequest']
export type InviteInfo = Schemas['iamhttp.InviteInfoResponse']

/** Refresh goes around the main client interceptors, so a failed refresh cannot recurse. */
const refreshApi = createTypedApi(refreshTransport)

function tokenPair(data: AuthTokenPair): AuthTokenPair {
  return { access_token: data.access_token, refresh_token: data.refresh_token }
}

export function login(email: string, password: string): Promise<AuthTokenPair> {
  return typedApi
    .post('/api/auth/login', { body: { email, password } })
    .then(({ data }) => tokenPair(data))
}

export function completeInvite(token: string, password: string): Promise<AuthTokenPair> {
  return typedApi
    .post('/api/auth/invite/{token}', { path: { token }, body: { password } })
    .then(({ data }) => tokenPair(data))
}

export function fetchInvite(token: string, options: RequestOptions = {}): Promise<InviteInfo> {
  return typedApi
    .get('/api/auth/invite/{token}', { path: { token }, signal: options.signal })
    .then(({ data }) => data)
}

/** Exchange refresh JWT for a new access/refresh pair. */
export function refreshTokens(currentRefreshToken: string): Promise<AuthTokenPair> {
  return refreshApi
    .post('/api/auth/refresh', { body: { refresh_token: currentRefreshToken } })
    .then(({ data }) => tokenPair(data))
}

/** Account, profile, settings and effective permissions of the signed-in user. */
export function fetchAccount(options: RequestOptions = {}): Promise<AccountBundleResponse> {
  return typedApi.get('/api/account', { signal: options.signal }).then(({ data }) => data)
}

/** Partial update — omit keys you do not want to change. */
export function updateAccount(body: UpdateAccountRequest): Promise<AccountBundleResponse> {
  return typedApi.put('/api/account', { body }).then(({ data }) => data)
}
