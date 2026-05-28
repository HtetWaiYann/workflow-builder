import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAdd = vi.fn().mockResolvedValue(undefined)
const mockGetRepeatableJobs = vi.fn().mockResolvedValue([])
const mockRemoveRepeatableByKey = vi.fn().mockResolvedValue(undefined)

vi.mock('../queues/cronQueue', () => ({
  getCronQueue: vi.fn(() => ({
    add: mockAdd,
    getRepeatableJobs: mockGetRepeatableJobs,
    removeRepeatableByKey: mockRemoveRepeatableByKey,
  })),
}))

vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

import { scheduleCronWorkflow, removeCronWorkflow } from './cronScheduler'

const cronNode = {
  id: 'n1',
  type: 'cron-trigger',
  position: { x: 0, y: 0 },
  data: { config: { schedule: '0 * * * *' } },
}

// Manages BullMQ repeatable jobs for workflows that have a cron-trigger node.
describe('scheduleCronWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetRepeatableJobs.mockResolvedValue([])
  })

  it('adds a repeatable job with the cron schedule and workflowId payload', async () => {
    await scheduleCronWorkflow('wf-1', [cronNode])

    expect(mockAdd).toHaveBeenCalledWith(
      'cron-workflow-wf-1',
      { workflowId: 'wf-1' },
      expect.objectContaining({
        repeat: { pattern: '0 * * * *' },
        jobId: 'cron-workflow-wf-1',
      })
    )
  })

  it('removes any existing job before scheduling a new one (idempotent)', async () => {
    mockGetRepeatableJobs.mockResolvedValue([
      { id: 'cron-workflow-wf-1', key: 'repeat:wf-1:0 * * * *' },
    ])

    await scheduleCronWorkflow('wf-1', [cronNode])

    expect(mockRemoveRepeatableByKey).toHaveBeenCalledWith(
      'repeat:wf-1:0 * * * *'
    )
    expect(mockAdd).toHaveBeenCalled()
  })

  it('is a no-op when no cron-trigger node is present', async () => {
    const nonCronNode = {
      id: 'n1',
      type: 'manual-trigger',
      position: { x: 0, y: 0 },
      data: {},
    }
    await scheduleCronWorkflow('wf-1', [nonCronNode])

    expect(mockAdd).not.toHaveBeenCalled()
  })

  it('is a no-op when the nodes array is empty', async () => {
    await scheduleCronWorkflow('wf-1', [])
    expect(mockAdd).not.toHaveBeenCalled()
  })

  it('is a no-op when the cron-trigger node has no valid schedule', async () => {
    const badNode = {
      id: 'n1',
      type: 'cron-trigger',
      position: { x: 0, y: 0 },
      data: { config: {} }, // missing schedule
    }
    await scheduleCronWorkflow('wf-1', [badNode])
    expect(mockAdd).not.toHaveBeenCalled()
  })

  it('accepts raw JSON (unparsed nodes) and still schedules the job', async () => {
    await scheduleCronWorkflow('wf-1', JSON.parse(JSON.stringify([cronNode])))
    expect(mockAdd).toHaveBeenCalled()
  })
})

// Removes the repeatable BullMQ job for a workflow. No-op when no matching job exists.
describe('removeCronWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetRepeatableJobs.mockResolvedValue([])
  })

  it('removes the job when a matching repeatable job exists by id', async () => {
    mockGetRepeatableJobs.mockResolvedValue([
      { id: 'cron-workflow-wf-1', key: 'repeat:wf-1:0 * * * *' },
    ])

    await removeCronWorkflow('wf-1')

    expect(mockRemoveRepeatableByKey).toHaveBeenCalledWith(
      'repeat:wf-1:0 * * * *'
    )
  })

  it('removes the job when matched by name (fallback from id)', async () => {
    mockGetRepeatableJobs.mockResolvedValue([
      { name: 'cron-workflow-wf-1', key: 'repeat:wf-1:0 * * * *' },
    ])

    await removeCronWorkflow('wf-1')

    expect(mockRemoveRepeatableByKey).toHaveBeenCalledWith(
      'repeat:wf-1:0 * * * *'
    )
  })

  it('is a no-op when no matching job exists', async () => {
    mockGetRepeatableJobs.mockResolvedValue([
      { id: 'cron-workflow-other', key: 'repeat:other' },
    ])

    await removeCronWorkflow('wf-1')

    expect(mockRemoveRepeatableByKey).not.toHaveBeenCalled()
  })

  it('is a no-op when the repeatable jobs list is empty', async () => {
    await removeCronWorkflow('wf-1')
    expect(mockRemoveRepeatableByKey).not.toHaveBeenCalled()
  })
})
