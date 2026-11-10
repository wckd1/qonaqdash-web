import { onScopeDispose, ref, watch, type Ref } from 'vue'

/**
 * Follows `source` with a delay: the returned ref takes the latest value once
 * `source` has not changed for `delayMs`. Used for search queries that go into
 * a query key, so typing does not start a request per keystroke.
 */
export function useDebouncedRef<T>(source: Ref<T>, delayMs: number): Readonly<Ref<T>> {
  const debounced = ref(source.value) as Ref<T>
  let timer: ReturnType<typeof setTimeout> | null = null
  watch(source, (value) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      debounced.value = value
    }, delayMs)
  })
  onScopeDispose(() => {
    if (timer) clearTimeout(timer)
  })
  return debounced
}
