import * as React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { RenameMapping } from '@/types/nodeConfig.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { arr } from '@/lib/nodeConfigHelpers'

interface Props {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}

export function RenameKeysConfig({ config, onChange }: Props) {
  const [touched, setTouched] = React.useState<ReadonlySet<string>>(new Set())

  function touchField(field: string) {
    setTouched((prev) => {
      const next = new Set(prev)
      next.add(field)
      return next
    })
  }

  const mappings = arr<RenameMapping>(config, 'mappings')

  function mappingError(
    i: number,
    key: keyof RenameMapping
  ): string | undefined {
    const touchKey = `mappings.${i}.${key}`
    if (!touched.has(touchKey)) return undefined
    const val = mappings[i]?.[key]
    if (typeof val !== 'string' || !val.trim())
      return key === 'from' ? '"From" key is required' : '"To" key is required'
    return undefined
  }

  function updateMapping(i: number, key: keyof RenameMapping, value: string) {
    const next = mappings.map((m, idx) =>
      idx === i ? { ...m, [key]: value } : m
    )
    onChange({ ...config, mappings: next })
  }

  function addMapping() {
    onChange({ ...config, mappings: [...mappings, { from: '', to: '' }] })
  }

  function removeMapping(i: number) {
    onChange({ ...config, mappings: mappings.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground text-xs font-medium">
        Mappings
      </Label>
      <div className="space-y-2">
        {mappings.map((m, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Input
                value={m.from}
                onChange={(e) => updateMapping(i, 'from', e.target.value)}
                onBlur={() => touchField(`mappings.${i}.from`)}
                aria-invalid={!!mappingError(i, 'from')}
                placeholder="old key"
                className="font-mono"
              />
              <span className="text-muted-foreground shrink-0 text-xs">→</span>
              <Input
                value={m.to}
                onChange={(e) => updateMapping(i, 'to', e.target.value)}
                onBlur={() => touchField(`mappings.${i}.to`)}
                aria-invalid={!!mappingError(i, 'to')}
                placeholder="new key"
                className="font-mono"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 shrink-0 p-0"
                onClick={() => removeMapping(i)}
                aria-label={`Remove mapping ${i + 1}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            {(mappingError(i, 'from') ?? mappingError(i, 'to')) && (
              <p className="text-destructive text-xs">
                {mappingError(i, 'from') ?? mappingError(i, 'to')}
              </p>
            )}
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-7 w-full gap-1 text-xs"
        onClick={addMapping}
      >
        <Plus className="size-3" />
        Add mapping
      </Button>
    </div>
  )
}
