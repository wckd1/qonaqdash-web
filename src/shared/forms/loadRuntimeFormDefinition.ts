import api from '@/shared/api/client'
import type { FormNode } from '@/shared/types/forms'
import {
  getCachedFormDefinition,
  setCachedFormDefinition,
  type FormDomainId,
  type RuntimeFormMode,
} from '@/shared/forms/formDefinitionCache'

export interface LoadedRuntimeForm {
  definition: FormNode
  hash: string
  data: Record<string, unknown>
}

export interface LoadRuntimeFormOptions {
  force?: boolean
  /**
   * Always perform `GET …/form` (create flows). Uses `If-None-Match` when an etag/hash is known;
   * `304` keeps the cached definition; `200` replaces it when the backend definition changed.
   */
  revalidate?: boolean
  /** ETag for conditional GET when `definitionHash` is absent (last known hash from a prior load). */
  ifNoneMatch?: string | null
}

/** Strong ETag quoting per integration (`If-None-Match: "hash"`). */
function formatIfNoneMatch(hash: string): string {
  const t = hash.trim()
  if (!t) return ''
  return t.startsWith('"') ? t : `"${t}"`
}

function parseOkBody(
  d: Record<string, unknown>,
  fallbackHash: string,
): LoadedRuntimeForm {
  const h = String(d?.hash ?? fallbackHash ?? '').trim()
  const rawData = d.data
  const data: Record<string, unknown> =
    rawData && typeof rawData === 'object' && !Array.isArray(rawData)
      ? (rawData as Record<string, unknown>)
      : {}
  return {
    definition: d.definition as FormNode,
    hash: h,
    data,
  }
}

async function getRuntimeFormUnconditional(
  formId: FormDomainId,
  path: '/api/guests/form' | '/api/bookings/form',
  mode: RuntimeFormMode,
): Promise<LoadedRuntimeForm> {
  const res = await api.get(path, {
    params: { target: mode },
    validateStatus: (s: number) => s >= 200 && s < 300,
  })
  const d = res.data && typeof res.data === 'object' ? (res.data as Record<string, unknown>) : {}
  const out = parseOkBody(d, '')
  if (out.hash) {
    setCachedFormDefinition(formId, mode, out.hash, out)
  }
  return out
}

/**
 * Loads `GET …/form?target=` with hash-keyed cache (`docs/forms-caching.md`).
 * Sends `If-None-Match` when a definition hash/etag is known so the backend can respond `304`.
 */
export async function loadRuntimeFormDefinition(
  formId: FormDomainId,
  path: '/api/guests/form' | '/api/bookings/form',
  mode: RuntimeFormMode,
  definitionHash: string | null | undefined,
  options: LoadRuntimeFormOptions = {},
): Promise<LoadedRuntimeForm> {
  const defHash = definitionHash?.trim() ?? ''
  const revalidate = options.revalidate ?? false
  const storedEtag = options.ifNoneMatch?.trim() ?? ''
  const etagForRequest = defHash || storedEtag

  if (!options.force && !revalidate && defHash) {
    const cached = getCachedFormDefinition(formId, mode, defHash)
    if (cached) {
      return {
        definition: cached.definition,
        hash: cached.hash,
        data: {},
      }
    }
  }

  if (options.force) {
    return getRuntimeFormUnconditional(formId, path, mode)
  }

  const lookupKey = etagForRequest.trim()
  const hasLocalCopy =
    lookupKey.length > 0 &&
    getCachedFormDefinition(formId, mode, lookupKey) != null

  const headers: Record<string, string> = {}
  if (hasLocalCopy) {
    headers['If-None-Match'] = formatIfNoneMatch(lookupKey)
  }

  const res = await api.get(path, {
    params: { target: mode },
    headers,
    validateStatus: (s: number) => s === 304 || (s >= 200 && s < 300),
  })

  if (res.status === 304) {
    const cached = lookupKey ? getCachedFormDefinition(formId, mode, lookupKey) : null
    if (cached) {
      return {
        definition: cached.definition,
        hash: cached.hash,
        data: {},
      }
    }
    return getRuntimeFormUnconditional(formId, path, mode)
  }

  const d = res.data && typeof res.data === 'object' ? (res.data as Record<string, unknown>) : {}
  const out = parseOkBody(d, defHash)
  if (out.hash) {
    setCachedFormDefinition(formId, mode, out.hash, out)
  }
  return out
}
