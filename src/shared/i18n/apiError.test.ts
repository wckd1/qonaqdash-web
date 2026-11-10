import { beforeEach, describe, expect, test } from 'vitest'
import { i18n } from '@/i18n'
import en from '@/locales/en.json'
import { formErrorsMapFromHttpError } from '@/shared/i18n/apiError'

/** Axios-style error with a JSON error envelope. */
function httpError(status: number, error: Record<string, unknown>) {
  return { response: { status, data: { error } } }
}

beforeEach(() => {
  i18n.global.locale.value = 'en'
})

describe('formErrorsMapFromHttpError', () => {
  test('maps the issues of a 422 validation error to their fields', () => {
    const err = httpError(422, {
      code: 'common.validation_failed',
      message: 'validation failed',
      issues: [
        { code: 'validation.required', message: 'required', fields: ['guest.email'] },
        { code: 'validation.failed', message: 'not allowed' },
      ],
    })

    expect(formErrorsMapFromHttpError(err)).toEqual({
      'guest.email': ['required'],
      '': ['not allowed'],
    })
  })

  // F4 (review): a 400 with `fields` is a field error too, not only a toast.
  test('maps a 400 error with fields to each of its fields', () => {
    const err = httpError(400, {
      code: 'guest.contact_required',
      message: 'at least one of email or phone is required',
      fields: ['email', 'phone'],
    })

    const message = en.errors.guest.contact_required
    expect(formErrorsMapFromHttpError(err)).toEqual({ email: [message], phone: [message] })
  })

  test('leaves a 400 error without fields to the caller', () => {
    const err = httpError(400, { code: 'iam.invalid_email', message: 'invalid email' })

    expect(formErrorsMapFromHttpError(err)).toBeNull()
  })

  test('leaves errors of other statuses to the caller even with fields', () => {
    const err = httpError(409, {
      code: 'iam.email_already_in_use',
      message: 'email already in use',
      fields: ['email'],
    })

    expect(formErrorsMapFromHttpError(err)).toBeNull()
  })
})
