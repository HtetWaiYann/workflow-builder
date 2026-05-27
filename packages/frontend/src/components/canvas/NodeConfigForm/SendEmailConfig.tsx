import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/canvas/NodeConfigForm/Field'
import { str, num } from '@/lib/nodeConfigHelpers'

interface Props {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}

export function SendEmailConfig({ config, onChange }: Props) {
  const [showSmtp, setShowSmtp] = React.useState(false)

  return (
    <div className="space-y-3">
      <Field label="To">
        <Input
          value={str(config, 'to')}
          onChange={(e) => onChange({ ...config, to: e.target.value })}
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
          <Field label="SMTP Host">
            <Input
              value={str(config, 'smtpHost')}
              onChange={(e) =>
                onChange({ ...config, smtpHost: e.target.value })
              }
              placeholder="smtp.example.com or {{ $vars.SMTP_HOST }}"
            />
          </Field>
          <Field label="SMTP Port">
            <Input
              type="number"
              value={num(config, 'smtpPort', 0) || ''}
              onChange={(e) =>
                onChange({
                  ...config,
                  smtpPort: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="587"
            />
          </Field>
          <Field label="SMTP User">
            <Input
              value={str(config, 'smtpUser')}
              onChange={(e) =>
                onChange({ ...config, smtpUser: e.target.value })
              }
              placeholder="user@example.com or {{ $vars.SMTP_USER }}"
            />
          </Field>
          <Field label="SMTP Password">
            <Input
              type="password"
              value={str(config, 'smtpPass')}
              onChange={(e) =>
                onChange({ ...config, smtpPass: e.target.value })
              }
              placeholder="{{ $vars.SMTP_PASS }}"
            />
          </Field>
          <Field label="From Address">
            <Input
              value={str(config, 'smtpFrom')}
              onChange={(e) =>
                onChange({ ...config, smtpFrom: e.target.value })
              }
              placeholder="Name <email@example.com>"
            />
          </Field>
        </div>
      )}
    </div>
  )
}
