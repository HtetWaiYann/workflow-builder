import type { NodeErrorPolicy } from '@workflow-builder/shared'
import { Field } from '@/components/canvas/NodeConfigForm/Field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  errorConfig: Record<string, unknown>
  onChange: (errorConfig: Record<string, unknown>) => void
}

function num(
  config: Record<string, unknown>,
  key: string,
  fallback: number
): number {
  const v = config[key]
  return typeof v === 'number' ? v : fallback
}

/**
 * Configuration form for per-node error handling.
 * Controls what happens when a node fails: stop, continue, or retry with backoff.
 * Also toggles the error output handle that routes failures to a handler node.
 *
 * @param errorConfig - Current error config stored in node.data.errorConfig.
 * @param onChange - Called with the full updated errorConfig on any field change.
 */
export function ErrorConfigForm({ errorConfig, onChange }: Props) {
  const policy = (errorConfig.policy as NodeErrorPolicy | undefined) ?? 'stop'
  const retryCount = num(errorConfig, 'retryCount', 1)
  const retryDelayMs = num(errorConfig, 'retryDelayMs', 1000)
  const errorBranch = (errorConfig.errorBranch as boolean | undefined) ?? false

  function update(patch: Record<string, unknown>) {
    onChange({ ...errorConfig, ...patch })
  }

  return (
    <div className="space-y-3">
      <Field label="On error">
        <Select value={policy} onValueChange={(v) => update({ policy: v })}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stop">Stop workflow</SelectItem>
            <SelectItem value="continue">Continue to next node</SelectItem>
            <SelectItem value="retry">Retry</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {policy === 'retry' && (
        <>
          <Field label="Retry attempts">
            <Input
              type="number"
              className="h-8 text-sm"
              min={1}
              max={10}
              value={retryCount}
              onChange={(e) =>
                update({
                  retryCount: Math.min(10, Math.max(1, Number(e.target.value))),
                })
              }
            />
          </Field>

          <Field label="Delay between retries (ms)">
            <Input
              type="number"
              className="h-8 text-sm"
              min={0}
              step={500}
              value={retryDelayMs}
              onChange={(e) =>
                update({ retryDelayMs: Math.max(0, Number(e.target.value)) })
              }
            />
          </Field>
        </>
      )}

      <div className="flex items-center gap-2 pt-0.5">
        <input
          id="error-branch-toggle"
          type="checkbox"
          className="accent-destructive size-3.5 cursor-pointer"
          checked={errorBranch}
          onChange={(e) => update({ errorBranch: e.target.checked })}
        />
        <Label
          htmlFor="error-branch-toggle"
          className="text-muted-foreground cursor-pointer text-xs font-medium"
        >
          Enable error output handle
        </Label>
      </div>
      {errorBranch && (
        <p className="text-muted-foreground text-xs">
          A red handle appears at the bottom of the node. Connect it to a
          handler node to route failures.
        </p>
      )}
    </div>
  )
}
