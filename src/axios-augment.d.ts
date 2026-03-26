export {}

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    __authRefreshRetried?: boolean
  }
}
