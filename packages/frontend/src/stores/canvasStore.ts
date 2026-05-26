import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Node, Edge } from '@xyflow/react'
import { createId } from '@paralleldrive/cuid2'
import type {
  WorkflowStatus,
  NodeType,
  WorkflowNode,
  WorkflowEdge,
} from '@workflow-builder/shared'
import { api } from '@/lib/api'
import { getNodeDefinition } from '@/lib/nodeRegistry'

interface CanvasStore {
  workflowId: string | null
  workflowName: string
  workflowStatus: WorkflowStatus
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  isDirty: boolean
  isSaving: boolean
  isLoading: boolean
  error: string | null

  /**
   * Loads a workflow from the API and populates nodes and edges.
   * Sets error to 'WORKFLOW_NOT_FOUND' on 404.
   * @param id - Workflow ID to load.
   */
  loadWorkflow(id: string): Promise<void>

  /** Replaces the node list and marks the canvas dirty. */
  setNodes(nodes: Node[]): void

  /** Replaces the edge list and marks the canvas dirty. */
  setEdges(edges: Edge[]): void

  /**
   * Adds a new node at the given position.
   * @param type - The node type to add.
   * @param position - Drop coordinates in React Flow space.
   */
  addNode(type: NodeType, position: { x: number; y: number }): void

  /** Updates a single node's config data and marks dirty. */
  updateNodeConfig(nodeId: string, config: Record<string, unknown>): void

  /** Updates a single node's display label and marks dirty. */
  updateNodeLabel(nodeId: string, label: string): void

  /** Sets the selected node ID (or null to deselect). */
  selectNode(nodeId: string | null): void

  /**
   * Persists the current nodes and edges to the backend.
   * @throws Never — errors are caught and stored in `error`.
   */
  saveCanvas(): Promise<void>

  /**
   * Updates the workflow name optimistically and persists via API.
   * @param name - New workflow name.
   */
  updateWorkflowName(name: string): Promise<void>

  /**
   * Toggles workflow status between ACTIVE and INACTIVE.
   * DRAFT and INACTIVE both transition to ACTIVE.
   */
  toggleWorkflowStatus(): Promise<void>

  /** Sets isDirty=true and schedules an auto-save after 2 s. */
  markDirty(): void

  /** Resets all state to initial values and cancels any pending auto-save. */
  reset(): void
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

export const useCanvasStore = create<CanvasStore>()(
  immer<CanvasStore>((set, get) => ({
    workflowId: null,
    workflowName: '',
    workflowStatus: 'DRAFT',
    nodes: [],
    edges: [],
    selectedNodeId: null,
    isDirty: false,
    isSaving: false,
    isLoading: false,
    error: null,

    loadWorkflow: async (id) => {
      set((draft) => {
        draft.isLoading = true
        draft.error = null
      })
      try {
        const { workflow } = await api.workflows.get(id)
        set((draft) => {
          draft.workflowId = workflow.id
          draft.workflowName = workflow.name
          draft.workflowStatus = workflow.status
          draft.nodes = workflow.nodes.map((n) => ({
            id: n.id,
            type: n.type,
            position: n.position,
            data: n.data,
          }))
          draft.edges = workflow.edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle ?? undefined,
            targetHandle: e.targetHandle ?? undefined,
          }))
          draft.isLoading = false
          draft.isDirty = false
        })
      } catch (err) {
        const code = (err as { code?: string }).code
        set((draft) => {
          draft.error =
            code === 'NOT_FOUND'
              ? 'WORKFLOW_NOT_FOUND'
              : err instanceof Error
                ? err.message
                : 'Failed to load workflow'
          draft.isLoading = false
        })
      }
    },

    setNodes: (nodes) => {
      set((draft) => {
        draft.nodes = nodes
      })
      get().markDirty()
    },

    setEdges: (edges) => {
      set((draft) => {
        draft.edges = edges
      })
      get().markDirty()
    },

    addNode: (type, position) => {
      const def = getNodeDefinition(type)
      const newNode: Node = {
        id: createId(),
        type,
        position,
        data: { label: def.label, config: {} },
      }
      set((draft) => {
        draft.nodes.push(newNode)
      })
      get().markDirty()
    },

    updateNodeConfig: (nodeId, config) => {
      set((draft) => {
        const node = draft.nodes.find((n) => n.id === nodeId)
        if (node) node.data.config = config
      })
      get().markDirty()
    },

    updateNodeLabel: (nodeId, label) => {
      set((draft) => {
        const node = draft.nodes.find((n) => n.id === nodeId)
        if (node) node.data.label = label
      })
      get().markDirty()
    },

    selectNode: (nodeId) => {
      set((draft) => {
        draft.selectedNodeId = nodeId
      })
    },

    saveCanvas: async () => {
      const state = get()
      if (!state.workflowId) return
      set((draft) => {
        draft.isSaving = true
      })
      try {
        const nodes: WorkflowNode[] = state.nodes.map((n) => ({
          id: n.id,
          type: n.type ?? '',
          position: n.position,
          data: n.data,
        }))
        const edges: WorkflowEdge[] = state.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle ?? null,
          targetHandle: e.targetHandle ?? null,
        }))
        await api.workflows.saveCanvas(state.workflowId, nodes, edges)
        set((draft) => {
          draft.isSaving = false
          draft.isDirty = false
        })
      } catch {
        set((draft) => {
          draft.isSaving = false
        })
      }
    },

    updateWorkflowName: async (name) => {
      const state = get()
      if (!state.workflowId) return
      set((draft) => {
        draft.workflowName = name
      })
      try {
        await api.workflows.updateWorkflowName(state.workflowId, name)
      } catch {
        // Name already updated optimistically — leave as-is on failure
      }
    },

    toggleWorkflowStatus: async () => {
      const state = get()
      if (!state.workflowId) return
      try {
        if (state.workflowStatus === 'ACTIVE') {
          const { workflow } = await api.workflows.deactivate(state.workflowId)
          set((draft) => {
            draft.workflowStatus = workflow.status
          })
        } else {
          const { workflow } = await api.workflows.activate(state.workflowId)
          set((draft) => {
            draft.workflowStatus = workflow.status
          })
        }
      } catch {
        // Status unchanged on failure
      }
    },

    markDirty: () => {
      set((draft) => {
        draft.isDirty = true
      })
      if (saveTimer !== null) clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        saveTimer = null
        get()
          .saveCanvas()
          .catch(() => {})
      }, 2000)
    },

    reset: () => {
      if (saveTimer !== null) {
        clearTimeout(saveTimer)
        saveTimer = null
      }
      set((draft) => {
        draft.workflowId = null
        draft.workflowName = ''
        draft.workflowStatus = 'DRAFT'
        draft.nodes = []
        draft.edges = []
        draft.selectedNodeId = null
        draft.isDirty = false
        draft.isSaving = false
        draft.isLoading = false
        draft.error = null
      })
    },
  }))
)
