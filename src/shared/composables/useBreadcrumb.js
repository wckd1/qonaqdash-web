import { ref } from 'vue'

/**
 * Shared breadcrumb state for the layout. Routes or views set items via setItems().
 * Each item: `labelKey` (i18n path) or raw `label` for dynamic text; `path` null/absent = current page (not shown in trail).
 * @typedef {{ label?: string, labelKey?: string, path?: string | null }} BreadcrumbItem
 */
const items = ref([])

/**
 * @returns {{ items: import('vue').Ref<BreadcrumbItem[]>, setItems: (v: BreadcrumbItem[]) => void }}
 */
export function useBreadcrumb() {
  return {
    items,
    setItems(v) {
      items.value = Array.isArray(v) ? v : []
    },
  }
}
