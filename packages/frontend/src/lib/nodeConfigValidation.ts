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
  const m = msg.toLowerCase()
  // Zod v4: "Too small: expected number to be >0"
  // Zod v4: "Too small: expected string to have >=1 characters"
  if (m.startsWith('too small')) {
    if (m.includes('number')) return 'Enter a number greater than 0'
    return 'This field is required'
  }
  // Zod v4: "Too big: ..."
  if (m.startsWith('too big')) return 'Value exceeds the maximum allowed length'
  // Zod v4: "Invalid input: expected int, received number"
  if (m.includes('expected int')) return 'Enter a whole number'
  // Zod v4: "Invalid input: expected number, received NaN"
  if (
    m.includes('expected number') ||
    m.includes('nan') ||
    m.includes('not a number')
  )
    return 'Enter a valid number'
  // Enum errors
  if (
    m.includes('invalid enum') ||
    m.includes('invalid option') ||
    m.includes('invalid_enum_value')
  )
    return 'Select a valid option'
  // Fallbacks for other message formats
  if (
    m.includes('at least 1 character') ||
    m === 'required' ||
    m.includes('string must contain at least')
  )
    return 'This field is required'
  if (m.includes('greater than 0') || m.includes('positive'))
    return 'Enter a number greater than 0'
  if (m.includes('integer')) return 'Enter a whole number'
  if (m.includes('invalid email') || m.includes('invalid_string'))
    return 'Enter a valid value'
  // Never leak raw Zod messages to the user
  return 'Invalid value'
}
