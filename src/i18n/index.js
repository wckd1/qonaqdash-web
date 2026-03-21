import { createI18n } from 'vue-i18n'
import en from '@/locales/en.json'
import ru from '@/locales/ru.json'
import { resolveInitialLocale } from '@/shared/i18n/resolveLocale'

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: resolveInitialLocale(),
  fallbackLocale: 'en',
  messages: { en, ru },
})
