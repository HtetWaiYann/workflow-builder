import { Input } from '@/components/ui/input'
import { Field } from '@/components/canvas/NodeConfigForm/Field'
import { str } from '@/lib/nodeConfigHelpers'

interface Props {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}

export function CronTriggerConfig({ config, onChange }: Props) {
  return (
    <Field label="Schedule">
      <Input
        value={str(config, 'schedule')}
        onChange={(e) => onChange({ ...config, schedule: e.target.value })}
        placeholder="0 9 * * 1-5"
        className="font-mono"
      />
    </Field>
  )
}
