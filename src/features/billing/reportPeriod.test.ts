import { describe, expect, test } from 'vitest'
import {
  isValidReportDays,
  presetDays,
  reportApiPeriod,
  reportDayCount,
  shiftReportDays,
} from '@/features/billing/reportPeriod'

const TODAY = '2026-03-15'

describe('presetDays', () => {
  test.each([
    ['this_month', { from: '2026-03-01', to: '2026-03-31' }],
    ['last_month', { from: '2026-02-01', to: '2026-02-28' }],
    ['last_7', { from: '2026-03-09', to: '2026-03-15' }],
    ['last_30', { from: '2026-02-14', to: '2026-03-15' }],
    ['last_90', { from: '2025-12-16', to: '2026-03-15' }],
    ['custom', { from: '2026-03-15', to: '2026-03-15' }],
  ] as const)('%s ends on its last day', (preset, days) => {
    expect(presetDays(preset, TODAY)).toEqual(days)
  })

  test('the month presets cross the year', () => {
    expect(presetDays('this_month', '2026-12-31')).toEqual({ from: '2026-12-01', to: '2026-12-31' })
    expect(presetDays('last_month', '2026-01-10')).toEqual({ from: '2025-12-01', to: '2025-12-31' })
  })
})

describe('reportApiPeriod', () => {
  // F7: the toolbar shows both days, the API does not include `to`.
  test('asks the API for the day after the last day shown', () => {
    expect(reportApiPeriod({ from: '2026-03-01', to: '2026-03-31' })).toEqual({
      from: '2026-03-01',
      to: '2026-04-01',
    })
    expect(reportApiPeriod({ from: '2026-03-15', to: '2026-03-15' })).toEqual({
      from: '2026-03-15',
      to: '2026-03-16',
    })
  })
})

describe('periods of the toolbar', () => {
  test('a single day is a valid period, a reversed or broken one is not', () => {
    expect(isValidReportDays({ from: '2026-03-15', to: '2026-03-15' })).toBe(true)
    expect(isValidReportDays({ from: '2026-03-16', to: '2026-03-15' })).toBe(false)
    expect(isValidReportDays({ from: '', to: '2026-03-15' })).toBe(false)
  })

  test('counts and shifts days with both ends included', () => {
    expect(reportDayCount({ from: '2026-03-09', to: '2026-03-15' })).toBe(7)
    expect(shiftReportDays({ from: '2026-03-09', to: '2026-03-15' }, 7, -1)).toEqual({
      from: '2026-03-02',
      to: '2026-03-08',
    })
    expect(shiftReportDays({ from: '2026-03-09', to: '2026-03-15' }, 7, 1)).toEqual({
      from: '2026-03-16',
      to: '2026-03-22',
    })
  })
})
