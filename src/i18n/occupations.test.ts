import { describe, expect, test } from 'vitest'
import en from '@/locales/en.json'
import ru from '@/locales/ru.json'

/** Title keys of the default occupation templates the backend creates for an organization. */
const DEFAULT_OCCUPATIONS = [
  'chain_director',
  'general_manager',
  'hotel_director',
  'accountant',
  'office_administrator',
  'revenue_manager',
  'front_office_manager',
  'night_auditor',
  'receptionist',
  'housekeeper',
  'housekeeping_supervisor',
  'maintenance_technician',
  'operations_manager',
] as const

describe('default occupation titles', () => {
  test.each([
    ['en', en.iam.occupations as Record<string, string>],
    ['ru', ru.iam.occupations as Record<string, string>],
  ] as const)('every default occupation has a %s title', (_, titles) => {
    expect(DEFAULT_OCCUPATIONS.filter((key) => !titles[key])).toEqual([])
  })
})
