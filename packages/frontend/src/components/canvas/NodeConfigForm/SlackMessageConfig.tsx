import * as React from 'react'
import { SlackMessageConfigSchema } from '@workflow-builder/shared'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/canvas/NodeConfigForm/Field'
import { str } from '@/lib/nodeConfigHelpers'
import { getConfigErrors, isValidUrl } from '@/lib/nodeConfigValidation'

interface Props {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}

export function SlackMessageConfig({ config, onChange }: Props) {
  const [touched, setTouched] = React.useState<ReadonlySet<string>>(new Set())

  function touchField(field: string) {
    setTouched((prev) => {
      const next = new Set(prev)
      next.add(field)
      return next
    })
  }

  const schemaErrors = getConfigErrors(SlackMessageConfigSchema, config)

  const webhookUrl = str(config, 'webhookUrl')
  const extraErrors: Record<string, string> = {}
  if (webhookUrl && !isValidUrl(webhookUrl))
    extraErrors['webhookUrl'] = 'Enter a valid Slack webhook URL'
  if (!str(config, 'message').trim())
    extraErrors['message'] = 'Message is required'

  const errors = { ...schemaErrors, ...extraErrors }
  const fieldError = (f: string) => (touched.has(f) ? errors[f] : undefined)

  return (
    <div className="space-y-3">
      <Field label="Webhook URL" error={fieldError('webhookUrl')}>
        <Input
          value={webhookUrl}
          onChange={(e) => onChange({ ...config, webhookUrl: e.target.value })}
          onBlur={() => touchField('webhookUrl')}
          aria-invalid={touched.has('webhookUrl') && !!errors['webhookUrl']}
          placeholder="https://hooks.slack.com/services/..."
          type="url"
        />
      </Field>
      <Field label="Message" error={fieldError('message')}>
        <Textarea
          value={str(config, 'message')}
          onChange={(e) => onChange({ ...config, message: e.target.value })}
          onBlur={() => touchField('message')}
          aria-invalid={touched.has('message') && !!errors['message']}
          placeholder="Your message here..."
          rows={3}
        />
      </Field>
    </div>
  )
}
