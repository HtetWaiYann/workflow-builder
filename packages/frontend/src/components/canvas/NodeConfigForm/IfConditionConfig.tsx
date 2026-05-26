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
      <Field label="Value">
        <Input
          value={str(config, 'value')}
          onChange={(e) => onChange({ ...config, value: e.target.value })}
          placeholder="200"
          className="font-mono"
        />
      </Field>
    </div>
  )
}
