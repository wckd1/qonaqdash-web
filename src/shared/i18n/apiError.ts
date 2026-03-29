import { i18n } from '@/i18n'
import { httpErrorData } from '@/shared/unknownError'

/**
 * @param {unknown} data - `response.data`
 * @returns {string | null}
 */
export function getApiErrorCode(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const e = (data as { error?: unknown }).error
  if (typeof e === 'object' && e !== null && typeof (e as { code?: unknown }).code === 'string') {
    return (e as { code: string }).code
  }
  return null
}

/**
 * Human-readable message for API `error`: plain string or object with `code` / `message` / `fields`.
 * @param {unknown} payload - `response.data.error`
 * @returns {string}
 */
export function formatApiError(payload: unknown): string {
  if (payload == null || payload === '') return ''
  if (typeof payload === 'string') return payload
  if (typeof payload === 'object' && payload !== null) {
    const o = payload as { code?: unknown; message?: unknown; fields?: unknown }
    const code = o.code
    const message = typeof o.message === 'string' ? o.message : ''
    if (typeof code === 'string' && code.length > 0) {
      const path = `errors.${code}`
      const g = i18n.global
      if (g.te(path)) {
        const fields = Array.isArray(o.fields) ? o.fields.filter(Boolean) : []
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

function appendFormError(map: Record<string, string[]>, bind: string, message: string): void {
  const m = message.trim()
  if (!m) return
  if (!map[bind]) map[bind] = []
  if (!map[bind].includes(m)) map[bind].push(m)
}

/** Single line for an API validation issue (prefer server `message`, else i18n by `code`). */
function formatValidationIssueMessage(issue: { code?: unknown; message?: unknown }): string {
  const rawMsg = typeof issue.message === 'string' ? issue.message.trim() : ''
  if (rawMsg) return rawMsg
  const code = typeof issue.code === 'string' ? issue.code : ''
  if (code) {
    const g = i18n.global
    const path = `errors.${code}`
    if (g.te(path)) return String(g.t(path))
  }
  return code || String(i18n.global.t('form_dsl.validation.generic'))
}

/**
 * When `response.data` is `{ error: { code: common.validation_failed, issues: [...] } }`,
 * build a FormEdit `errorsMap` (bind path → messages). Issues without `fields` go under `""`.
 */
export function formErrorsMapFromResponseData(data: unknown): Record<string, string[]> | null {
  if (getApiErrorCode(data) !== 'common.validation_failed') return null

  const errRaw =
    data && typeof data === 'object' ? (data as { error?: unknown }).error : undefined
  const map: Record<string, string[]> = {}

  if (errRaw && typeof errRaw === 'object' && !Array.isArray(errRaw)) {
    const issues = (errRaw as { issues?: unknown }).issues
    if (Array.isArray(issues)) {
      for (const raw of issues) {
        if (!raw || typeof raw !== 'object') continue
        const issue = raw as { code?: unknown; message?: unknown; fields?: unknown }
        const text = formatValidationIssueMessage(issue)
        const fields = Array.isArray(issue.fields)
          ? issue.fields.filter((f): f is string => typeof f === 'string' && f.length > 0)
          : []
        if (fields.length === 0) {
          appendFormError(map, '', text)
        } else {
          for (const f of fields) {
            appendFormError(map, f, text)
          }
        }
      }
    }
  }

  if (Object.keys(map).length > 0) return map

  const summary =
    errRaw && typeof errRaw === 'object' && !Array.isArray(errRaw)
      ? formatApiError(errRaw)
      : ''
  if (summary) return { '': [summary] }
  return { '': [String(i18n.global.t('errors.common.validation_failed'))] }
}

/**
 * Parse guest/booking form save errors: `common.validation_failed` + `issues`, or legacy top-level `errors`.
 */
export function formErrorsMapFromHttpError(err: unknown): Record<string, string[]> | null {
  const data = httpErrorData(err)
  if (!data) return null
  const fromIssues = formErrorsMapFromResponseData(data)
  if (fromIssues) return fromIssues
  const top = data.errors
  if (top && typeof top === 'object' && !Array.isArray(top)) {
    return top as Record<string, string[]>
  }
  return null
}
