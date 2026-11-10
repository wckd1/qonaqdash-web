/**
 * Unsigned JWTs for unit tests. The client only decodes the payload and never
 * checks the signature, so a fake one is enough.
 */

/** The claims the backend puts into an access token, besides `token_use` and `exp`. */
export const TEST_CLAIMS = {
  sub: 'user-1',
  org_id: 'org-1',
  hotel_id: 'hotel-1',
} as const

function base64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function makeJwt(payload: Record<string, unknown>): string {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  return `${header}.${base64Url(JSON.stringify(payload))}.signature`
}

/**
 * Token that expires `expiresInSeconds` from now (negative means already expired).
 * Extra claims override the defaults.
 */
export function makeToken(
  tokenUse: 'access' | 'refresh',
  expiresInSeconds: number,
  claims: Record<string, unknown> = {},
): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds
  return makeJwt({ ...TEST_CLAIMS, token_use: tokenUse, exp, ...claims })
}
