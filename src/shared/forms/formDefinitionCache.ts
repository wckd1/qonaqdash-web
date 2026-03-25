import type { FormRef } from '@/shared/types/forms'

export type FormDomainId = 'guest' | 'booking'

export type RuntimeFormMode = 'view' | 'edit'

export interface CachedFormDefinition {
  schema: unknown
  uischema: unknown
  hash: string
}

const STORAGE_PREFIX = 'qdd:form:'

/** `form:{formId}:{mode}:{hash}` — see `docs/forms-caching.md`. */
export function formDefinitionCacheKey(
  formId: FormDomainId,
  mode: RuntimeFormMode,
  hash: string,
): string {
  return `${STORAGE_PREFIX}${formId}:${mode}:${hash}`
}

const memory = new Map<string, CachedFormDefinition>()

export function getCachedFormDefinition(
  formId: FormDomainId,
  mode: RuntimeFormMode,
  hash: string,
): CachedFormDefinition | null {
  const h = hash.trim()
  if (!h) return null
  const key = formDefinitionCacheKey(formId, mode, h)
  const hot = memory.get(key)
  if (hot) return hot
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedFormDefinition
    if (parsed && typeof parsed.hash === 'string' && parsed.schema != null && parsed.uischema != null) {
      memory.set(key, parsed)
      return parsed
    }
  } catch {
    /* ignore */
  }
  return null
}

export function setCachedFormDefinition(
  formId: FormDomainId,
  mode: RuntimeFormMode,
  hash: string,
  def: { schema: unknown; uischema: unknown; hash?: string },
): CachedFormDefinition {
  const h = (def.hash ?? hash).trim()
  const entry: CachedFormDefinition = {
    schema: JSON.parse(JSON.stringify(def.schema ?? {})),
    uischema: JSON.parse(JSON.stringify(def.uischema ?? {})),
    hash: h,
  }
  const key = formDefinitionCacheKey(formId, mode, h)
  memory.set(key, entry)
  try {
    sessionStorage.setItem(key, JSON.stringify(entry))
  } catch {
    /* quota / private mode */
  }
  return entry
}

function storageKeysForFormId(formId: FormDomainId): string[] {
  const prefix = `${STORAGE_PREFIX}${formId}:`
  const keys: string[] = []
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)
      if (k?.startsWith(prefix)) keys.push(k)
    }
  } catch {
    /* ignore */
  }
  return keys
}

/** Drop all cached runtime definitions for guest or booking (e.g. after PUT …/form/schema). */
export function clearFormDefinitionsFor(formId: FormDomainId): void {
  for (const k of storageKeysForFormId(formId)) {
    try {
      sessionStorage.removeItem(k)
    } catch {
      /* ignore */
    }
  }
  const prefix = `${STORAGE_PREFIX}${formId}:`
  for (const k of [...memory.keys()]) {
    if (k.startsWith(prefix)) memory.delete(k)
  }
}

export function normalizeFormRef(raw: unknown): FormRef | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = o.id
  const hash = o.hash
  if (typeof id !== 'string' || typeof hash !== 'string' || !id.trim() || !hash.trim()) return null
  return { id: id.trim(), hash: hash.trim() }
}
