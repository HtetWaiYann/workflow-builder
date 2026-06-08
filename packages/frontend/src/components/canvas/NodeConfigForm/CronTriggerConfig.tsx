import * as React from 'react'
import { CronTriggerConfigSchema } from '@triggr/shared'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/canvas/NodeConfigForm/Field'
import { str } from '@/lib/nodeConfigHelpers'
import { getConfigErrors, isValidCron } from '@/lib/nodeConfigValidation'

interface Props {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}

export function CronTriggerConfig({ config, onChange }: Props) {
  const [touched, setTouched] = React.useState<ReadonlySet<string>>(new Set())

  function touchField(field: string) {
    setTouched((prev) => {
      const next = new Set(prev)
      next.add(field)
      return next
    })
  }

  const schemaErrors = getConfigErrors(CronTriggerConfigSchema, config)

  const schedule = str(config, 'schedule')
  const extraErrors: Record<string, string> = {}
  if (schedule && !isValidCron(schedule))
    extraErrors['schedule'] = 'Enter a valid cron expression (e.g. 0 9 * * 1-5)'

  const errors = { ...schemaErrors, ...extraErrors }
  const fieldError = (f: string) => (touched.has(f) ? errors[f] : undefined)

  return (
    <Field label="Schedule" error={fieldError('schedule')}>
      <Input
        value={schedule}
        onChange={(e) => onChange({ ...config, schedule: e.target.value })}
        onBlur={() => touchField('schedule')}
        aria-invalid={touched.has('schedule') && !!errors['schedule']}
        placeholder="0 9 * * 1-5"
        className="font-mono"
      />
      <p className="text-muted-foreground text-xs">
        Min Hour DayOfMonth Month DayOfWeek — e.g.{' '}
        <code className="bg-muted rounded px-1">0 9 * * 1-5</code> runs at 9 AM
        on weekdays
      </p>
    </Field>
  )
}
