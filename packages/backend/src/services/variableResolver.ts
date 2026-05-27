const VAR_PATTERN = /\{\{\s*\$vars\.([A-Z0-9_]+)\s*\}\}/g
const INPUT_PATTERN = /\{\{\s*\$input\.([a-zA-Z0-9_.]+)\s*\}\}/g

/**
 * Walks a nested object and returns the value at a dot-separated path.
 * Returns `undefined` if any segment is missing or the value is not an object.
 */
function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc !== null && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

/**
 * Recursively walks a node data object and replaces:
 * - `{{ $vars.KEY }}` with values from the workspace variables map
 * - `{{ $input.key }}` (dot-notation supported) with values from the upstream node output
 *
 * @param data - The node data object (typically node.data from WorkflowNode).
 * @param vars - Decrypted workspace variables keyed by variable name.
 * @param inputData - Output of the immediately upstream node, available as `$input`.
 * @returns A deep copy of `data` with all placeholders substituted.
 * @throws If a referenced `$vars` key is not present in `vars`.
 */
export function resolveVariables(
  data: Record<string, unknown>,
  vars: Record<string, string>,
  inputData: Record<string, unknown> = {}
): Record<string, unknown> {
  return resolveValue(data, vars, inputData) as Record<string, unknown>
}

function resolveValue(
  value: unknown,
  vars: Record<string, string>,
  inputData: Record<string, unknown>
): unknown {
  if (typeof value === 'string') {
    let result = value.replace(VAR_PATTERN, (_, key: string) => {
      if (!(key in vars)) {
        throw new Error(
          `Variable '$vars.${key}' is not defined in workspace variables`
        )
      }
      return vars[key]
    })

    result = result.replace(INPUT_PATTERN, (_, path: string) => {
      const resolved = getByPath(inputData, path)
      if (resolved === undefined) {
        throw new Error(
          `Input field '$input.${path}' is not present in the upstream node output`
        )
      }
      return String(resolved)
    })

    return result
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveValue(item, vars, inputData))
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      result[k] = resolveValue(v, vars, inputData)
    }
    return result
  }

  return value
}
