/** Claims the app reads from the access token (decoded on the client, never verified). */
export interface JwtClaims {
  sub: string | null
  email: string | null
  orgId: string | null
  hotelId: string | null
  employeeId: string | null
  tokenUse: 'access' | 'refresh' | null
}

const TOKEN_KEY = 'access_token'

/** JWT payload without signature check; `null` when the token is missing or malformed. */
function decode(token: string | null | undefined): Record<string, unknown> | null {
  if (!token) return null
  try {
    const base64 = token.split('.')[1]
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function useJwt() {
  function getClaims(token?: string | null): JwtClaims | null {
    const raw = token ?? localStorage.getItem(TOKEN_KEY)
    const payload = decode(raw)
    if (!payload) return null
    return {
      sub: typeof payload.sub === 'string' ? payload.sub : null,
      email: typeof payload.email === 'string' ? payload.email : null,
      orgId: typeof payload.org_id === 'string' ? payload.org_id : null,
      hotelId: typeof payload.hotel_id === 'string' ? payload.hotel_id : null,
      employeeId: typeof payload.employee_id === 'string' ? payload.employee_id : null,
      tokenUse:
        payload.token_use === 'access' || payload.token_use === 'refresh'
          ? payload.token_use
          : null,
    }
  }

  function isExpired(token?: string | null): boolean {
    const raw = token ?? localStorage.getItem(TOKEN_KEY)
    const exp = decode(raw)?.exp
    if (typeof exp !== 'number' || !exp) return true
    return Date.now() >= exp * 1000
  }

  return { decode, getClaims, isExpired }
}
