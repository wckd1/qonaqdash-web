import { defineQueryOptions, useMutation, useQueryCache, type QueryCache } from '@pinia/colada'
import * as authApi from '@/features/auth/api'
import { useSettingsStore } from '@/shared/stores/useSettingsStore'

export const authKeys = {
  all: ['auth'] as const,
  /** `GET /api/account`: account, profile, settings and effective permissions. */
  account: ['auth', 'account'] as const,
  invite: (token: string) => ['auth', 'invite', token] as const,
}

/**
 * Account of the signed-in user. Every load also updates the session parts of
 * it in the settings store: the permission snapshot for route guards and the
 * UI locale.
 */
export const accountQuery = defineQueryOptions({
  key: authKeys.account,
  query: async ({ signal }) => {
    const data = await authApi.fetchAccount({ signal })
    useSettingsStore().applyAccount(data)
    return data
  },
})

/**
 * Loads the account now, ignoring cached data: after login, after a change of
 * the user's own permissions, or on a 403 that may mean stale permissions.
 * Works outside components (route guards, the API client). Rejects on error.
 */
export function refreshAccount(queryCache: QueryCache = useQueryCache()) {
  return queryCache.fetch(queryCache.ensure(accountQuery))
}

export const inviteQuery = defineQueryOptions((token: string) => ({
  key: authKeys.invite(token),
  query: ({ signal }) => authApi.fetchInvite(token, { signal }),
}))

export function useUpdateAccountMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (body: authApi.UpdateAccountRequest) => authApi.updateAccount(body),
    // Reload so the locale and the sidebar name follow the saved account.
    onSuccess: () =>
      refreshAccount(queryCache).then(
        () => undefined,
        () => undefined,
      ),
  })
}
