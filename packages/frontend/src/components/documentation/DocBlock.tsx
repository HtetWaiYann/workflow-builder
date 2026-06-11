import type { ReactNode } from 'react'
import type { ContentBlock, NodeCategory } from '@/types/docs'

const CATEGORY_VAR: Record<NodeCategory, string> = {
  Trigger: '--node-trigger',
  Action: '--node-action',
  Logic: '--node-logic',
  Transform: '--node-transform',
  Notify: '--node-notify',
}

/** Parses inline text with `code`, {var:text}, and **bold** markers into ReactNodes. */
function parseInline(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  const regex = /\*\*([^*]+)\*\*|\{var:([^}]+)\}|`([^`]+)`/g
  let lastIndex = 0
  let key = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    if (match[1] !== undefined) {
      parts.push(
        <strong key={key++} className="text-foreground font-medium">
          {match[1]}
        </strong>
      )
    } else if (match[2] !== undefined) {
      parts.push(
        <code
          key={key++}
          className="rounded border border-teal-200/60 bg-teal-50 px-1.5 py-0.5 font-mono text-sm text-teal-700 dark:border-teal-800/40 dark:bg-teal-950/40 dark:text-teal-400"
        >
          {match[2]}
        </code>
      )
    } else if (match[3] !== undefined) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
        >
          {match[3]}
        </code>
      )
    }
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

interface DocBlockProps {
  block: ContentBlock
}

/**
 * Renders a single documentation content block with consistent spacing.
 * Headings get extra top margin; code blocks get visible separation from text.
 */
export function DocBlock({ block }: DocBlockProps) {
  switch (block.type) {
    case 'text':
      return (
        <p className="text-muted-foreground mb-4 leading-relaxed">
          {parseInline(block.content)}
        </p>
      )

    case 'heading':
      return (
        <h3 className="text-foreground mt-8 mb-3 text-base font-semibold">
          {block.content}
        </h3>
      )

    case 'code-block': {
      const cls =
        block.variant === 'var'
          ? 'border border-teal-200/70 bg-teal-50 text-teal-800 dark:border-teal-800/40 dark:bg-teal-950/30 dark:text-teal-300'
          : 'border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700/50 dark:bg-slate-900/60 dark:text-slate-200'
      return (
        <pre
          className={`mt-2 mb-5 overflow-x-auto rounded-lg p-4 font-mono text-sm leading-relaxed ${cls}`}
        >
          <code>{block.content}</code>
        </pre>
      )
    }

    case 'note':
      return (
        <div className="bg-muted/30 text-muted-foreground mt-5 mb-5 rounded-lg border px-4 py-3 text-sm leading-relaxed">
          {parseInline(block.content)}
        </div>
      )

    case 'steps':
      return (
        <ol
          start={block.start}
          className="text-muted-foreground mb-5 list-outside list-decimal space-y-2.5 pl-5 text-sm"
        >
          {block.items.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {parseInline(item)}
            </li>
          ))}
        </ol>
      )

    case 'bullet-list':
      return (
        <ul className="text-muted-foreground mb-4 list-outside list-disc space-y-1.5 pl-5 text-sm">
          {block.items.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {parseInline(item)}
            </li>
          ))}
        </ul>
      )

    case 'table':
      return (
        <div className="mb-5 overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                {block.headers.map((h) => (
                  <th
                    key={h}
                    className="text-muted-foreground px-4 py-2.5 text-left font-medium first:w-1/4"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr
                  key={ri}
                  className={ri < block.rows.length - 1 ? 'border-b' : ''}
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`px-4 py-2.5 align-top ${
                        ci === 0
                          ? 'text-foreground font-medium'
                          : ci === 1 && block.headers.length > 2
                            ? 'text-muted-foreground font-mono text-xs'
                            : 'text-muted-foreground leading-relaxed'
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'fields-table': {
      const hasRequired = block.fields.some((f) => f.required)
      return (
        <div className="mb-5">
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
                {block.fields.map((field, i) => (
                  <tr
                    key={i}
                    className={i < block.fields.length - 1 ? 'border-b' : ''}
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
      )
    }

    case 'examples':
      return (
        <div className="mb-5 space-y-2">
          {block.items.map((ex, i) => (
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
      )

    case 'tips':
      return (
        <div className="bg-muted/40 mb-5 rounded-lg border px-4 py-3">
          <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
            Helpful tips
          </p>
          <ul className="list-outside list-disc space-y-1.5 pl-4">
            {block.items.map((tip, i) => (
              <li
                key={i}
                className="text-muted-foreground text-sm leading-relaxed"
              >
                {parseInline(tip)}
              </li>
            ))}
          </ul>
        </div>
      )

    case 'intro-cards':
      return (
        <div className="mt-2 mb-5 grid gap-4 sm:grid-cols-3">
          {block.cards.map(({ step, title, desc }) => (
            <div key={step} className="bg-card space-y-2 rounded-xl border p-4">
              <div className="bg-muted text-foreground flex size-7 items-center justify-center rounded-lg text-sm font-semibold">
                {step}
              </div>
              <p className="text-foreground text-sm font-medium">{title}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      )

    case 'node-header': {
      const cssVar = CATEGORY_VAR[block.category]
      return (
        <div className="mb-5 flex items-center">
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: `color-mix(in oklab, var(${cssVar}) 15%, transparent)`,
              color: `var(${cssVar})`,
            }}
          >
            {block.category}
          </span>
        </div>
      )
    }

    case 'env-vars-list':
      return (
        <div className="mt-1 mb-4 space-y-1 pl-5">
          {block.items.map(({ key, desc }) => (
            <div key={key} className="flex items-baseline gap-2">
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                {key}
              </code>
              <span className="text-muted-foreground/70 text-xs">{desc}</span>
            </div>
          ))}
        </div>
      )
  }
}
