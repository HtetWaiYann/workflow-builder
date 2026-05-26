import type { HttpMethod } from '@/types/nodeConfig.types'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/canvas/NodeConfigForm/Field'
import { str, HTTP_METHODS } from '@/lib/nodeConfigHelpers'

interface Props {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}

export function HttpRequestConfig({ config, onChange }: Props) {
  const method = str(config, 'method', 'GET') as HttpMethod
  const showBody = method !== 'GET' && method !== 'DELETE'

  return (
    <div className="space-y-3">
      <Field label="Method">
        <Select
          value={method}
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
      <Field label="URL">
        <Input
          value={str(config, 'url')}
          onChange={(e) => onChange({ ...config, url: e.target.value })}
          placeholder="https://api.example.com/endpoint"
        />
      </Field>
      <Field label="Headers (JSON)">
        <Textarea
          value={str(config, 'headers')}
          onChange={(e) => onChange({ ...config, headers: e.target.value })}
          placeholder={'{\n  "Content-Type": "application/json"\n}'}
          className="font-mono text-xs"
          rows={3}
        />
      </Field>
      {showBody && (
        <Field label="Body (JSON)">
          <Textarea
            value={str(config, 'body')}
            onChange={(e) => onChange({ ...config, body: e.target.value })}
            placeholder={'{\n  "key": "value"\n}'}
            className="font-mono text-xs"
            rows={4}
          />
        </Field>
      )}
    </div>
  )
}
