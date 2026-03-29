/**
 * Build-mode (WYSIWYG) changability for FormBuild (which nodes can be mutated).
 */

import type { FormArrayNode, FormGroupNode, FormNode, FormStackNode } from '@/shared/types/forms'

export function isBuildChangable(node: FormNode | undefined): boolean {
  if (!node || typeof node !== 'object') return true
  if (node.options?.locked) return false
  if (node.type === 'stack' || node.type === 'group') {
    const ch = (node as FormStackNode | FormGroupNode).children ?? []
    return ch.every((c) => isBuildChangable(c))
  }
  if (node.type === 'array') {
    return isBuildChangable((node as FormArrayNode).child)
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
