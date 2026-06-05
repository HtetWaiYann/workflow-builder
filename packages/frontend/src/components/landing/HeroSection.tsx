import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WorkflowNodeCard } from '@/components/canvas/WorkflowNodeCard'
import { getNodeDefinition, ICON_MAP } from '@/lib/nodeRegistry'

function HeroCanvas() {
  const webhook = getNodeDefinition('webhook-trigger')
  const http = getNodeDefinition('http-request')
  const ifCond = getNodeDefinition('if-condition')
  const email = getNodeDefinition('send-email')

  return (
    <div className="relative h-[480px] w-full">
      {/* Node 0 — Webhook Trigger */}
      <div className="absolute top-[80px] left-0">
        <WorkflowNodeCard
          label={webhook.label}
          description={webhook.description}
          color={webhook.color}
          Icon={ICON_MAP[webhook.icon]}
          outputHandle
        />
      </div>

      {/* Node 1 — HTTP Request (selected) */}
      <div className="absolute top-[170px] left-[230px]">
        <WorkflowNodeCard
          label={http.label}
          description={http.description}
          color={http.color}
          Icon={ICON_MAP[http.icon]}
          borderColor={`${http.color}99`}
          inputHandle
          outputHandle
        />
      </div>

      {/* Node 2 — If Condition */}
      <div className="absolute top-[75px] left-[460px]">
        <WorkflowNodeCard
          label={ifCond.label}
          description={ifCond.description}
          color={ifCond.color}
          Icon={ICON_MAP[ifCond.icon]}
          borderColor={`${ifCond.color}99`}
          inputHandle
          outputHandle
        />
      </div>

      {/* Node 3 — Send Email */}
      <div className="absolute top-[335px] left-[200px]">
        <WorkflowNodeCard
          label={email.label}
          description={email.description}
          color={email.color}
          Icon={ICON_MAP[email.icon]}
          borderColor={`${email.color}99`}
          inputHandle
        />
      </div>

      {/* Bezier connections */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Webhook right → HTTP left */}
        <path
          d="M 220 112 C 225 112 225 202 230 202"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-border"
        />
        {/* HTTP right → If left */}
        <path
          d="M 450 202 C 455 202 455 107 460 107"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-border"
        />
        {/* If right → Email left (swooping) */}
        <path
          d="M 680 107 C 720 200 100 270 200 367"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-border"
        />
      </svg>

      <div className="to-background/60 pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent" />
      <div className="to-background/70 pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent" />
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-16">
      <div className="absolute inset-0 [background-image:radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:24px_24px] opacity-50" />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
        <div className="h-96 w-[900px] rounded-full bg-indigo-500/8 blur-3xl dark:bg-indigo-400/5" />
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center px-8 py-24 lg:grid-cols-[44%_56%]">
        <div className="mx-auto max-w-lg text-center lg:mx-0 lg:text-left">
          <h1 className="text-foreground mb-6 text-5xl leading-[1.05] font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Build powerful
            <br />
            <span className="text-foreground/40">workflows,</span>
            <br />
            <span className="text-[#f97316]">visually.</span>
          </h1>

          <p className="text-muted-foreground mb-10 text-lg leading-relaxed">
            Design, trigger, and automate multi-step workflows with a
            drag-and-drop canvas. Connect your tools and automate anything — no
            code required.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
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
        </div>

        <div className="hidden lg:block">
          <HeroCanvas />
        </div>
      </div>
    </section>
  )
}
