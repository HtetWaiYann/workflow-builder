import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useExecutionStore } from '@/stores/executionStore'
import type { Execution, ExecutionSummary } from '@workflow-builder/shared'

vi.mock('@/lib/api', () => ({
  api: {
    executions: {
      trigger: vi.fn(),
      get: vi.fn(),
      list: vi.fn(),
    },
  },
}))

import { api } from '@/lib/api'

const mockTrigger = vi.mocked(api.executions.trigger)
const mockGet = vi.mocked(api.executions.get)
const mockList = vi.mocked(api.executions.list)

function makeExecSummary(
  id: string,
  status: ExecutionSummary['status'] = 'PENDING'
): ExecutionSummary {
  return {
    id,
    workflowId: 'wf-1',
    status,
    inputData: null,
    startedAt: null,
    finishedAt: null,
    createdAt: '2024-01-01T00:00:00.000Z',
  }
}

function makeExecution(
  id: string,
  status: Execution['status'] = 'SUCCESS'
): Execution {
  return {
    id,
    workflowId: 'wf-1',
    status,
    inputData: null,
    startedAt: '2024-01-01T00:00:00.000Z',
    finishedAt:
      status === 'SUCCESS' || status === 'ERROR'
        ? '2024-01-01T00:00:01.000Z'
        : null,
    createdAt: '2024-01-01T00:00:00.000Z',
    nodeRuns: [],
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  useExecutionStore.getState().reset()
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
})

// Manages execution state for the workflow canvas: triggering runs, polling for status,
// and controlling the run panel visibility.
describe('initial state', () => {
  it('starts with no execution, not triggering, and panel closed', () => {
    const s = useExecutionStore.getState()
    expect(s.currentExecution).toBeNull()
    expect(s.recentExecutions).toEqual([])
    expect(s.isTriggering).toBe(false)
    expect(s.showRunPanel).toBe(false)
  })
})

// Controls run panel visibility without triggering a new execution.
describe('openRunPanel / closeRunPanel', () => {
  it('openRunPanel sets showRunPanel to true', () => {
    useExecutionStore.getState().openRunPanel()
    expect(useExecutionStore.getState().showRunPanel).toBe(true)
  })

  it('closeRunPanel sets showRunPanel to false', () => {
    useExecutionStore.getState().openRunPanel()
    useExecutionStore.getState().closeRunPanel()
    expect(useExecutionStore.getState().showRunPanel).toBe(false)
  })
})

// Wipes execution state on canvas unmount so stale run data never leaks into the next session.
describe('reset', () => {
  it('clears all execution state', () => {
    useExecutionStore.setState({
      currentExecution: makeExecution('exec-1'),
      recentExecutions: [makeExecSummary('exec-1')],
      isTriggering: true,
      showRunPanel: true,
    })
    useExecutionStore.getState().reset()
    const s = useExecutionStore.getState()
    expect(s.currentExecution).toBeNull()
    expect(s.recentExecutions).toEqual([])
    expect(s.isTriggering).toBe(false)
    expect(s.showRunPanel).toBe(false)
  })
})

// Loads a specific execution by id and opens the run panel. Used when the user clicks a
// row in the recent executions list.
describe('selectExecution', () => {
  it('loads the execution and opens the run panel', async () => {
    const exec = makeExecution('exec-1', 'SUCCESS')
    mockGet.mockResolvedValue({ execution: exec })

    await useExecutionStore.getState().selectExecution('exec-1')

    const s = useExecutionStore.getState()
    expect(s.currentExecution?.id).toBe('exec-1')
    expect(s.showRunPanel).toBe(true)
  })

  it('is silent on API failure', async () => {
    mockGet.mockRejectedValue(new Error('network error'))
    await expect(
      useExecutionStore.getState().selectExecution('exec-1')
    ).resolves.toBeUndefined()
  })
})

// POSTs to trigger a new execution, opens the run panel, and polls for status changes
// every 1.5 s until a terminal state (SUCCESS or ERROR) is reached.
describe('triggerExecution', () => {
  it('sets isTriggering=true and showRunPanel=true immediately', () => {
    mockTrigger.mockReturnValue(new Promise(() => {}))
    useExecutionStore.getState().triggerExecution('wf-1')
    const s = useExecutionStore.getState()
    expect(s.isTriggering).toBe(true)
    expect(s.showRunPanel).toBe(true)
  })

  it('sets currentExecution and clears isTriggering after successful trigger', async () => {
    const summary = makeExecSummary('exec-1', 'SUCCESS')
    const exec = makeExecution('exec-1', 'SUCCESS')
    mockTrigger.mockResolvedValue({ execution: summary })
    mockGet.mockResolvedValue({ execution: exec })
    mockList.mockResolvedValue({ executions: [] })

    await useExecutionStore.getState().triggerExecution('wf-1')

    const s = useExecutionStore.getState()
    expect(s.currentExecution?.id).toBe('exec-1')
    expect(s.isTriggering).toBe(false)
  })

  it('clears isTriggering on API failure without rethrowing', async () => {
    mockTrigger.mockRejectedValue(new Error('trigger failed'))

    await expect(
      useExecutionStore.getState().triggerExecution('wf-1')
    ).resolves.toBeUndefined()

    expect(useExecutionStore.getState().isTriggering).toBe(false)
  })

  it('does not start polling when the initial execution is already terminal', async () => {
    const summary = makeExecSummary('exec-1', 'SUCCESS')
    const exec = makeExecution('exec-1', 'SUCCESS')
    mockTrigger.mockResolvedValue({ execution: summary })
    mockGet.mockResolvedValue({ execution: exec })
    mockList.mockResolvedValue({ executions: [] })

    await useExecutionStore.getState().triggerExecution('wf-1')

    await vi.advanceTimersByTimeAsync(1500)
    // Only the initial get call — no poll
    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  it('polls every 1.5 s while status is non-terminal, then stops on SUCCESS', async () => {
    const summary = makeExecSummary('exec-1', 'RUNNING')
    const runningExec = makeExecution('exec-1', 'RUNNING')
    const successExec = makeExecution('exec-1', 'SUCCESS')
    mockTrigger.mockResolvedValue({ execution: summary })
    mockGet
      .mockResolvedValueOnce({ execution: runningExec })
      .mockResolvedValueOnce({ execution: successExec })
    mockList.mockResolvedValue({ executions: [] })

    await useExecutionStore.getState().triggerExecution('wf-1')

    expect(useExecutionStore.getState().currentExecution?.status).toBe(
      'RUNNING'
    )

    await vi.advanceTimersByTimeAsync(1500)

    expect(useExecutionStore.getState().currentExecution?.status).toBe(
      'SUCCESS'
    )
    expect(mockGet).toHaveBeenCalledTimes(2)
  })

  it('stops polling when a terminal ERROR status is reached', async () => {
    const summary = makeExecSummary('exec-1', 'RUNNING')
    const runningExec = makeExecution('exec-1', 'RUNNING')
    const errorExec = makeExecution('exec-1', 'ERROR')
    mockTrigger.mockResolvedValue({ execution: summary })
    mockGet
      .mockResolvedValueOnce({ execution: runningExec })
      .mockResolvedValueOnce({ execution: errorExec })
    mockList.mockResolvedValue({ executions: [] })

    await useExecutionStore.getState().triggerExecution('wf-1')
    await vi.advanceTimersByTimeAsync(1500)

    expect(useExecutionStore.getState().currentExecution?.status).toBe('ERROR')

    // No further polls after terminal status
    await vi.advanceTimersByTimeAsync(1500)
    expect(mockGet).toHaveBeenCalledTimes(2)
  })
})
