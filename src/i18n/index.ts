import { createI18n } from 'vue-i18n'
import en from '@/locales/en.json'
import ru from '@/locales/ru.json'
import { resolveInitialLocale } from '@/shared/i18n/resolveLocale'

/**
 * Russian CLDR plural rule: one | few | many.
 *   one  — 1, 21, 31 … (n % 10 === 1 && n % 100 !== 11)
 *   few  — 2-4, 22-24 … (n % 10 in 2..4 && n % 100 not in 12..14)
 *   many — everything else (0, 5-20, 25-30 …)
 */
function russianPlural(choice: number, choicesLength: number): number {
  if (choicesLength < 3) return choice === 1 ? 0 : 1
  const mod10 = choice % 10
  const mod100 = choice % 100
  if (mod10 === 1 && mod100 !== 11) return 0
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 1
  return 2
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: resolveInitialLocale(),
  fallbackLocale: 'en',
  messages: { en, ru },
  pluralRules: { ru: russianPlural },
})
