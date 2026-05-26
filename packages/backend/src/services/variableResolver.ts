const VAR_PATTERN = /\{\{\s*\$vars\.([A-Z0-9_]+)\s*\}\}/g

/**
 * Recursively walks a node data object and replaces all `{{ $vars.KEY }}`
 * placeholders with their resolved values from the workspace variables map.
 *
 * @param data - The node data object (typically node.data from WorkflowNode).
 * @param vars - Decrypted workspace variables keyed by variable name.
 * @returns A deep copy of `data` with all placeholders substituted.
 * @throws If a referenced variable key is not present in `vars`.
 */
export function resolveVariables(
  data: Record<string, unknown>,
  vars: Record<string, string>
): Record<string, unknown> {
  return resolveValue(data, vars) as Record<string, unknown>
}

function resolveValue(value: unknown, vars: Record<string, string>): unknown {
  if (typeof value === 'string') {
    return value.replace(VAR_PATTERN, (_, key: string) => {
      if (!(key in vars)) {
        throw new Error(
          `Variable '$vars.${key}' is not defined in workspace variables`
        )
      }
      return vars[key]
    })
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveValue(item, vars))
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      result[k] = resolveValue(v, vars)
    }
    return result
  }

  return value
}
