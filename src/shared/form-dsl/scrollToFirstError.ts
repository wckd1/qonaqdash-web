import { nextTick } from 'vue'

/**
 * After validation errors are rendered, scroll the first `.form-field-error`
 * into the visible area. Must be called after setting errorsMap so Vue can
 * render the error elements on the next tick.
 */
export async function scrollToFirstFormError(container?: Element | null): Promise<void> {
  await nextTick()
  const root = container ?? document
  const el = root.querySelector('.form-field-error')
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
