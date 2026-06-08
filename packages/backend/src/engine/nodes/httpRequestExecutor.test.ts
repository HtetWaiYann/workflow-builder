import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HttpRequestExecutor } from './httpRequestExecutor'
import type { ExecutionContext } from '@triggr/shared'

vi.mock('../../lib/logger', () => ({
  logger: { warn: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() },
}))

vi.mock('../../lib/ssrfGuard', () => ({
  assertSafeUrl: vi.fn().mockResolvedValue(undefined),
}))

const ctx: ExecutionContext = {
  executionId: 'exec-1',
  workflowId: 'wf-1',
  nodeOutputs: {},
}

const executor = new HttpRequestExecutor()

function makeResponse(opts: {
  ok?: boolean
  status?: number
  statusText?: string
  contentType?: string
  body?: unknown
}): Response {
  const {
    ok = true,
    status = 200,
    statusText = 'OK',
    contentType = 'application/json',
    body = {},
  } = opts

  const headers = new Headers({ 'content-type': contentType })
  return {
    ok,
    status,
    statusText,
    headers,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(String(body)),
  } as unknown as Response
}

function cfg(url: string, method: string, headers = '{}', body = '{}') {
  return { config: { url, method, headers, body } }
}

// Makes an outbound HTTP request with the configured method, headers, and body.
// Returns status, response headers, and the parsed response body merged onto inputData.
describe('HttpRequestExecutor', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(makeResponse({}))
  })

  it('has type "http-request"', () => {
    expect(executor.type).toBe('http-request')
  })

  it('calls fetch with the configured URL and method', async () => {
    await executor.execute(cfg('https://api.example.com/data', 'GET'), {}, ctx)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.example.com/data',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('returns status, headers, and body merged with inputData', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      makeResponse({ status: 200, body: { result: 'ok' } })
    )
    const out = await executor.execute(
      cfg('https://api.example.com', 'GET'),
      { seed: 1 },
      ctx
    )
    expect(out['status']).toBe(200)
    expect(out['body']).toEqual({ result: 'ok' })
    expect(out['seed']).toBe(1)
  })

  it('parses JSON response when content-type is application/json', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      makeResponse({ contentType: 'application/json', body: { parsed: true } })
    )
    const out = await executor.execute(
      cfg('https://api.example.com', 'GET'),
      {},
      ctx
    )
    expect(out['body']).toEqual({ parsed: true })
  })

  it('returns text body when content-type is not JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      makeResponse({ contentType: 'text/plain', body: 'plain text response' })
    )
    const out = await executor.execute(
      cfg('https://api.example.com', 'GET'),
      {},
      ctx
    )
    expect(out['body']).toBe('plain text response')
  })

  it('attaches a JSON body and Content-Type header for POST requests', async () => {
    await executor.execute(
      cfg('https://api.example.com', 'POST', '{}', '{"name":"alice"}'),
      {},
      ctx
    )
    const call = vi.mocked(globalThis.fetch).mock.calls[0]
    const init = call?.[1] as RequestInit
    expect(init.body).toBe('{"name":"alice"}')
    expect((init.headers as Record<string, string>)['Content-Type']).toBe(
      'application/json'
    )
  })

  it('does not attach a body for GET requests', async () => {
    await executor.execute(cfg('https://api.example.com', 'GET'), {}, ctx)
    const call = vi.mocked(globalThis.fetch).mock.calls[0]
    const init = call?.[1] as RequestInit
    expect(init.body).toBeUndefined()
  })

  it('throws when the response status is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      makeResponse({ ok: false, status: 404, statusText: 'Not Found' })
    )
    await expect(
      executor.execute(cfg('https://api.example.com', 'GET'), {}, ctx)
    ).rejects.toThrow('HTTP 404 Not Found')
  })

  it('throws when headers JSON is invalid', async () => {
    await expect(
      executor.execute(
        cfg('https://api.example.com', 'GET', 'not-json'),
        {},
        ctx
      )
    ).rejects.toThrow('Invalid JSON in headers field')
  })

  it('throws when body JSON is invalid for POST', async () => {
    await expect(
      executor.execute(
        cfg('https://api.example.com', 'POST', '{}', 'not-json'),
        {},
        ctx
      )
    ).rejects.toThrow('Invalid JSON in body field')
  })

  it('throws on invalid config (missing url)', async () => {
    await expect(
      executor.execute({ config: { method: 'GET' } }, {}, ctx)
    ).rejects.toThrow('Invalid http-request config')
  })
})
