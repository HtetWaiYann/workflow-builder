import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from '@/lib/api'

function mockFetch(status: number, body: unknown) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

const fakeWorkflowSummary = {
  id: 'wf-1',
  workspaceId: 'ws-1',
  name: 'Newsletter',
  status: 'ACTIVE' as const,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

const fakeWorkflow = { ...fakeWorkflowSummary, nodes: [], edges: [] }

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('api.workflows.list', () => {
  it('gets /workflows and returns the list', async () => {
    mockFetch(200, { workflows: [fakeWorkflowSummary] })
    const result = await api.workflows.list()
    expect(result.workflows).toHaveLength(1)
    expect(result.workflows[0].name).toBe('Newsletter')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/workflows'),
      expect.objectContaining({ credentials: 'include' })
    )
  })
})

describe('api.workflows.get', () => {
  it('gets /workflows/:id and returns the full workflow', async () => {
    mockFetch(200, { workflow: fakeWorkflow })
    const result = await api.workflows.get('wf-1')
    expect(result.workflow.id).toBe('wf-1')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/workflows/wf-1'),
      expect.objectContaining({ credentials: 'include' })
    )
  })
})

describe('api.workflows.create', () => {
  it('posts to /workflows and returns the created workflow', async () => {
    mockFetch(201, { workflow: fakeWorkflow })
    const result = await api.workflows.create({ name: 'Newsletter' })
    expect(result.workflow.name).toBe('Newsletter')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/workflows'),
      expect.objectContaining({ method: 'POST' })
    )
  })
})

describe('api.workflows.rename', () => {
  it('patches /workflows/:id and returns the updated summary', async () => {
    mockFetch(200, { workflow: { ...fakeWorkflowSummary, name: 'Renamed' } })
    const result = await api.workflows.rename('wf-1', { name: 'Renamed' })
    expect(result.workflow.name).toBe('Renamed')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/workflows/wf-1'),
      expect.objectContaining({ method: 'PATCH' })
    )
  })
})

describe('api.workflows.delete', () => {
  it('sends DELETE to /workflows/:id and resolves without a body', async () => {
    mockFetch(204, null)
    await expect(api.workflows.delete('wf-1')).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/workflows/wf-1'),
      expect.objectContaining({ method: 'DELETE' })
    )
  })
})

describe('api.workflows.activate', () => {
  it('posts to /workflows/:id/activate and returns ACTIVE status', async () => {
    mockFetch(200, { workflow: { ...fakeWorkflowSummary, status: 'ACTIVE' } })
    const result = await api.workflows.activate('wf-1')
    expect(result.workflow.status).toBe('ACTIVE')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/workflows/wf-1/activate'),
      expect.objectContaining({ method: 'POST' })
    )
  })
})

describe('api.workflows.deactivate', () => {
  it('posts to /workflows/:id/deactivate and returns INACTIVE status', async () => {
    mockFetch(200, { workflow: { ...fakeWorkflowSummary, status: 'INACTIVE' } })
    const result = await api.workflows.deactivate('wf-1')
    expect(result.workflow.status).toBe('INACTIVE')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/workflows/wf-1/deactivate'),
      expect.objectContaining({ method: 'POST' })
    )
  })
})

describe('api.workflows.duplicate', () => {
  it('posts to /workflows/:id/duplicate and returns the copy', async () => {
    mockFetch(201, {
      workflow: { ...fakeWorkflow, id: 'wf-copy', name: 'Newsletter (copy)' },
    })
    const result = await api.workflows.duplicate('wf-1')
    expect(result.workflow.id).toBe('wf-copy')
    expect(result.workflow.name).toBe('Newsletter (copy)')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/workflows/wf-1/duplicate'),
      expect.objectContaining({ method: 'POST' })
    )
  })
})
