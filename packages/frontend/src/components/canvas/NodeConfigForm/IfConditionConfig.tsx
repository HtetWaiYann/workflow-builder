import * as React from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Field } from '@/components/canvas/NodeConfigForm/Field'
import { str, IF_OPERATORS } from '@/lib/nodeConfigHelpers'

interface Props {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}

export function IfConditionConfig({ config, onChange }: Props) {
  const [touched, setTouched] = React.useState<ReadonlySet<string>>(new Set())

  function touchField(field: string) {
    setTouched((prev) => {
      const next = new Set(prev)
      next.add(field)
      return next
    })
  }

  const errors: Record<string, string> = {}
  if (!str(config, 'field').trim()) errors['field'] = 'Required'
  if (!str(config, 'value').trim()) errors['value'] = 'Required'

  const fieldError = (f: string) => (touched.has(f) ? errors[f] : undefined)

  return (
    <div className="space-y-3">
      <Field label="Field" error={fieldError('field')}>
        <Input
          value={str(config, 'field')}
          onChange={(e) => onChange({ ...config, field: e.target.value })}
          onBlur={() => touchField('field')}
          aria-invalid={touched.has('field') && !!errors['field']}
          placeholder="data.status"
          className="font-mono"
        />
      </Field>
      <Field label="Operator">
        <Select
          value={str(config, 'operator', '==')}
          onValueChange={(value) => onChange({ ...config, operator: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {IF_OPERATORS.map((op) => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Value" error={fieldError('value')}>
        <Input
          value={str(config, 'value')}
          onChange={(e) => onChange({ ...config, value: e.target.value })}
          onBlur={() => touchField('value')}
          aria-invalid={touched.has('value') && !!errors['value']}
          placeholder="200"
          className="font-mono"
        />
      </Field>
    </div>
  )
}
