import { defineQueryOptions, useMutation, useQueryCache } from '@pinia/colada'
import { invalidateKeys } from '@/shared/api/queryCache'
import { snapshotForm, type FormTemplate } from '@/shared/forms/formSnapshot'
import type { FormNode } from '@/shared/types/forms'
import * as guestsApi from '@/features/guests/api'

/** Search text as it goes into a key: trimmed, so `' a'` and `'a'` share an entry. */
function searchParam(q: string | undefined): { q: string } {
  return { q: q?.trim() ?? '' }
}

/** Runtime form as cached by a query: definition, template data and its hash. */
export type RuntimeFormSnapshot = FormTemplate & { hash: string }

export const guestKeys = {
  all: ['guests'] as const,
  lists: ['guests', 'list'] as const,
  list: (q?: string) => ['guests', 'list', searchParam(q)] as const,
  detail: (id: string) => ['guests', 'detail', id] as const,
  bookings: (id: string) => ['guests', 'bookings', id] as const,
  /** Runtime forms and the builder definition. */
  forms: ['guests', 'form'] as const,
  runtimeForm: (target: 'edit' | 'view', hash: string) =>
    ['guests', 'form', 'runtime', target, hash] as const,
  formDefinition: ['guests', 'form', 'definition'] as const,
}

/** Guests; without `q` the full list. Also the guest search of the booking form. */
export const guestListQuery = defineQueryOptions((q?: string) => ({
  key: guestKeys.list(q),
  query: ({ signal }) => guestsApi.fetchGuests(searchParam(q), { signal }),
}))

/** `GET /api/guests/:id`: the guest data and the `_form` reference. */
export const guestDetailQuery = defineQueryOptions((id: string) => ({
  key: guestKeys.detail(id),
  query: ({ signal }) => guestsApi.fetchGuest(id, { signal }),
}))

export const guestBookingsQuery = defineQueryOptions((id: string) => ({
  key: guestKeys.bookings(id),
  query: ({ signal }) => guestsApi.fetchGuestBookings(id, { signal }),
}))

/**
 * Runtime guest form for a definition hash (from `_form.hash` of a guest).
 * The loader keeps its own hash cache, so an entry fetches over the network at
 * most once per hash.
 */
export const guestRuntimeFormQuery = defineQueryOptions(
  ({ target, hash }: { target: 'edit' | 'view'; hash: string }) => ({
    key: guestKeys.runtimeForm(target, hash),
    query: async (): Promise<RuntimeFormSnapshot> => {
      const res = await guestsApi.fetchGuestForm({ target, definitionHash: hash || null })
      return { ...snapshotForm(res), hash: res.hash ?? '' }
    },
  }),
)

/**
 * Edit form for a new guest. Every open revalidates it with `If-None-Match`
 * and the last known hash: `304` keeps the cached definition, `200` brings
 * the changed one.
 */
export const guestCreateFormQuery = defineQueryOptions({
  key: guestKeys.runtimeForm('edit', ''),
  staleTime: 0,
  query: async ({ entry }): Promise<RuntimeFormSnapshot> => {
    const previous = entry.state.value.data as RuntimeFormSnapshot | undefined
    const res = await guestsApi.fetchGuestForm({
      target: 'edit',
      revalidate: true,
      ifNoneMatch: previous?.hash || null,
    })
    return { ...snapshotForm(res), hash: res.hash?.trim() || previous?.hash || '' }
  },
})

/** Persisted definition for the form builder. */
export const guestFormDefinitionQuery = defineQueryOptions({
  key: guestKeys.formDefinition,
  query: ({ signal }) => guestsApi.fetchGuestFormDefinition({ signal }),
})

export function useCreateGuestMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (data: Record<string, unknown>) => guestsApi.createGuest(data),
    onSuccess: () => invalidateKeys(queryCache, [guestKeys.lists]),
  })
}

export function useUpdateGuestMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (vars: { id: string; data: Record<string, unknown> }) =>
      guestsApi.updateGuest(vars.id, vars.data),
    onSuccess: (payload, vars) => {
      queryCache.setQueryData(guestKeys.detail(vars.id), payload)
      // Bookings show the guest name.
      return invalidateKeys(queryCache, [guestKeys.lists, ['bookings']])
    },
  })
}

export function useBlockGuestMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (id: string) => guestsApi.blockGuest(id),
    onSuccess: (_data, id) => invalidateKeys(queryCache, [guestKeys.lists, guestKeys.detail(id)]),
  })
}

export function useUpdateGuestFormDefinitionMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (definition: FormNode) => guestsApi.updateGuestFormDefinition({ definition }),
    onSuccess: () => {
      guestsApi.invalidateGuestRuntimeFormCache()
      // Guests carry the hash of their form definition in `_form`.
      return invalidateKeys(queryCache, [guestKeys.all])
    },
  })
}
