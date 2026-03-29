import { type Ref, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * Syncs a local tab ref with the URL hash fragment (`#tab-id`).
 * Default tab produces no hash; non-default tabs show `#<id>`.
 * Handles page reload (reads hash on init) and external navigation
 * (e.g. router-link with `hash: '#folio'`).
 */
export function useHashTab<T extends string>(defaultTab: T, validTabs: readonly T[]): Ref<T> {
  const route = useRoute()
  const router = useRouter()

  function parseHash(hash: string): T {
    const raw = hash.startsWith('#') ? hash.slice(1) : hash
    return (validTabs as readonly string[]).includes(raw) ? (raw as T) : defaultTab
  }

  const activeTab = ref<T>(parseHash(route.hash)) as Ref<T>

  let replacing = false

  watch(activeTab, (tab) => {
    if (replacing) return
    const desiredHash = tab === defaultTab ? '' : `#${tab}`
    if (route.hash !== desiredHash) {
      replacing = true
      router.replace({ hash: desiredHash }).finally(() => {
        replacing = false
      })
    }
  })

  watch(
    () => route.hash,
    (newHash) => {
      if (replacing) return
      activeTab.value = parseHash(newHash)
    },
  )

  return activeTab
}
