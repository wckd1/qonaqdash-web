import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { setupColada, type ColadaTestContext } from '@/test-utils/colada'

vi.mock('@/features/auth/api', () => ({
  fetchAccount: vi.fn(async () => ({
    account: { email: 'owner@example.test' },
    settings: { locale: 'ru' },
    permissions: { bookings: { view: 2 } },
  })),
}))

const { refreshAccount } = await import('@/features/auth/queries')
const { useSettingsStore } = await import('@/shared/stores/useSettingsStore')

let ctx: ColadaTestContext

beforeEach(() => localStorage.clear())
afterEach(() => ctx?.stop())

describe('refreshAccount', () => {
  test('caches the account and updates the session permissions and locale', async () => {
    ctx = setupColada()
    const settings = useSettingsStore()
    expect(settings.permissionsLoaded).toBe(false)

    const state = await refreshAccount(ctx.queryCache)

    expect(state.data?.account?.email).toBe('owner@example.test')
    expect(ctx.queryCache.getQueryData(['auth', 'account'])).toEqual(state.data)
    expect(settings.permissionsLoaded).toBe(true)
    expect(settings.permissions).toEqual({ bookings: { view: 2 } })
    expect(JSON.parse(localStorage.getItem('qonaqdash.account.permissions') ?? 'null')).toEqual({
      bookings: { view: 2 },
    })
    expect(settings.locale).toBe('ru')
  })
})
