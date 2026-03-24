/** Pair returned by login, invite completion, and refresh. */
export interface AuthTokenPair {
  accessToken: string
  refreshToken: string
}
