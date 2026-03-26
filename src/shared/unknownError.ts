/** `response.data` object when present. */
export function httpErrorData(err: unknown):
  | {
      error?: unknown
      errors?: Record<string, unknown>
    }
  | undefined {
  const d = httpErrorResponse(err)?.data
  if (d && typeof d === 'object') return d as { error?: unknown; errors?: Record<string, unknown> }
  return undefined
}

/** Axios-style `error.response` when present. */
export function httpErrorResponse(
  err: unknown,
): { status?: number; data?: { error?: unknown } } | undefined {
  if (typeof err !== 'object' || err === null) return undefined
  return (err as { response?: { status?: number; data?: { error?: unknown } } }).response
}

/** @deprecated use httpErrorResponse */
export function errResponseData(err: unknown): { data?: { error?: unknown } } | undefined {
  return httpErrorResponse(err)
}

export function errMessage(err: unknown): string | undefined {
  if (typeof err !== 'object' || err === null) return undefined
  const m = (err as { message?: unknown }).message
  return typeof m === 'string' ? m : undefined
}
