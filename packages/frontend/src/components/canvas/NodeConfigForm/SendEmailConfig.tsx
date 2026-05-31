import * as React from 'react'
import { SendEmailConfigSchema } from '@workflow-builder/shared'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/canvas/NodeConfigForm/Field'
import { str, num } from '@/lib/nodeConfigHelpers'
import { getConfigErrors, isValidEmail } from '@/lib/nodeConfigValidation'

interface Props {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}

export function SendEmailConfig({ config, onChange }: Props) {
  const [showSmtp, setShowSmtp] = React.useState(false)
  const [touched, setTouched] = React.useState<ReadonlySet<string>>(new Set())

  function touchField(field: string) {
    setTouched((prev) => {
      const next = new Set(prev)
      next.add(field)
      return next
    })
  }

  const schemaErrors = getConfigErrors(SendEmailConfigSchema, config)

  const toVal = str(config, 'to')
  const extraErrors: Record<string, string> = {}
  if (toVal && !isValidEmail(toVal))
    extraErrors['to'] = 'Enter a valid email address'

  const errors = { ...schemaErrors, ...extraErrors }
  const fieldError = (f: string) => (touched.has(f) ? errors[f] : undefined)

  const smtpFields = [
    'smtpHost',
    'smtpPort',
    'smtpUser',
    'smtpPass',
    'smtpFrom',
  ]
  const hasSmtpErrors = smtpFields.some((f) => errors[f])

  return (
    <div className="space-y-3">
      <Field label="To" error={fieldError('to')}>
        <Input
          value={toVal}
          onChange={(e) => onChange({ ...config, to: e.target.value })}
          onBlur={() => touchField('to')}
          aria-invalid={touched.has('to') && !!errors['to']}
          placeholder="recipient@example.com"
          type="email"
        />
      </Field>
      <Field label="Subject">
        <Input
          value={str(config, 'subject')}
          onChange={(e) => onChange({ ...config, subject: e.target.value })}
          placeholder="Email subject"
        />
      </Field>
      <Field label="Body">
        <Textarea
          value={str(config, 'body')}
          onChange={(e) => onChange({ ...config, body: e.target.value })}
          placeholder="Email body..."
          rows={4}
        />
      </Field>

      {/* SMTP settings — collapsible */}
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
        onClick={() => setShowSmtp((v) => !v)}
      >
        <span>{showSmtp ? '▾' : '▸'}</span>
        SMTP Settings
        {!showSmtp && hasSmtpErrors && (
          <span className="bg-destructive ml-1 inline-flex h-1.5 w-1.5 rounded-full" />
        )}
      </button>

      {showSmtp && (
        <div className="space-y-3">
          <p className="text-muted-foreground text-xs">
            Use{' '}
            <code className="bg-muted rounded px-1">{'{{ $vars.KEY }}'}</code>{' '}
            for workspace variables or{' '}
            <code className="bg-muted rounded px-1">{'{{ $input.key }}'}</code>{' '}
            for upstream node output fields.
          </p>
          <Field label="SMTP Host" error={fieldError('smtpHost')}>
            <Input
              value={str(config, 'smtpHost')}
              onChange={(e) =>
                onChange({ ...config, smtpHost: e.target.value })
              }
              onBlur={() => touchField('smtpHost')}
              aria-invalid={touched.has('smtpHost') && !!errors['smtpHost']}
              placeholder="smtp.example.com or {{ $vars.SMTP_HOST }}"
            />
          </Field>
          <Field label="SMTP Port" error={fieldError('smtpPort')}>
            <Input
              type="number"
              value={num(config, 'smtpPort', 0) || ''}
              onChange={(e) =>
                onChange({
                  ...config,
                  smtpPort: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              onBlur={() => touchField('smtpPort')}
              aria-invalid={touched.has('smtpPort') && !!errors['smtpPort']}
              placeholder="587"
            />
          </Field>
          <Field label="SMTP User" error={fieldError('smtpUser')}>
            <Input
              value={str(config, 'smtpUser')}
              onChange={(e) =>
                onChange({ ...config, smtpUser: e.target.value })
              }
              onBlur={() => touchField('smtpUser')}
              aria-invalid={touched.has('smtpUser') && !!errors['smtpUser']}
              placeholder="user@example.com or {{ $vars.SMTP_USER }}"
            />
          </Field>
          <Field label="SMTP Password" error={fieldError('smtpPass')}>
            <Input
              type="password"
              value={str(config, 'smtpPass')}
              onChange={(e) =>
                onChange({ ...config, smtpPass: e.target.value })
              }
              onBlur={() => touchField('smtpPass')}
              aria-invalid={touched.has('smtpPass') && !!errors['smtpPass']}
              placeholder="{{ $vars.SMTP_PASS }}"
            />
          </Field>
          <Field label="From Address" error={fieldError('smtpFrom')}>
            <Input
              value={str(config, 'smtpFrom')}
              onChange={(e) =>
                onChange({ ...config, smtpFrom: e.target.value })
              }
              onBlur={() => touchField('smtpFrom')}
              aria-invalid={touched.has('smtpFrom') && !!errors['smtpFrom']}
              placeholder="Name <email@example.com>"
            />
          </Field>
        </div>
      )}
    </div>
  )
}
