import { WorkflowNodeCard } from '@/components/canvas/WorkflowNodeCard'
import { getNodeDefinition, ICON_MAP } from '@/lib/nodeRegistry'

const MOCK_TRIGGERS = [
  { label: 'Webhook trigger', detail: 'POST /hooks/order' },
  { label: 'Cron schedule', detail: 'Every 5 minutes' },
  { label: 'HTTP endpoint', detail: 'GET /api/run/:id' },
]

const MOCK_RUNS = [
  { id: '#1042', ok: true, duration: '142ms', ago: '3s ago' },
  { id: '#1041', ok: false, duration: '68ms', ago: '5m ago' },
  { id: '#1040', ok: true, duration: '210ms', ago: '10m ago' },
]

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2">
      {items.map((b) => (
        <li
          key={b}
          className="text-muted-foreground flex items-center gap-2 text-sm"
        >
          <div className="h-1 w-1 shrink-0 rounded-full bg-indigo-500" />
          {b}
        </li>
      ))}
    </ul>
  )
}

function NodeArrow() {
  return (
    <div className="flex shrink-0 items-center">
      <div className="bg-border h-px w-5" />
      <svg
        width="7"
        height="12"
        viewBox="0 0 7 12"
        fill="none"
        className="text-border shrink-0"
      >
        <path
          d="M1 1l5 5-5 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

function VisualEditorFeature() {
  const webhook = getNodeDefinition('webhook-trigger')
  const http = getNodeDefinition('http-request')

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-muted-foreground mb-4 font-mono text-[11px] font-semibold tracking-widest uppercase">
          #01 — Visual Editor
        </p>
        <h3 className="text-foreground mb-3 text-xl leading-snug font-bold">
          A canvas that thinks like a developer.
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Drag nodes onto an infinite canvas and wire them together. Each node
          is inspectable — click to see its live input, output, and execution
          time.
        </p>
        <BulletList
          items={[
            'Infinite canvas with minimap',
            'Branch on conditions',
            'Run single nodes or whole flows',
          ]}
        />
      </div>
      <div className="flex items-center overflow-x-auto py-2">
        <WorkflowNodeCard
          label={webhook.label}
          description={webhook.description}
          color={webhook.color}
          Icon={ICON_MAP[webhook.icon]}
          outputHandle
        />
        <NodeArrow />
        <WorkflowNodeCard
          label={http.label}
          description={http.description}
          color={http.color}
          Icon={ICON_MAP[http.icon]}
          inputHandle
          outputHandle
        />
      </div>
    </div>
  )
}

function TriggersFeature() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-muted-foreground mb-4 font-mono text-[11px] font-semibold tracking-widest uppercase">
          #02 — Triggers & Actions
        </p>
        <h3 className="text-foreground mb-3 text-xl leading-snug font-bold">
          React the moment events happen.
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Start workflows via webhooks, cron schedules, or inbound HTTP calls.
          Add HTTP Request nodes to hit any REST API — no SDK needed.
        </p>
        <BulletList
          items={[
            'Webhook, cron, and HTTP triggers',
            'HTTP Request to any REST API',
            'Pass data between nodes seamlessly',
          ]}
        />
      </div>
      <div>
        {MOCK_TRIGGERS.map((t) => (
          <div
            key={t.label}
            className="flex items-center gap-3 border-b py-3 last:border-b-0"
          >
            <div className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />
            <span className="text-foreground text-sm font-medium">
              {t.label}
            </span>
            <span className="text-muted-foreground ml-auto font-mono text-[11px]">
              {t.detail}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SmartLogicFeature() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-muted-foreground mb-4 font-mono text-[11px] font-semibold tracking-widest uppercase">
          #03 — Smart Logic
        </p>
        <h3 className="text-foreground mb-3 text-xl leading-snug font-bold">
          Branch, filter, and transform your data.
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Add If/Else and Switch nodes to route workflows based on live data.
          Use JavaScript code nodes for transforms that go beyond the built-in
          toolset.
        </p>
        <BulletList
          items={[
            'If/Else and Switch routing',
            'JavaScript code execution',
            "Full access to the previous node's output",
          ]}
        />
      </div>
    </div>
  )
}

function ExecutionLogsFeature() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-muted-foreground mb-4 font-mono text-[11px] font-semibold tracking-widest uppercase">
          #04 — Execution Logs
        </p>
        <h3 className="text-foreground mb-3 text-xl leading-snug font-bold">
          Every run is a full audit trail.
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Click any past run to replay it step by step. See exact input/output
          JSON, durations, and failure reasons per node.
        </p>
        <BulletList
          items={[
            'Per-node input and output JSON',
            'Duration and error details',
            'Full run history with filters',
          ]}
        />
      </div>
      <div className="overflow-hidden rounded-xl border">
        {MOCK_RUNS.map((run) => (
          <div
            key={run.id}
            className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0"
          >
            <span className="text-muted-foreground font-mono text-xs">
              {run.id}
            </span>
            <span
              className={`flex items-center gap-1.5 text-xs font-medium ${
                run.ok
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-500 dark:text-red-400'
              }`}
            >
              <div
                className={`h-1.5 w-1.5 rounded-full ${run.ok ? 'bg-green-500' : 'bg-red-500'}`}
              />
              {run.ok ? 'success' : 'error'}
            </span>
            <span className="text-muted-foreground ml-auto font-mono text-xs">
              {run.duration}
            </span>
            <span className="text-muted-foreground font-mono text-xs">
              {run.ago}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FeaturesSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-16 sm:grid-cols-2">
          <VisualEditorFeature />
          <TriggersFeature />
          <SmartLogicFeature />
          <ExecutionLogsFeature />
        </div>
      </div>
    </section>
  )
}
