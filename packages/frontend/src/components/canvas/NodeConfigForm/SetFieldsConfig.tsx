import * as React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { SetField } from '@/types/nodeConfig.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { arr } from '@/lib/nodeConfigHelpers'

interface Props {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}

export function SetFieldsConfig({ config, onChange }: Props) {
  const [touched, setTouched] = React.useState<ReadonlySet<string>>(new Set())

  function touchField(field: string) {
    setTouched((prev) => {
      const next = new Set(prev)
      next.add(field)
      return next
    })
  }

  const fields = arr<SetField>(config, 'fields')

  function keyError(i: number): string | undefined {
    const touchKey = `fields.${i}.key`
    if (!touched.has(touchKey)) return undefined
    const val = fields[i]?.key
    return typeof val !== 'string' || !val.trim()
      ? 'Key is required'
      : undefined
  }

  function updateField(i: number, key: keyof SetField, value: string) {
    const next = fields.map((f, idx) =>
      idx === i ? { ...f, [key]: value } : f
    )
    onChange({ ...config, fields: next })
  }

  function addField() {
    onChange({ ...config, fields: [...fields, { key: '', value: '' }] })
  }

  function removeField(i: number) {
    onChange({ ...config, fields: fields.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground text-xs font-medium">
        Fields
      </Label>
      <div className="space-y-2">
        {fields.map((f, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Input
                value={f.key}
                onChange={(e) => updateField(i, 'key', e.target.value)}
                onBlur={() => touchField(`fields.${i}.key`)}
                aria-invalid={!!keyError(i)}
                placeholder="key"
                className="font-mono"
              />
              <Input
                value={f.value}
                onChange={(e) => updateField(i, 'value', e.target.value)}
                placeholder="value"
                className="font-mono"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 shrink-0 p-0"
                onClick={() => removeField(i)}
                aria-label={`Remove field ${i + 1}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            {keyError(i) && (
              <p className="text-destructive text-xs">{keyError(i)}</p>
            )}
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-7 w-full gap-1 text-xs"
        onClick={addField}
      >
        <Plus className="size-3" />
        Add field
      </Button>
    </div>
  )
}
