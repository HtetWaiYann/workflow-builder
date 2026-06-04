import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Zap,
  MousePointerClick,
  GitBranch,
  Activity,
  Users,
  Lock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LandingNavbar } from '@/components/LandingNavbar'
import { TriggrLogo } from '@/components/TriggrLogo'

// ─── Canvas mockup ───────────────────────────────────────────────────────────

type NodeVariant = 'trigger' | 'action' | 'logic' | 'notify'

interface MockNodeData {
  variant: NodeVariant
  label: string
  subtitle: string
}

const MOCK_NODES: MockNodeData[] = [
  { variant: 'trigger', label: 'Webhook', subtitle: 'POST /hooks/order' },
  { variant: 'action', label: 'HTTP Request', subtitle: 'GET api.stripe.com' },
  { variant: 'logic', label: 'If Condition', subtitle: 'status === "paid"' },
  { variant: 'notify', label: 'Send Email', subtitle: 'team@example.com' },
]

const NODE_STYLES: Record<NodeVariant, { bar: string; badge: string }> = {
  trigger: {
    bar: 'bg-orange-500',
    badge:
      'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400',
  },
  action: {
    bar: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
  },
  logic: {
    bar: 'bg-violet-500',
    badge:
      'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400',
  },
  notify: {
    bar: 'bg-green-500',
    badge:
      'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400',
  },
}

function MockNode({ node }: { node: MockNodeData }) {
  const { bar, badge } = NODE_STYLES[node.variant]
  return (
    <div className="bg-card w-40 shrink-0 overflow-hidden rounded-xl border shadow-md">
      <div className={`h-1.5 ${bar}`} />
      <div className="p-3">
        <span
          className={`mb-2 inline-block rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide uppercase ${badge}`}
        >
          {node.variant}
        </span>
        <p className="text-foreground text-sm leading-snug font-semibold">
          {node.label}
        </p>
        <p className="text-muted-foreground mt-0.5 truncate font-mono text-[10px]">
          {node.subtitle}
        </p>
      </div>
    </div>
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

// ─── Features ─────────────────────────────────────────────────────────────────

interface Feature {
  Icon: LucideIcon
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    Icon: MousePointerClick,
    title: 'Visual Canvas',
    description:
      'Drag-and-drop workflow builder with a live canvas. Connect nodes intuitively without writing any code.',
  },
  {
    Icon: Zap,
    title: 'Powerful Triggers',
    description:
      'Start workflows via webhooks, cron schedules, or inbound HTTP requests. React the moment events happen.',
  },
  {
    Icon: GitBranch,
    title: 'Smart Logic',
    description:
      'Branch, filter, and transform data with If/Else, Switch, and JavaScript code execution nodes.',
  },
  {
    Icon: Activity,
    title: 'Live Monitoring',
    description:
      'Track every execution in real time. Full run history with per-node input, output, and error details.',
  },
  {
    Icon: Users,
    title: 'Team Workspaces',
    description:
      'Invite teammates, assign roles, and build automations together inside a shared workspace.',
  },
  {
    Icon: Lock,
    title: 'Secure by Default',
    description:
      'Credentials are encrypted at rest with AES-256-GCM. Secrets are never exposed to the frontend.',
  },
]

// ─── How it works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    step: '01',
    title: 'Design your workflow',
    description:
      'Open the canvas and drag nodes from the palette. Connect triggers, actions, and logic to build your automation flow.',
  },
  {
    step: '02',
    title: 'Configure and test',
    description:
      'Set up each node with your API keys, conditions, and code. Run it manually to verify everything works.',
  },
  {
    step: '03',
    title: 'Deploy and monitor',
    description:
      'Activate your workflow and watch it run. Review execution history, tweak settings, and iterate freely.',
  },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="bg-background min-h-screen">
      <LandingNavbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-16">
        {/* Indigo glow behind the headline */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-80 w-[800px] rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-400/6" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 py-24 text-center">
          {/* Badge */}
          <div className="bg-secondary text-secondary-foreground mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
            Workflow Automation Platform
          </div>

          {/* Headline */}
          <h1 className="text-foreground mb-6 text-5xl leading-tight font-bold tracking-tight sm:text-6xl">
            Build powerful workflows,
            <br />
            <span className="text-indigo-600 dark:text-indigo-400">
              visually.
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="text-muted-foreground mx-auto mb-10 max-w-xl text-lg">
            Design, trigger, and automate multi-step workflows with a
            drag-and-drop canvas. Connect your tools and automate anything — no
            code required.
          </p>

          {/* CTAs */}
          <div className="mb-20 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/register">
                Get started free
                <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </div>

          {/* Canvas mockup */}
          <div className="overflow-hidden rounded-2xl border shadow-xl">
            {/* Fake browser chrome */}
            <div className="bg-muted/60 flex items-center gap-2 border-b px-4 py-3">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
              <div className="bg-background/60 ml-3 h-5 w-44 rounded-md" />
            </div>

            {/* Node flow */}
            <div className="bg-muted/20 flex items-center justify-start gap-0 overflow-x-auto px-10 py-12 sm:justify-center">
              {MOCK_NODES.map((node, i) => (
                <div key={node.label} className="flex items-center">
                  <MockNode node={node} />
                  {i < MOCK_NODES.length - 1 && <NodeArrow />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-muted/20 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to automate at scale
            </h2>
            <p className="text-muted-foreground mx-auto max-w-lg">
              Triggr gives you the tools to build, manage, and monitor complex
              workflows without touching a single line of code.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ Icon, title, description }) => (
              <div
                key={title}
                className="bg-card rounded-xl border p-6 transition-shadow hover:shadow-md"
              >
                <div className="bg-secondary mb-4 flex size-10 items-center justify-center rounded-lg">
                  <Icon className="text-foreground size-5" />
                </div>
                <h3 className="text-foreground mb-2 font-semibold">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Up and running in minutes
            </h2>
            <p className="text-muted-foreground mx-auto max-w-lg">
              No complex setup. No infrastructure to manage. Just build and
              automate.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
            {STEPS.map(({ step, title, description }) => (
              <div key={step} className="flex flex-col gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl border-2 border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/40">
                  <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                    {step}
                  </span>
                </div>
                <h3 className="text-foreground font-semibold">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-muted/20 border-t py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to automate?
          </h2>
          <p className="text-muted-foreground mb-10">
            Join teams already using Triggr to save hours of manual work every
            week.
          </p>
          <Button size="lg" asChild>
            <Link to="/register">
              Create free account
              <ArrowRight className="ml-1.5 size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 sm:flex-row">
          <TriggrLogo iconSize={20} />
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Triggr. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
