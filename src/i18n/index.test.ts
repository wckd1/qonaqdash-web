import { describe, expect, test } from 'vitest'
import { i18n } from '@/i18n'
import en from '@/locales/en.json'
import ru from '@/locales/ru.json'

function messageKeys(messages: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object') {
      return messageKeys(value as Record<string, unknown>, path)
    }
    return [path]
  })
}

describe('locale messages', () => {
  // vue-i18n compiles messages on first use and throws on a syntax error,
  // e.g. a bare `@` that starts a linked message.
  test.each([
    ['en', en],
    ['ru', ru],
  ] as const)('every %s message compiles', (locale, messages) => {
    for (const key of messageKeys(messages)) {
      expect(() => i18n.global.t(key, {}, { locale }), key).not.toThrow()
    }
  })
})

test('renders an escaped @ as is', () => {
  expect(i18n.global.t('auth.login.email_placeholder', {}, { locale: 'en' })).toBe(
    'name@domain.com',
  )
})
