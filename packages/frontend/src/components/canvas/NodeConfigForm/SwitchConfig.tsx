import { Plus, Trash2 } from 'lucide-react'
import type { SwitchCase } from '@/types/nodeConfig.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Field } from '@/components/canvas/NodeConfigForm/Field'
import { str, arr } from '@/lib/nodeConfigHelpers'

interface Props {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}

export function SwitchConfig({ config, onChange }: Props) {
  const cases = arr<SwitchCase>(config, 'cases')

  function updateCase(i: number, key: keyof SwitchCase, value: string) {
    const next = cases.map((c, idx) => (idx === i ? { ...c, [key]: value } : c))
    onChange({ ...config, cases: next })
  }

  function addCase() {
    onChange({ ...config, cases: [...cases, { value: '', label: '' }] })
  }

  function removeCase(i: number) {
    onChange({ ...config, cases: cases.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-3">
      <Field label="Field">
        <Input
          value={str(config, 'field')}
          onChange={(e) => onChange({ ...config, field: e.target.value })}
          placeholder="data.status"
          className="font-mono"
        />
      </Field>
      <div className="space-y-1.5">
        <Label className="text-muted-foreground text-xs font-medium">
          Cases
        </Label>
        <div className="space-y-2">
          {cases.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Input
                value={c.value}
                onChange={(e) => updateCase(i, 'value', e.target.value)}
                placeholder="value"
                className="font-mono"
              />
              <Input
                value={c.label}
                onChange={(e) => updateCase(i, 'label', e.target.value)}
                placeholder="label"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 shrink-0 p-0"
                onClick={() => removeCase(i)}
                aria-label={`Remove case ${i + 1}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-full gap-1 text-xs"
          onClick={addCase}
        >
          <Plus className="size-3" />
          Add case
        </Button>
      </div>
    </div>
  )
}
