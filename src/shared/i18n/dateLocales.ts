import { enUS, ru } from 'date-fns/locale'

/**
 * @param {'en' | 'ru'} code
 */
export function dateFnsLocaleForApp(code) {
  return code === 'ru' ? ru : enUS
}
