import { enUS, ru } from 'date-fns/locale'

export function dateFnsLocaleForApp(code: string) {
  return code === 'ru' ? ru : enUS
}
