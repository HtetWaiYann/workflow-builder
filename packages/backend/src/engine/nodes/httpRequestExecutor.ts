import type { NodeExecutor, ExecutionContext } from '@workflow-builder/shared'
import { HttpRequestConfigSchema } from '@workflow-builder/shared'
import { logger } from '../../lib/logger'

export class HttpRequestExecutor implements NodeExecutor {
  readonly type = 'http-request' as const

  async execute(
    nodeData: Record<string, unknown>,
    inputData: Record<string, unknown>,
    _context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const result = HttpRequestConfigSchema.safeParse(nodeData['config'])
    if (!result.success) {
      throw new Error(
        `Invalid http-request config: ${result.error.issues[0]?.message}`
      )
    }

    const { url, method, headers: headersStr, body: bodyStr } = result.data

    let headers: Record<string, string> = {}
    try {
      const parsed = JSON.parse(headersStr)
      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed)
      ) {
        headers = parsed as Record<string, string>
      }
    } catch {
      throw new Error(`Invalid JSON in headers field: ${headersStr}`)
    }

    const init: RequestInit = { method, headers }

    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      let body: unknown = {}
      try {
        body = JSON.parse(bodyStr)
      } catch {
        throw new Error(`Invalid JSON in body field: ${bodyStr}`)
      }
      init.body = JSON.stringify(body)
      headers['Content-Type'] = headers['Content-Type'] ?? 'application/json'
    }

    logger.debug({ url, method }, 'HTTP request node executing')

    const response = await fetch(url, init)

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} ${response.statusText} from ${url}`
      )
    }

    const contentType = response.headers.get('content-type') ?? ''
    const responseBody = contentType.includes('application/json')
      ? await response.json()
      : await response.text()

    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    return {
      ...inputData,
      status: response.status,
      headers: responseHeaders,
      body: responseBody,
    }
  }
}
