import type { JwtClaims } from '@/shared/types/auth'

const TOKEN_KEY = 'access_token'

function decode(token) {
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
  function getClaims(token): JwtClaims | null {
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

  function isExpired(token) {
    const raw = token ?? localStorage.getItem(TOKEN_KEY)
    const payload = decode(raw)
    if (!payload?.exp) return true
    return Date.now() >= payload.exp * 1000
  }

  return { decode, getClaims, isExpired }
}
