import * as React from 'react'
import { X, Loader2 } from 'lucide-react'
import type { NodeType } from '@triggr/shared'
import { useCanvasStore } from '@/stores/canvasStore'
import { getNodeDefinition, ICON_MAP } from '@/lib/nodeRegistry'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NodeConfigForm } from '@/components/canvas/NodeConfigForm'
import { ErrorConfigForm } from '@/components/canvas/NodeConfigForm/ErrorConfigForm'
import { NodeDocsButton } from '@/components/canvas/NodeDocs'
import { getNodeConfigErrors } from '@/lib/nodeConfigValidation'
import { api } from '@/lib/api'

interface NodeLabelInputProps {
  initialLabel: string
  onCommit: (label: string) => void
}

function NodeLabelInput({ initialLabel, onCommit }: NodeLabelInputProps) {
  const [value, setValue] = React.useState(initialLabel)

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const trimmed = value.trim()
      if (trimmed) onCommit(trimmed)
    }
  }

  function handleBlur() {
    const trimmed = value.trim()
    if (trimmed) onCommit(trimmed)
  }

  return (
    <Input
      className="h-8 text-sm"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  )
}

type TestPhase = 'idle' | 'running' | 'success' | 'error'

export function ConfigPanel() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)
  const workflowId = useCanvasStore((s) => s.workflowId)
  const nodes = useCanvasStore((s) => s.nodes)
  const selectNode = useCanvasStore((s) => s.selectNode)
  const updateNodeLabel = useCanvasStore((s) => s.updateNodeLabel)
  const updateNodeConfig = useCanvasStore((s) => s.updateNodeConfig)
  const updateNodeErrorConfig = useCanvasStore((s) => s.updateNodeErrorConfig)

  const [testPhase, setTestPhase] = React.useState<TestPhase>('idle')
  const [testOutput, setTestOutput] = React.useState<Record<
    string,
    unknown
  > | null>(null)
  const [testError, setTestError] = React.useState<string | null>(null)
  const [configErrors, setConfigErrors] = React.useState<
    Record<string, string>
  >({})

  React.useEffect(() => {
    setTestPhase('idle')
    setTestOutput(null)
    setTestError(null)
    setConfigErrors({})
  }, [selectedNodeId])

  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null

  const nodeType = selectedNode
    ? ((selectedNode.type as NodeType | undefined) ?? 'manual-trigger')
    : 'manual-trigger'
  const def = selectedNode ? getNodeDefinition(nodeType) : null
  const IconComponent = def ? ICON_MAP[def.icon] : null
  const isTrigger = def?.group === 'Triggers'

  const nodeConfig = (selectedNode?.data.config ?? {}) as Record<
    string,
    unknown
  >
  const nodeErrorConfig = (selectedNode?.data.errorConfig ?? {}) as Record<
    string,
    unknown
  >

  async function handleTestNode() {
    if (!selectedNode || !workflowId) return

    const errors = getNodeConfigErrors(nodeType, nodeConfig)
    if (Object.keys(errors).length > 0) {
      setConfigErrors(errors)
      return
    }

    setConfigErrors({})
    setTestPhase('running')
    setTestOutput(null)
    setTestError(null)

    try {
      const workflowNode = {
        id: selectedNode.id,
        type: selectedNode.type ?? '',
        position: selectedNode.position,
        data: selectedNode.data,
      }
      const { nodeRun } = await api.executions.testNode(
        workflowId,
        selectedNode.id,
        workflowNode
      )
      if (nodeRun.status === 'SUCCESS') {
        setTestPhase('success')
        setTestOutput(nodeRun.outputData)
      } else {
        setTestPhase('error')
        setTestError(nodeRun.error ?? 'Node execution failed')
      }
    } catch (err) {
      setTestPhase('error')
      setTestError(err instanceof Error ? err.message : 'Test failed')
    }
  }

  return (
    <div
      style={{ width: selectedNodeId ? 320 : 0 }}
      className="flex-shrink-0 overflow-hidden border-l transition-all duration-200 ease-in-out"
    >
      <div className="flex h-full w-[320px] flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 border-b px-3 py-2.5">
          {def && IconComponent && (
            <IconComponent
              size={15}
              style={{ color: def.color }}
              className="shrink-0"
            />
          )}
          <span className="text-muted-foreground flex-1 truncate text-sm font-medium">
            {def?.label ?? ''}
          </span>
          {selectedNode && (
            <NodeDocsButton nodeType={nodeType} nodeLabel={def?.label ?? ''} />
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => selectNode(null)}
            aria-label="Close panel"
          >
            <X className="size-3.5" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
          {/* Node name */}
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium">
              Node name
            </label>
            <NodeLabelInput
              key={selectedNodeId ?? ''}
              initialLabel={
                (selectedNode?.data.label as string | undefined) ??
                def?.label ??
                ''
              }
              onCommit={(label) => {
                if (selectedNodeId) updateNodeLabel(selectedNodeId, label)
              }}
            />
          </div>

          {/* Node config form */}
          {selectedNode && (
            <NodeConfigForm
              key={selectedNodeId ?? ''}
              nodeType={nodeType}
              config={nodeConfig}
              workflowId={workflowId ?? undefined}
              nodeId={selectedNodeId ?? undefined}
              onChange={(config) => {
                if (selectedNodeId) updateNodeConfig(selectedNodeId, config)
              }}
            />
          )}

          {/* Error handling — not shown for trigger nodes */}
          {selectedNode && !isTrigger && (
            <div className="space-y-2">
              <div className="border-t pt-3">
                <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
                  Error Handling
                </p>
                <ErrorConfigForm
                  key={selectedNodeId ?? ''}
                  errorConfig={nodeErrorConfig}
                  onChange={(errorConfig) => {
                    if (selectedNodeId)
                      updateNodeErrorConfig(selectedNodeId, errorConfig)
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isTrigger && selectedNode && (
          <div className="shrink-0 space-y-2 border-t px-3 py-2.5">
            <Button
              className="h-8 w-full text-sm"
              variant="outline"
              onClick={handleTestNode}
              disabled={testPhase === 'running'}
            >
              {testPhase === 'running' ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Running…
                </>
              ) : (
                'Test Node'
              )}
            </Button>

            {Object.keys(configErrors).length > 0 && (
              <div className="rounded border border-red-200 bg-red-50 px-2.5 py-2 dark:border-red-900/50 dark:bg-red-950/30">
                <p className="mb-1 text-xs font-medium text-red-700 dark:text-red-400">
                  Fix before testing:
                </p>
                <ul className="space-y-0.5">
                  {Object.entries(configErrors).map(([field, message]) => (
                    <li
                      key={field}
                      className="text-xs text-red-600 dark:text-red-500"
                    >
                      <span className="font-medium capitalize">{field}</span>:{' '}
                      {message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {testPhase === 'success' && (
              <div className="rounded border border-green-200 bg-green-50 px-2.5 py-2 dark:border-green-900/50 dark:bg-green-950/30">
                <p className="mb-1 text-xs font-medium text-green-700 dark:text-green-400">
                  Output
                </p>
                <pre className="max-h-36 overflow-auto font-mono text-xs text-green-800 dark:text-green-300">
                  {JSON.stringify(testOutput, null, 2)}
                </pre>
              </div>
            )}

            {testPhase === 'error' && testError && (
              <div className="rounded border border-red-200 bg-red-50 px-2.5 py-2 dark:border-red-900/50 dark:bg-red-950/30">
                <p className="mb-1 text-xs font-medium text-red-700 dark:text-red-400">
                  Error
                </p>
                <p className="text-xs break-words text-red-600 dark:text-red-500">
                  {testError}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
