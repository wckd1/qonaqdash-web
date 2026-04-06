/** Pair returned by login, invite completion, and refresh. */
export interface AuthTokenPair {
  access_token: string
  refresh_token: string
}

export interface JwtClaims {
  sub: string | null
  email: string | null
  orgId: string | null
  hotelId: string | null
  employeeId: string | null
  tokenUse: 'access' | 'refresh' | null
}
