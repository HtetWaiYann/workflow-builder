import { ChevronRight, ChevronDown } from 'lucide-react'

const RUN_STEPS = [
  { color: 'bg-orange-500', label: 'Webhook Trigger', ms: '1ms' },
  { color: 'bg-blue-500', label: 'HTTP Request', ms: '68ms' },
  { color: 'bg-violet-500', label: 'If Condition', ms: '2ms' },
  { color: 'bg-amber-500', label: 'Send Email', ms: '51ms' },
]

function StepPill({
  color,
  label,
  ms,
}: {
  color: string
  label: string
  ms: string
}) {
  return (
    <div className="bg-card flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs shadow-sm">
      <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${color}`} />
      <span className="text-foreground font-medium">{label}</span>
      <span className="text-muted-foreground font-mono">{ms}</span>
    </div>
  )
}

export function RunStripSection() {
  return (
    <section className="bg-muted/30 border-y py-6">
      <div className="mx-auto max-w-5xl px-6">
        {/* Meta row */}
        <div className="mb-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          <span className="text-muted-foreground font-mono text-[10px] font-semibold tracking-widest uppercase">
            Last Run
          </span>
          <ChevronRight className="text-muted-foreground size-3" />
          <span className="text-muted-foreground text-xs">3 seconds ago</span>
          <ChevronRight className="text-muted-foreground size-3" />
          <span className="text-muted-foreground font-mono text-xs">312ms</span>
        </div>

        {/* Steps — horizontal on lg+, vertical on mobile/tablet */}
        <div className="flex flex-col items-center justify-center gap-1 lg:flex-row lg:gap-0">
          {RUN_STEPS.map((step, i) => (
            <div
              key={step.label}
              className="flex flex-col items-start lg:flex-row lg:items-center"
            >
              <StepPill color={step.color} label={step.label} ms={step.ms} />
              {i < RUN_STEPS.length - 1 && (
                <>
                  {/* Desktop: horizontal arrow */}
                  <div className="hidden items-center lg:flex">
                    <div className="bg-border h-px w-4" />
                    <svg
                      width="5"
                      height="8"
                      viewBox="0 0 5 8"
                      fill="none"
                      className="text-border"
                    >
                      <path
                        d="M1 1l3 3-3 3"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  {/* Mobile/tablet: vertical arrow */}
                  <ChevronDown className="text-border my-0.5 size-3 lg:hidden" />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
