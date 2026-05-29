import * as React from 'react'
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
  const [touched, setTouched] = React.useState<ReadonlySet<string>>(new Set())

  function touchField(field: string) {
    setTouched((prev) => {
      const next = new Set(prev)
      next.add(field)
      return next
    })
  }

  const cases = arr<SwitchCase>(config, 'cases')

  const fieldEmpty = !str(config, 'field').trim()
  const scalarErrors: Record<string, string> = {}
  if (fieldEmpty) scalarErrors['field'] = 'Required'

  function caseError(i: number, key: keyof SwitchCase): string | undefined {
    const touchKey = `cases.${i}.${key}`
    if (!touched.has(touchKey)) return undefined
    const val = cases[i]?.[key]
    return typeof val !== 'string' || !val.trim() ? 'Required' : undefined
  }

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
      <Field
        label="Field"
        error={touched.has('field') ? scalarErrors['field'] : undefined}
      >
        <Input
          value={str(config, 'field')}
          onChange={(e) => onChange({ ...config, field: e.target.value })}
          onBlur={() => touchField('field')}
          aria-invalid={touched.has('field') && !!scalarErrors['field']}
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
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Input
                  value={c.value}
                  onChange={(e) => updateCase(i, 'value', e.target.value)}
                  onBlur={() => touchField(`cases.${i}.value`)}
                  aria-invalid={!!caseError(i, 'value')}
                  placeholder="value"
                  className="font-mono"
                />
                <Input
                  value={c.label}
                  onChange={(e) => updateCase(i, 'label', e.target.value)}
                  onBlur={() => touchField(`cases.${i}.label`)}
                  aria-invalid={!!caseError(i, 'label')}
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
              {(caseError(i, 'value') || caseError(i, 'label')) && (
                <p className="text-destructive text-xs">
                  {caseError(i, 'value')
                    ? 'Value is required'
                    : 'Label is required'}
                </p>
              )}
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
