import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/canvas/NodeConfigForm/Field'
import { str } from '@/lib/nodeConfigHelpers'

interface Props {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}

export function SendEmailConfig({ config, onChange }: Props) {
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
    </div>
  )
}
