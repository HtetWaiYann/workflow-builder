import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/canvas/NodeConfigForm/Field'
import { str } from '@/lib/nodeConfigHelpers'

interface Props {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}

export function FilterArrayConfig({ config, onChange }: Props) {
  const [touched, setTouched] = React.useState(false)

  const expression = str(config, 'expression')
  const error = !expression.trim() ? 'Filter expression is required' : undefined
  const showError = touched && !!error

  return (
    <Field label="Filter expression" error={showError ? error : undefined}>
      <Input
        value={expression}
        onChange={(e) => onChange({ ...config, expression: e.target.value })}
        onBlur={() => setTouched(true)}
        aria-invalid={showError}
        placeholder="item.active === true"
        className="font-mono"
      />
    </Field>
  )
}
