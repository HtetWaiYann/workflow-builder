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
  /** Recent execution summaries for the open workflow, shared by RunPanel and HistoryPanel. */
  recentExecutions: ExecutionSummary[]
  /** True while the POST /executions request is in flight. */
  isTriggering: boolean
  /** Controls run panel visibility. */
  showRunPanel: boolean

  /** Controls visibility of the History panel (right-side slide-in). */
  showHistoryPanel: boolean
  /** The workflow ID currently shown in the history panel. */
  historyWorkflowId: string | null
  /** True while selectHistoryExecution is fetching the full execution. */
  isLoadingHistoryDetail: boolean
  /** Full execution being viewed in the history drill-down. Null means list view is active. */
  historyExecution: Execution | null

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

  /**
   * Opens the history panel for a workflow and loads its recent executions.
   * Reuses the existing recentExecutions array via loadExecutions().
   * @param workflowId - The workflow whose run history to display.
   */
  openHistoryPanel(workflowId: string): Promise<void>

  /** Closes the history panel and resets all history-scoped state. */
  closeHistoryPanel(): void

  /**
   * Fetches a full execution (including nodeRuns) and shows it in the history detail view.
   * Sets isLoadingHistoryDetail while the request is in flight.
   * @param executionId - The execution to drill into.
   */
  selectHistoryExecution(executionId: string): Promise<void>

  /** Returns to the history list view without closing the panel. */
  backToHistoryList(): void

  /** Resets all execution state (call when leaving the canvas). */
  reset(): void
}

export const useExecutionStore = create<ExecutionStore>()(
  immer<ExecutionStore>((set, get) => ({
    currentExecution: null,
    recentExecutions: [],
    isTriggering: false,
    showRunPanel: false,
    showHistoryPanel: false,
    historyWorkflowId: null,
    isLoadingHistoryDetail: false,
    historyExecution: null,

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

    openHistoryPanel: async (workflowId) => {
      set((draft) => {
        draft.showHistoryPanel = true
        draft.historyWorkflowId = workflowId
        draft.historyExecution = null
        draft.isLoadingHistoryDetail = false
      })
      await get().loadExecutions(workflowId)
    },

    closeHistoryPanel: () =>
      set((draft) => {
        draft.showHistoryPanel = false
        draft.historyWorkflowId = null
        draft.historyExecution = null
        draft.isLoadingHistoryDetail = false
      }),

    selectHistoryExecution: async (executionId) => {
      set((draft) => {
        draft.isLoadingHistoryDetail = true
      })
      try {
        const { execution } = await api.executions.get(executionId)
        set((draft) => {
          draft.historyExecution = execution
          draft.isLoadingHistoryDetail = false
        })
      } catch {
        set((draft) => {
          draft.isLoadingHistoryDetail = false
        })
      }
    },

    backToHistoryList: () =>
      set((draft) => {
        draft.historyExecution = null
        draft.isLoadingHistoryDetail = false
      }),

    reset: () => {
      clearPoll()
      set((draft) => {
        draft.currentExecution = null
        draft.recentExecutions = []
        draft.isTriggering = false
        draft.showRunPanel = false
        draft.showHistoryPanel = false
        draft.historyWorkflowId = null
        draft.isLoadingHistoryDetail = false
        draft.historyExecution = null
      })
    },
  }))
)
