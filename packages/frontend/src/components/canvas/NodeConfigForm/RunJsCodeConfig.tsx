import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/canvas/NodeConfigForm/Field'
import { str } from '@/lib/nodeConfigHelpers'

interface Props {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}

export function RunJsCodeConfig({ config, onChange }: Props) {
  return (
    <Field label="Code">
      <Textarea
        value={str(config, 'code')}
        onChange={(e) => onChange({ ...config, code: e.target.value })}
        placeholder={
          '// Access input from the previous node\nconst { name } = $input;\n\nreturn { greeting: `Hello, ${name}!` };'
        }
        className="min-h-40 font-mono text-xs"
        rows={8}
      />
    </Field>
  )
}
