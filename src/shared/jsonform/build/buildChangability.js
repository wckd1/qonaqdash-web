/**
 * Build-mode (WYSIWYG) changability per docs/custom-jsonform-renderer.md §4.1, §4.5.
 */

/**
 * @param {object | undefined} element - UISchema element
 * @returns {boolean}
 */
export function isBuildChangable(element) {
  if (!element || typeof element !== 'object') return true
  if (element.type === 'Control') {
    return !element.options?.unchangeable
  }
  const kids = element.elements
  if (Array.isArray(kids)) {
    return kids.every((c) => isBuildChangable(c))
  }
  return true
}

/**
 * Booking form editor: guest group structure is read-only.
 * @param {object | undefined} uischema
 * @returns {boolean}
 */
export function isGuestImmutableBuildGroup(uischema) {
  return uischema?.type === 'Group' && uischema?.id === 'guest'
}

/**
 * @param {'guest'|'booking'} variant
 * @param {object} uischema
 * @param {boolean} guestSubtreeLocked - true when already under guest group (booking)
 * @returns {boolean}
 */
export function canMutateBuildNode(variant, uischema, guestSubtreeLocked) {
  if (guestSubtreeLocked) return false
  if (variant === 'booking' && isGuestImmutableBuildGroup(uischema)) return false
  return isBuildChangable(uischema)
}
