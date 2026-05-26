import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/canvas/NodeConfigForm/Field'
import { str } from '@/lib/nodeConfigHelpers'

interface Props {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}

export function SlackMessageConfig({ config, onChange }: Props) {
  return (
    <div className="space-y-3">
      <Field label="Webhook URL">
        <Input
          value={str(config, 'webhookUrl')}
          onChange={(e) => onChange({ ...config, webhookUrl: e.target.value })}
          placeholder="https://hooks.slack.com/services/..."
          type="url"
        />
      </Field>
      <Field label="Message">
        <Textarea
          value={str(config, 'message')}
          onChange={(e) => onChange({ ...config, message: e.target.value })}
          placeholder="Your message here..."
          rows={3}
        />
      </Field>
    </div>
  )
}
