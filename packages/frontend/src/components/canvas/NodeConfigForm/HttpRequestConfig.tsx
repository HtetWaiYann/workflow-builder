import * as React from 'react'
import { HttpRequestConfigSchema } from '@workflow-builder/shared'
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
import {
  getConfigErrors,
  isValidUrl,
  isValidJson,
} from '@/lib/nodeConfigValidation'

interface Props {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}

export function HttpRequestConfig({ config, onChange }: Props) {
  const [touched, setTouched] = React.useState<ReadonlySet<string>>(new Set())

  function touchField(field: string) {
    setTouched((prev) => {
      const next = new Set(prev)
      next.add(field)
      return next
    })
  }

  const method = str(config, 'method', 'GET') as HttpMethod
  const showBody = method !== 'GET' && method !== 'DELETE'

  const schemaErrors = getConfigErrors(HttpRequestConfigSchema, config)

  const url = str(config, 'url')
  const headers = str(config, 'headers')
  const body = str(config, 'body')
  const extraErrors: Record<string, string> = {}
  if (url && !isValidUrl(url))
    extraErrors['url'] = 'Enter a valid URL (e.g. https://api.example.com)'
  if (!isValidJson(headers))
    extraErrors['headers'] = 'Invalid JSON — check your formatting'
  if (showBody && !isValidJson(body))
    extraErrors['body'] = 'Invalid JSON — check your formatting'

  const errors = { ...schemaErrors, ...extraErrors }
  const fieldError = (f: string) => (touched.has(f) ? errors[f] : undefined)

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
      <Field label="URL" error={fieldError('url')}>
        <Input
          value={url}
          onChange={(e) => onChange({ ...config, url: e.target.value })}
          onBlur={() => touchField('url')}
          aria-invalid={touched.has('url') && !!errors['url']}
          placeholder="https://api.example.com/endpoint"
        />
      </Field>
      <Field label="Headers (JSON)" error={fieldError('headers')}>
        <Textarea
          value={headers}
          onChange={(e) => onChange({ ...config, headers: e.target.value })}
          onBlur={() => touchField('headers')}
          placeholder={'{\n  "Content-Type": "application/json"\n}'}
          className="font-mono text-xs"
          rows={3}
        />
      </Field>
      {showBody && (
        <Field label="Body (JSON)" error={fieldError('body')}>
          <Textarea
            value={body}
            onChange={(e) => onChange({ ...config, body: e.target.value })}
            onBlur={() => touchField('body')}
            placeholder={'{\n  "key": "value"\n}'}
            className="font-mono text-xs"
            rows={4}
          />
        </Field>
      )}
    </div>
  )
}
