import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Field } from '@/components/canvas/NodeConfigForm/Field'
import { str, HTTP_METHODS } from '@/lib/nodeConfigHelpers'

interface Props {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}

export function WebhookTriggerConfig({ config, onChange }: Props) {
  return (
    <div className="space-y-3">
      <Field label="Method">
        <Select
          value={str(config, 'method', 'POST')}
          onValueChange={(value) => onChange({ ...config, method: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HTTP_METHODS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Path">
        <Input
          value={str(config, 'path')}
          onChange={(e) => onChange({ ...config, path: e.target.value })}
          placeholder="/my-hook"
        />
      </Field>
    </div>
  )
}
