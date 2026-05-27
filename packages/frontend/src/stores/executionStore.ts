import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Execution, ExecutionSummary } from '@workflow-builder/shared'
import { api } from '@/lib/api'

let pollTimer: ReturnType<typeof setInterval> | null = null

function clearPoll() {
  if (pollTimer !== null) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

const TERMINAL_STATUSES = new Set(['SUCCESS', 'ERROR'])

interface ExecutionStore {
  /** The execution currently displayed in the run panel, including node runs. */
  currentExecution: Execution | null
  /** Recent execution summaries for the open workflow. */
  recentExecutions: ExecutionSummary[]
  /** True while the POST /executions request is in flight. */
  isTriggering: boolean
  /** Controls run panel visibility. */
  showRunPanel: boolean

  /**
   * Triggers a manual execution for the given workflow, opens the run panel,
   * and polls for status until a terminal state is reached.
   * @param workflowId - The workflow to run.
   */
  triggerExecution(workflowId: string): Promise<void>

  /**
   * Loads the list of recent executions for the current workflow.
   * @param workflowId - Workflow to fetch executions for.
   */
  loadExecutions(workflowId: string): Promise<void>

  /**
   * Loads a specific execution by ID and shows it in the run panel.
   * @param executionId - Execution to display.
   */
  selectExecution(executionId: string): Promise<void>

  /** Opens the run panel without triggering a new execution. */
  openRunPanel(): void

  /** Closes the run panel and stops any active polling. */
  closeRunPanel(): void

  /** Resets all execution state (call when leaving the canvas). */
  reset(): void
}

export const useExecutionStore = create<ExecutionStore>()(
  immer<ExecutionStore>((set, get) => ({
    currentExecution: null,
    recentExecutions: [],
    isTriggering: false,
    showRunPanel: false,

    triggerExecution: async (workflowId) => {
      clearPoll()
      set((draft) => {
        draft.isTriggering = true
        draft.showRunPanel = true
        draft.currentExecution = null
      })
      try {
        const { execution: summary } = await api.executions.trigger(workflowId)
        const { execution: full } = await api.executions.get(summary.id)
        set((draft) => {
          draft.currentExecution = full
          draft.isTriggering = false
        })

        if (!TERMINAL_STATUSES.has(full.status)) {
          pollTimer = setInterval(async () => {
            try {
              const { execution: polled } = await api.executions.get(full.id)
              set((draft) => {
                draft.currentExecution = polled
              })
              if (TERMINAL_STATUSES.has(polled.status)) {
                clearPoll()
                // Refresh recent executions list after completion
                get()
                  .loadExecutions(workflowId)
                  .catch(() => {})
              }
            } catch {
              clearPoll()
            }
          }, 1500)
        } else {
          get()
            .loadExecutions(workflowId)
            .catch(() => {})
        }
      } catch {
        set((draft) => {
          draft.isTriggering = false
        })
      }
    },

    loadExecutions: async (workflowId) => {
      try {
        const { executions } = await api.executions.list(workflowId, 20)
        set((draft) => {
          draft.recentExecutions = executions
        })
      } catch {
        // Silent — list is non-critical
      }
    },

    selectExecution: async (executionId) => {
      try {
        const { execution } = await api.executions.get(executionId)
        clearPoll()
        set((draft) => {
          draft.currentExecution = execution
          draft.showRunPanel = true
        })
      } catch {
        // Silent
      }
    },

    openRunPanel: () =>
      set((draft) => {
        draft.showRunPanel = true
      }),

    closeRunPanel: () => {
      clearPoll()
      set((draft) => {
        draft.showRunPanel = false
      })
    },

    reset: () => {
      clearPoll()
      set((draft) => {
        draft.currentExecution = null
        draft.recentExecutions = []
        draft.isTriggering = false
        draft.showRunPanel = false
      })
    },
  }))
)
