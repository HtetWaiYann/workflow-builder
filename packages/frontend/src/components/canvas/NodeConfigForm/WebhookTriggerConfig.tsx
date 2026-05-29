import * as React from 'react'
import { WebhookTriggerConfigSchema } from '@workflow-builder/shared'
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
import { getConfigErrors } from '@/lib/nodeConfigValidation'

interface Props {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}

export function WebhookTriggerConfig({ config, onChange }: Props) {
  const [touched, setTouched] = React.useState<ReadonlySet<string>>(new Set())

  function touchField(field: string) {
    setTouched((prev) => {
      const next = new Set(prev)
      next.add(field)
      return next
    })
  }

  const schemaErrors = getConfigErrors(WebhookTriggerConfigSchema, config)

  const path = str(config, 'path')
  const extraErrors: Record<string, string> = {}
  if (path && !path.startsWith('/'))
    extraErrors['path'] = "Path must start with '/'"

  const errors = { ...schemaErrors, ...extraErrors }
  const fieldError = (f: string) => (touched.has(f) ? errors[f] : undefined)

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
      <Field label="Path" error={fieldError('path')}>
        <Input
          value={path}
          onChange={(e) => onChange({ ...config, path: e.target.value })}
          onBlur={() => touchField('path')}
          aria-invalid={touched.has('path') && !!errors['path']}
          placeholder="/my-hook"
        />
      </Field>
    </div>
  )
}
