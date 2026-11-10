import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import api from '@/shared/api/client'
import type { components, paths } from '@/shared/api/schema'

/**
 * Typed requests over the existing axios client (decision D13).
 *
 * Method, path, path parameters, query, body and response come from the
 * generated contract types (`schema.d.ts`). The axios instance and its
 * interceptors stay as they are, so auth, refresh and error handling do not
 * change.
 *
 * @example
 * const { data } = await typedApi.get('/api/bookings/{id}', { path: { id } })
 */

/** Schemas of the contract by name, e.g. `Schemas['bookinghttp.BookingItem']`. */
export type Schemas = components['schemas']

type HttpMethod = 'get' | 'post' | 'put' | 'delete'

/** Operation of `path` for `method`; `never` when the contract has none. */
type Operation<P extends keyof paths, M extends HttpMethod> = NonNullable<paths[P][M]>

/** Paths that have an operation for `method`. */
export type PathsWith<M extends HttpMethod> = {
  [P in keyof paths]: [Operation<P, M>] extends [never] ? never : P
}[keyof paths]

type ParametersOf<Op> = Op extends { parameters: infer Params } ? Params : never

type PathOption<Op> =
  ParametersOf<Op> extends { path: infer Path }
    ? [Path] extends [never | undefined]
      ? { path?: never }
      : { path: Path }
    : { path?: never }

type QueryOption<Op> =
  ParametersOf<Op> extends { query?: infer Query }
    ? [NonNullable<Query>] extends [never]
      ? { query?: never }
      : { query?: Query }
    : { query?: never }

type BodyOption<Op> = Op extends { requestBody: { content: { 'application/json': infer Body } } }
  ? { body: Body }
  : Op extends { requestBody?: { content: { 'application/json': infer Body } } }
    ? { body?: Body }
    : { body?: never }

/** Query parameters of an operation, e.g. `QueryOf<'/api/bookings', 'get'>`. */
export type QueryOf<P extends keyof paths, M extends HttpMethod> = NonNullable<
  ParametersOf<Operation<P, M>> extends { query?: infer Query } ? Query : never
>

/** JSON request body of an operation, e.g. `BodyOf<'/api/bookings', 'post'>`. */
export type BodyOf<P extends keyof paths, M extends HttpMethod> =
  Operation<P, M> extends { requestBody?: { content: { 'application/json': infer Body } } }
    ? Body
    : never

/** Axios options a request may still need: conditional headers, accepted statuses. */
type AxiosOptions = Pick<AxiosRequestConfig, 'headers' | 'validateStatus'>

/** Options of a request; `path` and `body` are required when the operation requires them. */
export type TypedRequestInit<Op> = PathOption<Op> &
  QueryOption<Op> &
  BodyOption<Op> & {
    /** Aborts the request, e.g. when Pinia Colada supersedes a query. */
    signal?: AbortSignal
    axios?: AxiosOptions
  }

type SuccessStatus = 200 | 201 | 202 | 204

/** JSON body of the success responses of an operation; `undefined` for `204`. */
export type ResponseBody<Op> = Op extends { responses: infer Responses }
  ? {
      [S in keyof Responses & SuccessStatus]: Responses[S] extends {
        content: { 'application/json': infer Body }
      }
        ? Body
        : undefined
    }[keyof Responses & SuccessStatus]
  : never

/** `init` is optional when nothing in it is required. */
type InitArgs<Op> =
  object extends TypedRequestInit<Op> ? [init?: TypedRequestInit<Op>] : [init: TypedRequestInit<Op>]

type Method<M extends HttpMethod> = <P extends PathsWith<M>>(
  path: P,
  ...args: InitArgs<Operation<P, M>>
) => Promise<AxiosResponse<ResponseBody<Operation<P, M>>>>

/** Substitutes `{name}` placeholders with encoded path parameters. */
export function buildPath(template: string, params: Record<string, unknown> | undefined): string {
  return template.replace(/\{([^}]+)\}/g, (_, name: string) => {
    const value = params?.[name]
    if (value === undefined || value === null || value === '') {
      throw new Error(`Missing path parameter "${name}" for ${template}`)
    }
    return encodeURIComponent(String(value))
  })
}

/** Typed methods over an axios instance. */
export function createTypedApi(instance: AxiosInstance) {
  function method<M extends HttpMethod>(name: M): Method<M> {
    return ((path: string, init: object = {}) => {
      const options = init as {
        path?: Record<string, unknown>
        query?: Record<string, unknown>
        body?: unknown
        signal?: AbortSignal
        axios?: AxiosOptions
      }
      return instance.request({
        method: name,
        url: buildPath(path, options.path),
        params: options.query,
        data: options.body,
        signal: options.signal,
        ...options.axios,
      })
    }) as Method<M>
  }

  return {
    get: method('get'),
    post: method('post'),
    put: method('put'),
    delete: method('delete'),
  }
}

/** Typed client over the app axios instance (JWT, refresh, error toasts). */
export const typedApi = createTypedApi(api)
