/** Structural type matching any Zod v4 schema's safeParse API. */
type ZodLike = {
  safeParse(data: unknown):
    | { success: true }
    | {
        success: false
        error: {
          issues: ReadonlyArray<{
            // Zod v4 path segments include symbol in the PropertyKey union
            path: ReadonlyArray<PropertyKey>
            message: string
          }>
        }
      }
}

/**
 * Runs safeParse on the given Zod schema and returns a flat map of dotted
 * field paths to their first error message. Returns {} when config is valid.
 *
 * @param schema - Any Zod schema that exposes safeParse.
 * @param config - The raw config object to validate.
 */
export function getConfigErrors(
  schema: ZodLike,
  config: Record<string, unknown>
): Record<string, string> {
  const result = schema.safeParse(config)
  if (result.success) return {}
  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const key = issue.path.map(String).join('.')
    if (!errors[key]) errors[key] = friendlyMessage(issue.message)
  }
  return errors
}

/** Returns true if `s` is a syntactically valid absolute URL. */
export function isValidUrl(s: string): boolean {
  try {
    new URL(s)
    return true
  } catch {
    return false
  }
}

/** Returns true if `s` is empty or valid JSON. */
export function isValidJson(s: string): boolean {
  if (!s.trim()) return true
  try {
    JSON.parse(s)
    return true
  } catch {
    return false
  }
}

/** Returns true if `s` looks like a 5–7 part cron expression. */
export function isValidCron(s: string): boolean {
  const parts = s.trim().split(/\s+/)
  return parts.length >= 5 && parts.length <= 7
}

/** Returns true if `s` is a plausible email address (RFC 5322 simplified). */
export function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

function friendlyMessage(msg: string): string {
  if (msg.includes('at least 1 character')) return 'Required'
  if (msg.includes('greater than 0') || msg.includes('positive'))
    return 'Must be a positive number'
  if (msg.includes('Expected number') || msg.includes('NaN'))
    return 'Must be a number'
  return msg
}
