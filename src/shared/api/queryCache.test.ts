import { afterEach, describe, expect, test } from 'vitest'
import { nextTick } from 'vue'
import { useQuery } from '@pinia/colada'
import { clearServerState } from '@/shared/api/queryCache'
import { setupColada, type ColadaTestContext } from '@/test-utils/colada'

let ctx: ColadaTestContext

afterEach(() => ctx?.stop())

describe('clearServerState', () => {
  test('removes entries that nothing uses', () => {
    ctx = setupColada()
    ctx.queryCache.setQueryData(['guests', 'list', {}], [{ id: 'g1' }])

    clearServerState(ctx.queryCache)

    expect(ctx.queryCache.getEntries()).toHaveLength(0)
  })

  test('empties entries that a mounted consumer still uses', async () => {
    ctx = setupColada()
    let calls = 0
    const query = ctx.run(() =>
      useQuery({
        key: ['bookings', 'list', {}],
        query: async () => [{ id: `b${++calls}` }],
      }),
    )
    await query.refresh()
    expect(query.data.value).toEqual([{ id: 'b1' }])

    clearServerState(ctx.queryCache)
    await nextTick()

    expect(query.data.value).toBeUndefined()
    expect(query.status.value).toBe('pending')
    // Stale, so the next use fetches the data of the new session.
    await query.refresh()
    expect(query.data.value).toEqual([{ id: 'b2' }])
  })
})
