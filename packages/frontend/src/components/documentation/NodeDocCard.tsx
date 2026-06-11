const CATEGORY_VAR: Record<
  'Trigger' | 'Action' | 'Logic' | 'Transform' | 'Notify',
  string
> = {
  Trigger: '--node-trigger',
  Action: '--node-action',
  Logic: '--node-logic',
  Transform: '--node-transform',
  Notify: '--node-notify',
}

interface NodeDocCardProps {
  id: string
  title: string
  category: 'Trigger' | 'Action' | 'Logic' | 'Transform' | 'Notify'
  description: string
  setupSteps?: string[]
  fields?: { name: string; required: boolean; description: string }[]
  examples?: { label: string; value: string }[]
  tips?: string[]
  visible?: boolean
}

export function NodeDocCard({
  id,
  title,
  category,
  description,
  setupSteps,
  fields,
  examples,
  tips,
  visible = false,
}: NodeDocCardProps) {
  const cssVar = CATEGORY_VAR[category]
  const hasRequired = fields?.some((f) => f.required) ?? false

  return (
    <div
      id={id}
      data-section=""
      className={`bg-card scroll-mt-4 space-y-5 rounded-xl border p-6 transition-all duration-500 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-foreground text-lg font-semibold">{title}</h3>
        <span
          className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: `color-mix(in oklab, var(${cssVar}) 15%, transparent)`,
            color: `var(${cssVar})`,
          }}
        >
          {category}
        </span>
      </div>

      {/* Description */}
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>

      {/* Setup Steps */}
      {setupSteps && setupSteps.length > 0 && (
        <div>
          <h4 className="text-foreground mb-2 text-sm font-medium">
            How to set up
          </h4>
          <ol className="list-outside list-decimal space-y-1.5 pl-5">
            {setupSteps.map((step, i) => (
              <li
                key={i}
                className="text-muted-foreground text-sm leading-relaxed"
              >
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Fields table */}
      {fields && fields.length > 0 && (
        <div>
          <h4 className="text-foreground mb-2 text-sm font-medium">
            Configuration fields
          </h4>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-muted-foreground w-1/3 px-4 py-2.5 text-left font-medium">
                    Field
                  </th>
                  <th className="text-muted-foreground px-4 py-2.5 text-left font-medium">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, i) => (
                  <tr
                    key={i}
                    className={i < fields.length - 1 ? 'border-b' : ''}
                  >
                    <td className="px-4 py-2.5 align-top">
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                        {field.name}
                      </code>
                      {field.required && (
                        <span className="text-destructive ml-1 text-xs">*</span>
                      )}
                    </td>
                    <td className="text-muted-foreground px-4 py-2.5 align-top text-sm leading-relaxed">
                      {field.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasRequired && (
            <p className="text-muted-foreground mt-1.5 text-xs">
              <span className="text-destructive">*</span> Required field
            </p>
          )}
        </div>
      )}

      {/* Examples */}
      {examples && examples.length > 0 && (
        <div>
          <h4 className="text-foreground mb-2 text-sm font-medium">Examples</h4>
          <div className="space-y-2">
            {examples.map((ex, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700/50 dark:bg-slate-900/60"
              >
                <p className="text-muted-foreground mb-1.5 text-xs font-medium">
                  {ex.label}
                </p>
                <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                  {ex.value}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      {tips && tips.length > 0 && (
        <div className="bg-muted/40 rounded-lg border px-4 py-3">
          <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
            Helpful tips
          </p>
          <ul className="list-outside list-disc space-y-1.5 pl-4">
            {tips.map((tip, i) => (
              <li
                key={i}
                className="text-muted-foreground text-sm leading-relaxed"
              >
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
