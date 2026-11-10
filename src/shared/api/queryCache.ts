import {
  useQueryCache,
  type EntryKey,
  type PiniaColadaOptions,
  type QueryCache,
} from '@pinia/colada'

/**
 * Pinia Colada setup shared by the app and unit tests.
 *
 * Screens load their data when they mount. Refetching on window focus or on
 * reconnect is off: a background refetch could replace data under a form that
 * is being edited, and the screens did not refetch on focus before either.
 */
export const piniaColadaOptions: PiniaColadaOptions = {
  queryOptions: {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },
}

/**
 * Drops all server data of the current session, e.g. on logout.
 *
 * Entries that a mounted component still uses cannot be removed, so they are
 * reset to `pending` without data and marked stale: they fetch again on the
 * next use instead of showing the previous user's data.
 */
export function clearServerState(queryCache: QueryCache = useQueryCache()): void {
  queryCache.cancelQueries()
  for (const entry of queryCache.getEntries()) {
    if (entry.active) {
      entry.placeholderData = null
      queryCache.setEntryState(entry, { status: 'pending', data: undefined, error: null })
      entry.when = 0
    } else {
      queryCache.remove(entry)
    }
  }
}

/**
 * Marks every entry under the given keys stale and waits until the entries in
 * use have fetched again, so a mutation resolves with fresh data on screen.
 * A failed refetch stays in that query's `error`; it does not fail the mutation.
 */
export async function invalidateKeys(queryCache: QueryCache, keys: EntryKey[]): Promise<void> {
  await Promise.all(keys.map((key) => queryCache.invalidateQueries({ key }).catch(() => undefined)))
}
