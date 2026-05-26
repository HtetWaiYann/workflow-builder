import { Input } from '@/components/ui/input'
import { Field } from '@/components/canvas/NodeConfigForm/Field'
import { str } from '@/lib/nodeConfigHelpers'

interface Props {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}

export function FilterArrayConfig({ config, onChange }: Props) {
  return (
    <Field label="Filter expression">
      <Input
        value={str(config, 'expression')}
        onChange={(e) => onChange({ ...config, expression: e.target.value })}
        placeholder="item.active === true"
        className="font-mono"
      />
    </Field>
  )
}
