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
  function getClaims(token) {
    const raw = token ?? localStorage.getItem(TOKEN_KEY)
    const payload = decode(raw)
    if (!payload) return null
    return {
      sub: payload.sub,
      orgId: payload.org_id,
      hotelId: payload.hotel_id,
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
