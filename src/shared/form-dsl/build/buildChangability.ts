/**
 * Build-mode (WYSIWYG) changability for FormBuild (which nodes can be mutated).
 */

import type { FormNode } from '@/shared/types/forms'

export function isBuildChangable(node: FormNode | undefined): boolean {
  if (!node || typeof node !== 'object') return true
  if (node.options?.locked) return false
  if ('items' in node && Array.isArray(node.items)) {
    return node.items.every((c) => isBuildChangable(c as FormNode))
  }
  return true
}

export function isGuestImmutableBuildGroup(node: FormNode | undefined): boolean {
  return node?.type === 'group' && (node as { id?: string }).id === 'guest'
}

export function canMutateBuildNode(
  variant: string,
  node: FormNode,
  guestSubtreeLocked: boolean,
): boolean {
  if (guestSubtreeLocked) return false
  if (variant === 'booking' && isGuestImmutableBuildGroup(node)) return false
  return isBuildChangable(node)
}
