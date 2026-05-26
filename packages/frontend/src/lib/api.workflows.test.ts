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

// Fetches the workflow list for the authenticated workspace.
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

// Fetches a single workflow by id including its full nodes and edges.
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

// Creates a new DRAFT workflow with the given name and returns the full workflow object.
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

// Renames a workflow and returns the updated workflow summary.
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

// Deletes a workflow by id; resolves to undefined on 204 No Content.
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

// Activates a workflow so it can receive trigger events.
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

// Deactivates a workflow, stopping it from accepting new trigger events.
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

// Duplicates a workflow as a new DRAFT with "(copy)" appended to its name.
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

// Saves the canvas graph by PUTting the full nodes and edges arrays to the backend.
describe('api.workflows.saveCanvas', () => {
  it('PUTs nodes and edges to /workflows/:id/graph', async () => {
    mockFetch(200, { workflow: fakeWorkflow })
    const node = {
      id: 'n1',
      type: 'manual-trigger',
      position: { x: 0, y: 0 },
      data: {},
    }
    const result = await api.workflows.saveCanvas('wf-1', [node] as never, [])
    expect(result.workflow.id).toBe('wf-1')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/workflows/wf-1/graph'),
      expect.objectContaining({ method: 'PUT' })
    )
  })
})

// Updates only the workflow's display name via a dedicated PATCH endpoint used by the
// canvas toolbar for optimistic name edits.
describe('api.workflows.updateWorkflowName', () => {
  it('PATCHes to /workflows/:id/name and returns { data: { id, name } }', async () => {
    mockFetch(200, { data: { id: 'wf-1', name: 'Renamed' } })
    const result = await api.workflows.updateWorkflowName('wf-1', 'Renamed')
    expect(result.data).toEqual({ id: 'wf-1', name: 'Renamed' })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/workflows/wf-1/name'),
      expect.objectContaining({ method: 'PATCH' })
    )
  })
})
