/**
 * Ghost domain hint for email inputs.
 * Shows a muted `@domain.com` suffix positioned right after the typed text,
 * visible only while the field is focused and the value has no `@`.
 */

const GHOST_DOMAIN = '@domain.com'

let measureCanvas: HTMLCanvasElement | null = null

function getCanvasContext(): CanvasRenderingContext2D | null {
  if (!measureCanvas) measureCanvas = document.createElement('canvas')
  return measureCanvas.getContext('2d')
}

function getInputFont(el: HTMLInputElement): string {
  const s = getComputedStyle(el)
  return `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`
}

export interface EmailGhostHint {
  suffix: string
  offsetPx: number
}

/**
 * Compute ghost hint state for an email input.
 * Returns `null` when the ghost should not be shown.
 */
export function computeEmailGhost(value: string, inputEl: HTMLInputElement): EmailGhostHint | null {
  if (!value || value.includes('@')) return null

  const ctx = getCanvasContext()
  if (!ctx) return null

  ctx.font = getInputFont(inputEl)
  const textWidth = ctx.measureText(value).width
  const paddingLeft = parseFloat(getComputedStyle(inputEl).paddingLeft) || 0
  const borderLeft = parseFloat(getComputedStyle(inputEl).borderLeftWidth) || 0

  return {
    suffix: GHOST_DOMAIN,
    offsetPx: paddingLeft + borderLeft + textWidth,
  }
}
