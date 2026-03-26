import type { FormNode } from '@/shared/types/forms'

/** Pinia-stored form definition + empty template data. Used by guest and booking stores. */
export interface FormTemplate {
  definition: FormNode
  data: Record<string, unknown>
}

/** Deep-clone a raw form response into a store-safe snapshot. */
export function snapshotForm(res: { definition?: unknown; data?: unknown }): FormTemplate {
  return {
    definition: JSON.parse(JSON.stringify(res.definition ?? {})),
    data: JSON.parse(JSON.stringify(res.data ?? {})),
  }
}
