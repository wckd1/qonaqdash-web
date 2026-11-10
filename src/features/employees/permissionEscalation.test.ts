import { beforeEach, describe, expect, test } from 'vitest'
import { i18n } from '@/i18n'
import {
  permissionEscalationMessage,
  permissionKeyLabel,
} from '@/features/employees/permissionEscalation'

function httpError(status: number, error: Record<string, unknown>) {
  return { response: { status, data: { error } } }
}

beforeEach(() => {
  i18n.global.locale.value = 'en'
})

describe('permissionEscalationMessage', () => {
  test('names the permissions that cannot be granted', () => {
    const err = httpError(403, {
      code: 'iam.permission_escalation',
      message: 'permission escalation',
      fields: ['billing.refund', 'bookings.create'],
    })

    expect(permissionEscalationMessage(err)).toBe(
      'You cannot grant permissions above your own: Billing: Record refunds, Bookings: Create bookings',
    )
  })

  test('falls back to the error message without fields', () => {
    const err = httpError(403, { code: 'iam.permission_escalation', message: 'x' })

    expect(permissionEscalationMessage(err)).toBe('You cannot grant permissions above your own')
  })

  test('ignores other errors', () => {
    expect(permissionEscalationMessage(httpError(403, { code: 'common.forbidden' }))).toBeNull()
    expect(permissionEscalationMessage(new Error('network'))).toBeNull()
  })
})

describe('permissionKeyLabel', () => {
  test('keeps a key it does not know', () => {
    expect(permissionKeyLabel('spa.view')).toBe('spa.view')
  })
})
