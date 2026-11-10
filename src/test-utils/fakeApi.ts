import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

/** What a fake route answers: a status and an optional JSON body. */
export interface FakeResponse {
  status: number
  data?: unknown
}

/** Answers a request; `config.params` and `config.data` hold the query and the body. */
export type FakeRoute = (config: InternalAxiosRequestConfig) => FakeResponse

/**
 * Routes by `"METHOD /path"`, e.g. `"GET /api/bookings/b1"`. The path is the
 * request URL without the query string, as the typed client builds it.
 */
export type FakeRoutes = Map<string, FakeRoute>

/**
 * Axios adapter that answers from `routes` instead of the network. A route
 * that is not defined answers `501`. Non-2xx answers reject with an
 * `AxiosError` that carries `response`, like a real request. Set it as
 * `instance.defaults.adapter` to keep the interceptors of an instance.
 */
export function fakeAdapter(routes: FakeRoutes): AxiosAdapter {
  return async (config) => {
    const method = (config.method ?? 'get').toUpperCase()
    const path = String(config.url ?? '').split('?')[0]
    const route = routes.get(`${method} ${path}`)
    const answer = route
      ? route(config)
      : { status: 501, data: { error: { code: 'test.no_route', message: `${method} ${path}` } } }
    const response: AxiosResponse = {
      data: answer.data ?? '',
      status: answer.status,
      statusText: String(answer.status),
      headers: new AxiosHeaders(),
      config,
    }
    const validate = config.validateStatus ?? ((s: number) => s >= 200 && s < 300)
    if (validate(answer.status)) return response
    throw new AxiosError(
      `Request failed with status code ${answer.status}`,
      answer.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      null,
      response,
    )
  }
}

/**
 * Axios instance that answers from `routes` (see `fakeAdapter`), so a test can
 * mock `@/shared/api/client` and keep the real feature `api.ts` modules.
 */
export function createFakeApi(routes: FakeRoutes): AxiosInstance {
  return axios.create({ adapter: fakeAdapter(routes) })
}

/** JSON error envelope of the API (`sharedhttp.ErrorResponse`). */
export function apiError(
  status: number,
  code: string,
  message = code,
  extra: Record<string, unknown> = {},
): FakeResponse {
  return { status, data: { error: { code, message, ...extra } } }
}
