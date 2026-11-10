import { i18n } from '@/i18n'
import { getApiErrorCode } from '@/shared/i18n/apiError'
import { httpErrorResponse } from '@/shared/unknownError'

/** Label of a permission key such as `billing.refund`, e.g. "Billing: Record refunds". */
export function permissionKeyLabel(key: string): string {
  const [area, action] = key.split('.')
  const g = i18n.global
  const areaPath = `permissions.areas.${area}`
  const actionPath = `permissions.actions.${area}.${action}`
  if (!area || !action || !g.te(areaPath) || !g.te(actionPath)) return key
  return `${g.t(areaPath)}: ${g.t(actionPath)}`
}

/**
 * Message for `403 iam.permission_escalation`: the change would raise the
 * permissions in `error.fields` above the caller's own levels. The permission
 * screens show it next to the change (the API client shows no toast for it).
 * `null` for any other error.
 */
export function permissionEscalationMessage(err: unknown): string | null {
  const res = httpErrorResponse(err)
  if (res?.status !== 403 || getApiErrorCode(res.data) !== 'iam.permission_escalation') return null
  const raw = (res.data?.error as { fields?: unknown } | undefined)?.fields
  const keys = Array.isArray(raw)
    ? raw.filter((k): k is string => typeof k === 'string' && k.length > 0)
    : []
  const g = i18n.global
  if (!keys.length) return g.t('errors.iam.permission_escalation')
  return g.t('employees.permission_escalation_keys', {
    permissions: keys.map(permissionKeyLabel).join(', '),
  })
}
