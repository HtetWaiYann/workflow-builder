import * as React from 'react'
import { DelayConfigSchema } from '@triggr/shared'
import type { DelayUnit } from '@/types/nodeConfig.types'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Field } from '@/components/canvas/NodeConfigForm/Field'
import { str, num, DELAY_UNITS } from '@/lib/nodeConfigHelpers'
import { getConfigErrors } from '@/lib/nodeConfigValidation'

interface Props {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}

export function DelayConfig({ config, onChange }: Props) {
  const [durationTouched, setDurationTouched] = React.useState(false)

  const errors = getConfigErrors(DelayConfigSchema, config)
  const durationError = durationTouched ? errors['duration'] : undefined

  return (
    <div className="space-y-3">
      <Field label="Duration" error={durationError}>
        <Input
          type="number"
          min={1}
          value={num(config, 'duration', 1)}
          onChange={(e) =>
            onChange({ ...config, duration: Number(e.target.value) })
          }
          onBlur={() => setDurationTouched(true)}
          aria-invalid={durationTouched && !!errors['duration']}
          placeholder="1"
        />
      </Field>
      <Field label="Unit">
        <Select
          value={str(config, 'unit', 'seconds') as DelayUnit}
          onValueChange={(value) => onChange({ ...config, unit: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DELAY_UNITS.map((u) => (
              <SelectItem key={u.value} value={u.value}>
                {u.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  )
}
