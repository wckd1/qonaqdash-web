import { i18n } from '@/i18n'

/**
 * @param {unknown} data - `response.data`
 * @returns {string | null}
 */
export function getApiErrorCode(data) {
  const e = data?.error
  if (typeof e === 'object' && e !== null && typeof e.code === 'string') return e.code
  return null
}

/**
 * Human-readable message for API `error`: plain string or object with `code` / `message` / `fields`.
 * @param {unknown} payload - `response.data.error`
 * @returns {string}
 */
export function formatApiError(payload) {
  if (payload == null || payload === '') return ''
  if (typeof payload === 'string') return payload
  if (typeof payload === 'object' && payload !== null) {
    const code = payload.code
    const message = typeof payload.message === 'string' ? payload.message : ''
    if (typeof code === 'string' && code.length > 0) {
      const path = `errors.${code}`
      const g = i18n.global
      if (g.te(path)) {
        const fields = Array.isArray(payload.fields) ? payload.fields.filter(Boolean) : []
        return fields.length ? g.t(path, { fields: fields.join(', ') }) : g.t(path)
      }
    }
    return message || (typeof code === 'string' ? code : '')
  }
  return String(payload)
}

/** `formatApiError` for values caught as `unknown` (e.g. Axios errors). */
export function formatUnknownApiError(err: unknown): string {
  if (typeof err !== 'object' || err === null) return ''
  const r = err as { response?: { data?: { error?: unknown } } }
  return formatApiError(r.response?.data?.error) || ''
}
