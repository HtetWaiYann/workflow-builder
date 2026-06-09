import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Navbar } from '@/components/Navbar'
import { DocsSidebar } from '@/components/documentation/DocsSidebar'
import { NodeDocCard } from '@/components/documentation/NodeDocCard'

function Code({
  children,
  variant = 'default',
}: {
  children: string
  variant?: 'default' | 'var'
}) {
  if (variant === 'var') {
    return (
      <code className="rounded border border-teal-200/60 bg-teal-50 px-1.5 py-0.5 font-mono text-sm text-teal-700 dark:border-teal-800/40 dark:bg-teal-950/40 dark:text-teal-400">
        {children}
      </code>
    )
  }
  return (
    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
      {children}
    </code>
  )
}

function CodeBlock({
  children,
  variant = 'default',
}: {
  children: string
  variant?: 'default' | 'var'
}) {
  const cls =
    variant === 'var'
      ? 'border border-teal-200/70 bg-teal-50 text-teal-800 dark:border-teal-800/40 dark:bg-teal-950/30 dark:text-teal-300'
      : 'border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700/50 dark:bg-slate-900/60 dark:text-slate-200'
  return (
    <pre
      className={`overflow-x-auto rounded-lg p-4 font-mono text-sm leading-relaxed ${cls}`}
    >
      <code>{children}</code>
    </pre>
  )
}

interface DocSectionProps {
  id: string
  title: string
  visible: boolean
  children: ReactNode
}

function DocSection({ id, title, visible, children }: DocSectionProps) {
  return (
    <section
      id={id}
      data-section=""
      className={`scroll-mt-4 transition-all duration-500 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <h2 className="text-foreground mb-1 text-3xl font-bold tracking-tight">
        {title}
      </h2>
      <div className="mt-6 space-y-4">{children}</div>
    </section>
  )
}

function NodeGroupHeading({ children }: { children: string }) {
  return (
    <p className="text-muted-foreground/50 pt-4 pb-1 text-xs font-semibold tracking-widest uppercase">
      {children}
    </p>
  )
}

function InfoBox({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted/30 text-muted-foreground rounded-lg border px-4 py-3 text-sm leading-relaxed">
      {children}
    </div>
  )
}

export function DocsPage() {
  const [activeId, setActiveId] = useState(
    () => window.location.hash.slice(1) || 'introduction'
  )
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const mainRef = useRef<HTMLElement>(null)

  // Restore scroll position from URL hash on page load
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash) return
    const timer = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ block: 'start' })
    }, 80)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const main = mainRef.current
    if (!main) return

    const sections = main.querySelectorAll<HTMLElement>('[data-section]')

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => {
              const next = new Set(prev)
              next.add(entry.target.id)
              return next
            })
          }
        }
      },
      { root: main, threshold: 0 }
    )

    const activeObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { root: main, rootMargin: '-5% 0px -70% 0px', threshold: 0 }
    )

    sections.forEach((s) => {
      revealObserver.observe(s)
      activeObserver.observe(s)
    })

    return () => {
      revealObserver.disconnect()
      activeObserver.disconnect()
    }
  }, [])

  function handleSelect(id: string) {
    setActiveId(id)
    window.history.replaceState(null, '', `/docs#${id}`)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const vis = (id: string) => visibleSections.has(id)

  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden pt-16">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r px-3 py-6 lg:flex">
          <DocsSidebar activeId={activeId} onSelect={handleSelect} />
        </aside>

        {/* Main content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto">
          {/* Mobile jump nav */}
          <div className="bg-background/95 sticky top-0 z-10 flex gap-2 overflow-x-auto border-b px-4 py-2.5 backdrop-blur-sm lg:hidden">
            {[
              { label: 'Getting Started', id: 'introduction' },
              { label: 'Your Workspace', id: 'workspaces' },
              { label: 'Node Reference', id: 'manual-trigger' },
            ].map(({ label, id }) => (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                className="bg-muted text-muted-foreground hover:bg-accent hover:text-foreground shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mx-auto max-w-3xl space-y-16 px-6 py-10 lg:px-8">
            {/* ── Introduction ─────────────────────────────────── */}
            <DocSection
              id="introduction"
              title="Introduction"
              visible={vis('introduction')}
            >
              <p className="text-muted-foreground leading-relaxed">
                Triggr is a visual workflow automation platform. You build
                automations by placing nodes on a canvas and connecting them —
                no coding required for most tasks. Think of it like drawing a
                flowchart where each box actually does something: fetches data,
                sends a message, makes a decision, or runs a piece of code.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Workflows start when a trigger fires — on a schedule, when a
                webhook receives a request, or when you click Run. Data flows
                from node to node, and each step transforms or acts on what came
                before.
              </p>

              <div className="mt-2 grid gap-4 sm:grid-cols-3">
                {[
                  {
                    step: '1',
                    title: 'Choose a trigger',
                    desc: 'Decide what starts your workflow — a schedule, an incoming webhook, or a manual click.',
                  },
                  {
                    step: '2',
                    title: 'Add nodes',
                    desc: 'Drag actions, logic, transforms, and notifications onto the canvas and connect them.',
                  },
                  {
                    step: '3',
                    title: 'Run and monitor',
                    desc: 'Activate your workflow and track every execution in the history panel.',
                  },
                ].map(({ step, title, desc }) => (
                  <div
                    key={step}
                    className="bg-card space-y-2 rounded-xl border p-4"
                  >
                    <div className="bg-muted text-foreground flex size-7 items-center justify-center rounded-lg text-sm font-semibold">
                      {step}
                    </div>
                    <p className="text-foreground text-sm font-medium">
                      {title}
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </DocSection>

            {/* ── Technology Stack ─────────────────────────────── */}
            <DocSection
              id="tech-stack"
              title="Technology Stack"
              visible={vis('tech-stack')}
            >
              <p className="text-muted-foreground leading-relaxed">
                For those curious about what runs under the hood, here is a
                complete overview of the technologies powering Triggr.
              </p>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-muted-foreground w-1/4 px-4 py-2.5 text-left font-medium">
                        Layer
                      </th>
                      <th className="text-muted-foreground w-1/3 px-4 py-2.5 text-left font-medium">
                        Technology
                      </th>
                      <th className="text-muted-foreground px-4 py-2.5 text-left font-medium">
                        Purpose
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        [
                          'Frontend',
                          'React 19 + TypeScript',
                          'The visual interface and canvas editor',
                        ],
                        [
                          'Canvas',
                          'React Flow',
                          'Drag-and-drop node-based workflow editor',
                        ],
                        [
                          'Styling',
                          'Tailwind CSS + shadcn/ui',
                          'Utility-first styling and component library',
                        ],
                        [
                          'Backend',
                          'Node.js 24 + Express 4',
                          'REST API server and business logic',
                        ],
                        [
                          'Database',
                          'PostgreSQL + Prisma',
                          'Persistent data storage with type-safe queries',
                        ],
                        [
                          'Queue',
                          'BullMQ + Redis',
                          'Background job processing and scheduled runs',
                        ],
                        [
                          'Auth',
                          'JWT via httpOnly cookies',
                          'Secure sessions without exposing tokens to JavaScript',
                        ],
                        [
                          'Code sandbox',
                          'isolated-vm',
                          'Safe execution of user-supplied JavaScript',
                        ],
                      ] as const
                    ).map(([layer, tech, purpose], i, arr) => (
                      <tr
                        key={layer}
                        className={i < arr.length - 1 ? 'border-b' : ''}
                      >
                        <td className="text-foreground px-4 py-2.5 font-medium">
                          {layer}
                        </td>
                        <td className="text-muted-foreground px-4 py-2.5 font-mono text-xs">
                          {tech}
                        </td>
                        <td className="text-muted-foreground px-4 py-2.5">
                          {purpose}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DocSection>

            {/* ── Local Setup ──────────────────────────────────── */}
            <DocSection
              id="local-setup"
              title="Local Setup"
              visible={vis('local-setup')}
            >
              <p className="text-muted-foreground leading-relaxed">
                Follow these steps to run Triggr on your own machine for
                development or testing.
              </p>
              <div>
                <p className="text-foreground mb-2 text-sm font-medium">
                  Prerequisites
                </p>
                <ul className="text-muted-foreground list-outside list-disc space-y-1 pl-5 text-sm">
                  <li>
                    Node.js version 24 or higher — check with{' '}
                    <Code>node --version</Code>
                  </li>
                  <li>PostgreSQL running locally (any recent version)</li>
                  <li>Redis running locally, typically on port 6379</li>
                </ul>
              </div>
              <div>
                <p className="text-foreground mb-2 text-sm font-medium">
                  Steps
                </p>
                <ol className="text-muted-foreground list-outside list-decimal space-y-3 pl-5 text-sm">
                  <li className="leading-relaxed">
                    Clone the repository, then run <Code>npm install</Code> in
                    the root folder to install all dependencies.
                  </li>
                  <li className="leading-relaxed">
                    Inside <Code>packages/backend/</Code>, create a{' '}
                    <Code>.env</Code> file. You can copy{' '}
                    <Code>.env.example</Code> as a starting point.
                  </li>
                  <li className="leading-relaxed">
                    Fill in <Code>DATABASE_URL</Code> with your PostgreSQL
                    connection string:
                    <CodeBlock>
                      postgresql://user:password@localhost:5432/triggr
                    </CodeBlock>
                  </li>
                  <li className="leading-relaxed">
                    Set <Code>REDIS_URL</Code> (usually{' '}
                    <Code>redis://localhost:6379</Code>).
                  </li>
                  <li className="leading-relaxed">
                    Set <Code>JWT_SECRET</Code> to any random string of at least
                    32 characters.
                  </li>
                  <li className="leading-relaxed">
                    Set <Code>ENCRYPTION_KEY</Code> to a random string of
                    exactly 32 characters. This is used to encrypt stored
                    secrets.
                  </li>
                  <li className="leading-relaxed">
                    Run <Code>npm run build:shared</Code> to compile the shared
                    package. You must do this before the first run and after any
                    changes to the shared package.
                  </li>
                  <li className="leading-relaxed">
                    Run <Code>npm run db:migrate</Code> to create the database
                    tables.
                  </li>
                  <li className="leading-relaxed">
                    Open two terminals. In the first, run{' '}
                    <Code>npm run dev:backend</Code>. In the second, run{' '}
                    <Code>npm run dev:frontend</Code>.
                  </li>
                  <li className="leading-relaxed">
                    Open <Code>http://localhost:5173</Code> in your browser.
                  </li>
                </ol>
              </div>
            </DocSection>

            {/* ── Server Deployment ────────────────────────────── */}
            <DocSection
              id="deployment"
              title="Server Deployment"
              visible={vis('deployment')}
            >
              <p className="text-muted-foreground leading-relaxed">
                To deploy Triggr on your own server, you will need Node.js 24 or
                higher, PostgreSQL, and Redis available on the host.
              </p>
              <ol className="text-muted-foreground list-outside list-decimal space-y-3 pl-5 text-sm">
                <li className="leading-relaxed">
                  Before building, set the environment variable{' '}
                  <Code>VITE_API_URL</Code> to your backend's public URL (e.g.{' '}
                  <Code>https://api.yourdomain.com</Code>).
                </li>
                <li className="leading-relaxed">
                  Run <Code>npm run build</Code> to produce production bundles
                  for both the frontend and backend.
                </li>
                <li className="leading-relaxed">
                  Set the following environment variables on your server:
                  <div className="mt-2 space-y-1">
                    {[
                      ['DATABASE_URL', 'PostgreSQL connection string'],
                      ['REDIS_URL', 'Redis connection string'],
                      ['JWT_SECRET', 'At least 32 random characters'],
                      ['ENCRYPTION_KEY', 'Exactly 32 characters'],
                      ['NODE_ENV', 'Set to production'],
                    ].map(([key, desc]) => (
                      <div key={key} className="flex items-baseline gap-2">
                        <Code>{key}</Code>
                        <span className="text-muted-foreground/70 text-xs">
                          {desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </li>
                <li className="leading-relaxed">
                  Run <Code>npm run db:migrate</Code> to apply database
                  migrations.
                </li>
                <li className="leading-relaxed">
                  Start the API server:
                  <CodeBlock>node packages/backend/dist/index.js</CodeBlock>
                </li>
                <li className="leading-relaxed">
                  Start the background worker (handles scheduled runs and queue
                  processing):
                  <CodeBlock>node packages/backend/dist/worker.js</CodeBlock>
                </li>
                <li className="leading-relaxed">
                  Serve the <Code>packages/frontend/dist/</Code> folder using
                  nginx, Caddy, or any static file server. Configure it to proxy{' '}
                  <Code>/api/*</Code> requests to the backend.
                </li>
              </ol>
            </DocSection>

            {/* ── Workspaces ───────────────────────────────────── */}
            <DocSection
              id="workspaces"
              title="Workspaces"
              visible={vis('workspaces')}
            >
              <p className="text-muted-foreground leading-relaxed">
                A workspace is your private space inside Triggr. All your
                workflows, team members, and environment variables belong to a
                workspace. You can have multiple workspaces to keep different
                projects or clients separate.
              </p>
              <div>
                <p className="text-foreground mb-2 text-sm font-medium">
                  Creating a workspace
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  When you sign up, a default workspace is created for you
                  automatically. To create additional workspaces, click the
                  workspace name in the top-left corner of the app and select{' '}
                  <strong className="text-foreground font-medium">
                    New workspace
                  </strong>
                  .
                </p>
              </div>
              <div>
                <p className="text-foreground mb-2 text-sm font-medium">
                  Renaming a workspace
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Go to{' '}
                  <strong className="text-foreground font-medium">
                    Workspace Settings
                  </strong>{' '}
                  (found in the top-left dropdown). The rename option is
                  available to workspace Owners only.
                </p>
              </div>
              <div>
                <p className="text-foreground mb-2 text-sm font-medium">
                  Switching workspaces
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Click the workspace name in the top-left corner of any page to
                  open the workspace switcher. All workspaces you belong to are
                  listed there.
                </p>
              </div>
            </DocSection>

            {/* ── Members & Roles ──────────────────────────────── */}
            <DocSection
              id="members-roles"
              title="Members & Roles"
              visible={vis('members-roles')}
            >
              <p className="text-muted-foreground leading-relaxed">
                Each workspace has members with one of three roles. Roles
                determine what each member can see and do.
              </p>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-muted-foreground w-1/4 px-4 py-2.5 text-left font-medium">
                        Role
                      </th>
                      <th className="text-muted-foreground px-4 py-2.5 text-left font-medium">
                        What they can do
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        [
                          'Owner',
                          'Full access to everything. Can invite and remove members, assign roles, rename the workspace, and create or delete environment variables. The person who creates a workspace starts as its Owner.',
                        ],
                        [
                          'Editor',
                          'Can create, edit, and delete workflows. Can view all members. Cannot manage workspace settings, invite members, or modify environment variables.',
                        ],
                        [
                          'Viewer',
                          'Read-only access. Can view workflows and their run history. Cannot create, edit, or delete anything.',
                        ],
                      ] as const
                    ).map(([role, perms], i, arr) => (
                      <tr
                        key={role}
                        className={i < arr.length - 1 ? 'border-b' : ''}
                      >
                        <td className="text-foreground px-4 py-3 align-top font-medium">
                          {role}
                        </td>
                        <td className="text-muted-foreground px-4 py-3 leading-relaxed">
                          {perms}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <InfoBox>
                You cannot remove or demote the last Owner of a workspace. At
                least one Owner must remain at all times.
              </InfoBox>
            </DocSection>

            {/* ── Invitations ──────────────────────────────────── */}
            <DocSection
              id="invitations"
              title="Invitations"
              visible={vis('invitations')}
            >
              <p className="text-muted-foreground leading-relaxed">
                Workspace Owners can invite other people by email. Here is how
                the invitation process works from start to finish.
              </p>
              <ol className="text-muted-foreground list-outside list-decimal space-y-2.5 pl-5 text-sm">
                <li className="leading-relaxed">
                  Open{' '}
                  <strong className="text-foreground font-medium">
                    Workspace Settings
                  </strong>{' '}
                  from the top-left dropdown and go to the{' '}
                  <strong className="text-foreground font-medium">
                    Members
                  </strong>{' '}
                  tab.
                </li>
                <li className="leading-relaxed">
                  Click{' '}
                  <strong className="text-foreground font-medium">
                    Invite Member
                  </strong>
                  , enter the person's email address, and choose their role
                  (Editor or Viewer).
                </li>
                <li className="leading-relaxed">
                  Click{' '}
                  <strong className="text-foreground font-medium">
                    Send Invite
                  </strong>
                  . The person receives an email with a unique link.
                </li>
                <li className="leading-relaxed">
                  They click the link, log in or register if needed, and accept
                  the invitation on the page that opens.
                </li>
                <li className="leading-relaxed">
                  Once they accept, they appear in your Members list and have
                  access to the workspace.
                </li>
              </ol>
              <InfoBox>
                Invitation links expire after 7 days. The recipient must sign in
                with the exact email address the invite was sent to. If an
                invite expires or gets lost, you can resend it from the Members
                tab.
              </InfoBox>
            </DocSection>

            {/* ── Environment Variables ────────────────────────── */}
            <DocSection
              id="env-variables"
              title="Environment Variables"
              visible={vis('env-variables')}
            >
              <p className="text-muted-foreground leading-relaxed">
                Environment Variables let you store sensitive values — like API
                keys, passwords, and webhook URLs — securely inside your
                workspace. Values are encrypted at rest and are never exposed to
                the browser after saving. Use them in node configuration fields
                instead of pasting credentials directly.
              </p>
              <div>
                <p className="text-foreground mb-2 text-sm font-medium">
                  How to create a variable
                </p>
                <ol className="text-muted-foreground list-outside list-decimal space-y-2 pl-5 text-sm">
                  <li className="leading-relaxed">
                    Go to{' '}
                    <strong className="text-foreground font-medium">
                      Environment Variables
                    </strong>{' '}
                    from the top-right dropdown menu.
                  </li>
                  <li className="leading-relaxed">
                    Click{' '}
                    <strong className="text-foreground font-medium">
                      New Variable
                    </strong>
                    .
                  </li>
                  <li className="leading-relaxed">
                    Enter a key name using uppercase letters, numbers, and
                    underscores only. Examples: <Code>SLACK_WEBHOOK</Code>,{' '}
                    <Code>SENDGRID_KEY</Code>, <Code>SMTP_PASSWORD</Code>.
                  </li>
                  <li className="leading-relaxed">Enter the value and save.</li>
                </ol>
              </div>
              <div>
                <p className="text-foreground mb-2 text-sm font-medium">
                  Using a variable in a node
                </p>
                <p className="text-muted-foreground mb-2 text-sm leading-relaxed">
                  In any node configuration field, type the variable's key
                  wrapped in double curly braces with{' '}
                  <Code variant="var">$vars.</Code> prefix:
                </p>
                <CodeBlock variant="var">
                  {'{{ $vars.SLACK_WEBHOOK }}'}
                </CodeBlock>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  When the workflow runs, the placeholder is replaced with the
                  stored value automatically.
                </p>
              </div>
              <InfoBox>
                Only workspace Owners can create, edit, or delete environment
                variables. Editors and Viewers can reference them in workflows
                but cannot view or change the stored values.
              </InfoBox>
            </DocSection>

            {/* ── Node Reference header ────────────────────────── */}
            <div className="border-t pt-10">
              <h2 className="text-foreground text-3xl font-bold">
                Node Reference
              </h2>
              <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                Every workflow is built from nodes. This reference covers all
                available node types — their purpose, configuration fields,
                step-by-step setup, and practical examples.
              </p>
            </div>

            {/* ── Trigger nodes ────────────────────────────────── */}
            <div className="space-y-5">
              <NodeGroupHeading>Triggers</NodeGroupHeading>

              <NodeDocCard
                id="manual-trigger"
                title="Manual Trigger"
                category="Trigger"
                visible={vis('manual-trigger')}
                description="Starts your workflow immediately when you click the Run button on the canvas. No configuration is needed. Use this while building and testing, or for workflows you want to start on demand."
                fields={[]}
                examples={[
                  {
                    label: 'On-demand run',
                    value:
                      'Click the Run button in the canvas toolbar at the top of the screen.\nThe workflow starts from this node and flows through all connected nodes.',
                  },
                ]}
                tips={[
                  'Great for testing your workflow while building it. Switch to a Webhook or Schedule trigger later when you are ready to automate.',
                ]}
              />

              <NodeDocCard
                id="webhook-trigger"
                title="Webhook Trigger"
                category="Trigger"
                visible={vis('webhook-trigger')}
                description="Listens for an incoming HTTP request and starts your workflow when one arrives. Configure the URL path and HTTP method, then paste the generated webhook URL into the service that will call it. The request body becomes the data passed to downstream nodes."
                setupSteps={[
                  'Choose the HTTP method your sending service will use — POST is the most common choice for webhooks.',
                  'Enter a unique URL path such as /new-order or /github/push. It must start with a forward slash.',
                  'Save the node — the full webhook URL appears in the configuration panel. Copy it.',
                  'Paste the webhook URL into the service that will send requests to it (e.g. Stripe, GitHub, Shopify).',
                  'Optional: enable the HMAC signature secret and copy it into the sending service to verify that requests are authentic.',
                ]}
                fields={[
                  {
                    name: 'Method',
                    required: true,
                    description:
                      'The HTTP method to accept: GET, POST, PUT, PATCH, or DELETE. Most webhook senders use POST.',
                  },
                  {
                    name: 'Path',
                    required: true,
                    description:
                      'The URL path for this webhook, e.g. /orders or /stripe/events. Must start with /.',
                  },
                ]}
                examples={[
                  {
                    label: 'Receive new orders',
                    value: 'Method: POST\nPath: /new-order',
                  },
                  {
                    label: 'GitHub push notifications',
                    value: 'Method: POST\nPath: /github/push',
                  },
                ]}
                tips={[
                  'The complete webhook URL (e.g. https://yourdomain.com/webhooks/new-order) is shown in the node config panel after saving.',
                  'Most third-party services have a Webhooks section in their settings where you paste the URL.',
                  'Enable the HMAC secret if your sending service supports it — this prevents fake requests from triggering your workflow.',
                ]}
              />

              <NodeDocCard
                id="cron-trigger"
                title="Schedule Trigger"
                category="Trigger"
                visible={vis('cron-trigger')}
                description="Runs your workflow automatically on a repeating schedule. You define the schedule using a cron expression — a compact format that describes times and intervals precisely. The workflow fires at each scheduled time without any manual action."
                setupSteps={[
                  'Enter a cron expression in the Schedule field. It has 5 space-separated parts: minute, hour, day-of-month, month, day-of-week.',
                  'Use * in any part to mean every. For example, * in the minute field means every minute.',
                  'Not sure what to write? Visit crontab.guru in your browser — it is a free tool that lets you build and preview cron expressions in plain English.',
                  'Save and activate the workflow. It will run automatically at the next scheduled time.',
                ]}
                fields={[
                  {
                    name: 'Schedule',
                    required: true,
                    description:
                      'A cron expression with 5 fields: minute (0–59), hour (0–23), day-of-month (1–31), month (1–12), day-of-week (0–7, where 0 and 7 both mean Sunday).',
                  },
                ]}
                examples={[
                  { label: 'Every day at 9:00 AM', value: '0 9 * * *' },
                  {
                    label: 'Weekdays at 9:00 AM (Mon–Fri)',
                    value: '0 9 * * 1-5',
                  },
                  { label: 'Every hour on the hour', value: '0 * * * *' },
                  {
                    label: 'First day of each month at midnight',
                    value: '0 0 1 * *',
                  },
                  { label: 'Every 15 minutes', value: '*/15 * * * *' },
                ]}
                tips={[
                  'crontab.guru is the easiest way to build cron expressions — type your schedule and see it explained in plain English.',
                  'The workflow runs in the server timezone. Account for any timezone offset when setting your schedule.',
                ]}
              />
            </div>

            {/* ── Action nodes ─────────────────────────────────── */}
            <div className="space-y-5">
              <NodeGroupHeading>Actions</NodeGroupHeading>

              <NodeDocCard
                id="http-request"
                title="HTTP Request"
                category="Action"
                visible={vis('http-request')}
                description="Sends an HTTP request to any URL and makes the response available to the next node. Use it to call external APIs, fetch data from a REST endpoint, or push data to a service that accepts HTTP requests."
                setupSteps={[
                  'Enter the full URL of the API endpoint you want to call. It must start with https://.',
                  'Choose the HTTP method: GET to read data, POST to create, PUT or PATCH to update, DELETE to remove.',
                  'For POST, PUT, or PATCH requests, add a JSON body with the data you want to send.',
                  'Add any required headers in the Headers field as a JSON object. Most APIs require an Authorization header.',
                  'The response status code, headers, and body are all passed to the next node as output.',
                ]}
                fields={[
                  {
                    name: 'URL',
                    required: true,
                    description:
                      'The full endpoint URL, starting with https://. Example: https://api.example.com/users',
                  },
                  {
                    name: 'Method',
                    required: true,
                    description:
                      'The HTTP method: GET, POST, PUT, PATCH, or DELETE.',
                  },
                  {
                    name: 'Headers',
                    required: false,
                    description:
                      'Request headers as a JSON object. Example: {"Authorization": "Bearer your-token"}',
                  },
                  {
                    name: 'Body',
                    required: false,
                    description:
                      'Request body as a JSON object. Applies to POST, PUT, and PATCH only. Example: {"status": "active"}',
                  },
                ]}
                examples={[
                  {
                    label: 'Fetch a user from an API',
                    value:
                      'URL: https://api.example.com/users/123\nMethod: GET\nHeaders: {"Authorization": "Bearer my-token"}',
                  },
                  {
                    label: 'Create a record',
                    value:
                      'URL: https://api.example.com/orders\nMethod: POST\nBody: {"product": "Widget", "qty": 2}',
                  },
                ]}
                tips={[
                  'Store your API key as an Environment Variable (e.g. {{ $vars.API_KEY }}) and reference it in the Headers field.',
                  'The response body is available to the next node. If the API returns JSON, access each field as body.fieldName.',
                  'Use an If Condition node after this one to branch based on the response status code.',
                ]}
              />

              <NodeDocCard
                id="run-js-code"
                title="Run JavaScript"
                category="Action"
                visible={vis('run-js-code')}
                description="Runs a custom JavaScript function in a secure, isolated environment. Use it when you need logic that the other nodes do not cover — calculating values, transforming data structures, formatting text, or making decisions based on complex conditions. The code cannot access the internet, your file system, or any Node.js-specific APIs."
                setupSteps={[
                  'Write your JavaScript code in the Code field.',
                  'Access data from the previous node using the $input variable. For example, $input.userId gives you the userId field.',
                  'Your code must end with a return statement that returns a plain object. Example: return { total: $input.price * 1.1 }.',
                  'The object you return becomes the data passed to the next node.',
                  'Run the workflow and check the execution log to verify what your code returned.',
                ]}
                fields={[
                  {
                    name: 'Code',
                    required: true,
                    description:
                      "JavaScript code to execute. Must end with return { ... }. Has access to $input (the previous node's output). Common built-ins like Math, JSON, Date, and Array methods all work.",
                  },
                ]}
                examples={[
                  {
                    label: 'Calculate a total with tax',
                    value:
                      'const taxRate = 0.2\nconst total = $input.price * (1 + taxRate)\nreturn { total, taxRate }',
                  },
                  {
                    label: 'Format a full name',
                    value:
                      'const full = `${$input.firstName} ${$input.lastName}`\nreturn { fullName: full.trim() }',
                  },
                  {
                    label: 'Check if a list is empty',
                    value:
                      'return { isEmpty: $input.items.length === 0, count: $input.items.length }',
                  },
                ]}
                tips={[
                  'Code runs in a sandbox with a 5-second time limit and 128 MB memory. Keep it fast and focused.',
                  'Always return a plain object — returning null, an array, or a string will cause the node to fail.',
                  'Common JavaScript built-ins like Math, JSON, Date, and Array methods all work normally inside the sandbox.',
                ]}
              />
            </div>

            {/* ── Logic nodes ──────────────────────────────────── */}
            <div className="space-y-5">
              <NodeGroupHeading>Logic</NodeGroupHeading>

              <NodeDocCard
                id="if-condition"
                title="If Condition"
                category="Logic"
                visible={vis('if-condition')}
                description="Checks a condition and routes your workflow down one of two paths — True or False. Connect different nodes to each output handle on the canvas. Only the branch that matches the condition continues running."
                setupSteps={[
                  'In the Field field, type the name of the data field you want to check. Use dot notation for nested data (e.g. order.status or user.age).',
                  'Choose an operator from the dropdown.',
                  'Enter the value to compare against in the Value field.',
                  'On the canvas, connect nodes to the True output handle and the False output handle.',
                  'When the workflow runs, it follows only the matching branch.',
                ]}
                fields={[
                  {
                    name: 'Field',
                    required: true,
                    description:
                      'The data field to check. Use dot notation for nested fields: status, user.age, order.items.length.',
                  },
                  {
                    name: 'Operator',
                    required: true,
                    description:
                      'How to compare: == (equals), != (not equals), > (greater than), < (less than), >= (at least), <= (at most), contains (text includes value), not contains (text excludes value).',
                  },
                  {
                    name: 'Value',
                    required: true,
                    description:
                      'The value to compare against. Enter text for string comparisons, a number for numeric comparisons.',
                  },
                ]}
                examples={[
                  {
                    label: 'Check if an order is paid',
                    value: 'Field: order.status\nOperator: ==\nValue: paid',
                  },
                  {
                    label: 'Check if age is 18 or over',
                    value: 'Field: user.age\nOperator: >=\nValue: 18',
                  },
                  {
                    label: 'Check if email matches a domain',
                    value:
                      'Field: user.email\nOperator: contains\nValue: @company.com',
                  },
                ]}
                tips={[
                  'Use a Merge node after a branch to bring both paths back together when they should continue as one.',
                  'Chain multiple If Condition nodes for multi-step decision logic.',
                ]}
              />

              <NodeDocCard
                id="switch"
                title="Switch"
                category="Logic"
                visible={vis('switch')}
                description="Routes your workflow to one of several branches based on the value of a field. Like a multi-way If — each case is a possible value, and the workflow takes the matching branch. A Default branch handles any value that does not match a case."
                setupSteps={[
                  'In the Field field, enter the name of the data field whose value you want to match (e.g. order.status).',
                  'Click Add Case for each possible value you want to handle. Give each case a label (for display on the canvas) and the exact value it should match.',
                  'On the canvas, connect a different node to each case output handle.',
                  'Connect a node to the Default handle to handle values not covered by your cases.',
                  'Activate and run the workflow — it routes to the case whose value matches the field.',
                ]}
                fields={[
                  {
                    name: 'Field',
                    required: true,
                    description:
                      'The data field to match. Example: order.status, payment.method.',
                  },
                  {
                    name: 'Cases',
                    required: true,
                    description:
                      'A list of cases. Each case has a Value (exact match, e.g. pending) and a Label (shown as the handle name on the canvas).',
                  },
                ]}
                examples={[
                  {
                    label: 'Route by order status',
                    value:
                      'Field: order.status\n\nCases:\n  Value: pending  →  Label: Pending Order\n  Value: paid     →  Label: Paid Order\n  Value: cancelled →  Label: Cancelled\n\nDefault: unrecognised status',
                  },
                ]}
                tips={[
                  'The Default branch is always present — use it to handle unexpected values or edge cases.',
                  'Unlike If Condition, Switch only routes — all fields from the previous node pass through unchanged.',
                ]}
              />

              <NodeDocCard
                id="merge"
                title="Merge"
                category="Logic"
                visible={vis('merge')}
                description="Waits for all connected upstream branches to finish, then combines their outputs into a single object and passes it to the next node. Use it after an If Condition or Switch node to bring multiple branches back together."
                setupSteps={[
                  'Place this node on the canvas at the point where your branches should reunite.',
                  'Connect the output of each branch to an input handle of this node. New input handles appear as you connect more.',
                  'No configuration needed — the node waits for all connected inputs before continuing.',
                  'The next node receives a merged object containing all fields from all branches.',
                ]}
                fields={[]}
                examples={[
                  {
                    label: 'Reunite after an If Condition',
                    value:
                      'True branch  → Send Slack message → Merge\nFalse branch → Send email       → Merge\n\nThe node after Merge receives the combined data\nfrom whichever branch ran.',
                  },
                ]}
                tips={[
                  "If only one branch ran (e.g. only the True path fired), Merge still works — it just passes that branch's data through.",
                  'Merge does a shallow merge. If two branches set the same field name, the last one wins.',
                ]}
              />
            </div>

            {/* ── Transform nodes ──────────────────────────────── */}
            <div className="space-y-5">
              <NodeGroupHeading>Transform</NodeGroupHeading>

              <NodeDocCard
                id="set-fields"
                title="Set Fields"
                category="Transform"
                visible={vis('set-fields')}
                description="Adds new fields to the data or overwrites existing ones. Use it to label data, attach calculated values, set a status flag, or prepare a clean data object for the next step. All existing fields are preserved — you only change the ones you specify."
                setupSteps={[
                  'Click Add Field to add a new key-value pair.',
                  'In the Key column, enter the field name you want to add or update (e.g. status, category, processedAt).',
                  'In the Value column, enter the value to set. You can enter a string, number, or true/false.',
                  'Add as many fields as you need.',
                  'The next node receives the original data with your new or updated fields applied.',
                ]}
                fields={[
                  {
                    name: 'Fields',
                    required: true,
                    description:
                      'A list of key-value pairs. Key is the field name to add or overwrite; Value is the new value.',
                  },
                ]}
                examples={[
                  {
                    label: 'Mark a record as processed',
                    value:
                      'Key: status      → Value: processed\nKey: processedAt → Value: 2024-01-15',
                  },
                  {
                    label: 'Add a category label',
                    value: 'Key: category → Value: premium',
                  },
                ]}
                tips={[
                  'You can overwrite existing fields — just use the same key name and the old value will be replaced.',
                  'Set Fields is often used right before a notification node to prepare a clean, readable data object.',
                ]}
              />

              <NodeDocCard
                id="filter-array"
                title="Filter Array"
                category="Transform"
                visible={vis('filter-array')}
                description="Filters an array of items, keeping only the ones that match a condition you write in JavaScript. The input data must include an array field named items or data. Use it to remove unwanted records before processing them downstream."
                setupSteps={[
                  'Make sure the node before this one outputs an items or data array. Each element will be evaluated.',
                  'Write a JavaScript expression in the Expression field that returns true for items to keep and false for items to remove.',
                  'Use the item variable to refer to each element. Example: item.active === true keeps only items where active is true.',
                  'The filtered array is passed to the next node as items.',
                ]}
                fields={[
                  {
                    name: 'Expression',
                    required: true,
                    description:
                      'A JavaScript expression evaluated for each item. Return true to keep the item, false to remove it. Use item to refer to the current element. Example: item.price > 100',
                  },
                ]}
                examples={[
                  {
                    label: 'Keep only active users',
                    value: 'item.active === true',
                  },
                  { label: 'Keep orders over $50', value: 'item.total > 50' },
                  {
                    label: 'Keep items from one category',
                    value: "item.category === 'electronics'",
                  },
                ]}
                tips={[
                  'If an item causes an error in the expression, it is silently excluded from the result — useful for inconsistent data.',
                  'For more complex filtering (nested arrays, multiple conditions), use the Run JavaScript node instead.',
                ]}
              />

              <NodeDocCard
                id="rename-keys"
                title="Rename Keys"
                category="Transform"
                visible={vis('rename-keys')}
                description="Renames fields in the data object without changing their values. Use it to match the field names expected by an API or downstream node, or to clean up awkward names received from an external source. Fields not listed in your mappings pass through unchanged."
                setupSteps={[
                  'Click Add Mapping for each field you want to rename.',
                  'In the From column, enter the current field name exactly as it appears in the data.',
                  'In the To column, enter the new name you want for that field.',
                  'The next node receives the same data with your renamed fields applied.',
                ]}
                fields={[
                  {
                    name: 'Mappings',
                    required: true,
                    description:
                      'A list of from → to pairs. From is the current key name; To is the new name. The stored value is unchanged.',
                  },
                ]}
                examples={[
                  {
                    label: 'Convert snake_case to camelCase',
                    value:
                      'From: user_id    → To: userId\nFrom: created_at → To: createdAt\nFrom: first_name → To: firstName',
                  },
                  {
                    label: 'Standardise API field names',
                    value:
                      'From: UserEmail → To: email\nFrom: UserName  → To: name',
                  },
                ]}
                tips={[
                  'Only fields listed in your mappings are renamed. All other fields pass through as-is.',
                  'If the From field does not exist in the data, that mapping is skipped — no error occurs.',
                ]}
              />
            </div>

            {/* ── Notify nodes ─────────────────────────────────── */}
            <div className="space-y-5">
              <NodeGroupHeading>Notifications</NodeGroupHeading>

              <NodeDocCard
                id="slack-message"
                title="Slack Message"
                category="Notify"
                visible={vis('slack-message')}
                description="Posts a message to a Slack channel using an Incoming Webhook URL. Slack Incoming Webhooks are the simplest way to send automated messages — no bot tokens or complex permissions required. You will need a Slack workspace and permission to add apps."
                setupSteps={[
                  'Go to api.slack.com/apps and sign in with your Slack account.',
                  'Click Create New App and choose From scratch. Give your app a name (e.g. Triggr) and select your workspace.',
                  'In the left sidebar of your new app, click Incoming Webhooks.',
                  'Toggle Activate Incoming Webhooks to On.',
                  'Click Add New Webhook to Workspace. Select the channel where messages should appear and click Allow.',
                  'Copy the webhook URL that appears — it starts with https://hooks.slack.com/services/...',
                  "Paste it into the Webhook URL field in this node's configuration.",
                  'Enter the message you want to post in the Message field.',
                ]}
                fields={[
                  {
                    name: 'Webhook URL',
                    required: true,
                    description:
                      'Your Slack Incoming Webhook URL. Starts with https://hooks.slack.com/services/T.../B.../...',
                  },
                  {
                    name: 'Message',
                    required: true,
                    description:
                      'The plain text message to post. Supports basic Slack formatting: *bold*, _italic_, and <https://url|link text>.',
                  },
                ]}
                examples={[
                  {
                    label: 'Post an alert to a channel',
                    value:
                      'Webhook URL: https://hooks.slack.com/services/T00.../B00.../...\nMessage: A new order has arrived. Check the dashboard.',
                  },
                ]}
                tips={[
                  'Store your webhook URL as an Environment Variable (e.g. {{ $vars.SLACK_WEBHOOK }}) so it is not visible in workflow configs.',
                  'You can create separate webhook URLs for different channels. Set up one per channel in the Slack app settings at api.slack.com/apps.',
                  'If you see a 400 or 404 error, the webhook URL may be wrong or the Slack app may have been removed — regenerate it from the app settings.',
                ]}
              />

              <NodeDocCard
                id="send-email"
                title="Send Email"
                category="Notify"
                visible={vis('send-email')}
                description="Sends an email using your own SMTP server or a third-party email service. You provide SMTP credentials — the server address, port, username, and password. Common options include Gmail, SendGrid, Mailgun, and Amazon SES."
                setupSteps={[
                  'Obtain SMTP credentials from your email provider (see the tips section below for step-by-step guides for Gmail, SendGrid, and Mailgun).',
                  "Enter the recipient's email address in the To field.",
                  'Fill in the Subject and Body of your message.',
                  'Enter your SMTP Host, Port, username, password, and the From address that will appear as the sender.',
                  'Save and run the workflow — check the execution log to confirm the email was sent.',
                ]}
                fields={[
                  {
                    name: 'To',
                    required: true,
                    description: "The recipient's email address.",
                  },
                  {
                    name: 'Subject',
                    required: true,
                    description: 'The email subject line.',
                  },
                  {
                    name: 'Body',
                    required: true,
                    description: 'The email body as plain text.',
                  },
                  {
                    name: 'SMTP Host',
                    required: true,
                    description:
                      'Your SMTP server address. Examples: smtp.gmail.com, smtp.sendgrid.net, smtp.mailgun.org.',
                  },
                  {
                    name: 'SMTP Port',
                    required: true,
                    description:
                      'The SMTP port number. Use 587 for most providers (STARTTLS). Use 465 for direct SSL/TLS.',
                  },
                  {
                    name: 'SMTP User',
                    required: true,
                    description:
                      'Your SMTP username — usually your email address or an API key identifier.',
                  },
                  {
                    name: 'SMTP Password',
                    required: true,
                    description:
                      'Your SMTP password or API key. Store this as an Environment Variable.',
                  },
                  {
                    name: 'From Address',
                    required: true,
                    description:
                      'The sender address shown to recipients. Can include a display name: Your Name <you@example.com>',
                  },
                ]}
                examples={[
                  {
                    label: 'Using Gmail with an App Password',
                    value:
                      'SMTP Host: smtp.gmail.com\nSMTP Port: 587\nSMTP User: you@gmail.com\nSMTP Password: (your 16-character App Password)\nFrom: Your Name <you@gmail.com>',
                  },
                  {
                    label: 'Using SendGrid',
                    value:
                      'SMTP Host: smtp.sendgrid.net\nSMTP Port: 587\nSMTP User: apikey\nSMTP Password: (your SendGrid API key)\nFrom: you@yourdomain.com',
                  },
                ]}
                tips={[
                  'Gmail requires an App Password — not your regular password. Go to myaccount.google.com → Security → 2-Step Verification → App passwords. Generate one for Mail and use it as SMTP Password.',
                  'SendGrid: create an API key at app.sendgrid.com with Mail Send permission. Use the literal text apikey as SMTP User and the API key as SMTP Password.',
                  'Mailgun: go to app.mailgun.com → Sending → Domains → your domain → SMTP credentials. Copy the login and password shown there.',
                  'Store all SMTP credentials as Environment Variables (e.g. {{ $vars.SMTP_PASS }}) to keep them out of workflow configs.',
                ]}
              />

              <NodeDocCard
                id="delay"
                title="Delay"
                category="Notify"
                visible={vis('delay')}
                description="Pauses the workflow for a set amount of time before continuing to the next node. Use it to wait between steps — for example, wait 30 seconds after creating a record before sending a notification, or pace requests to an external API to avoid rate limits."
                setupSteps={[
                  'Enter the number of time units to wait in the Duration field.',
                  'Choose the unit: seconds, minutes, or hours.',
                  'Save the node. When the workflow runs, it will pause at this node for the specified duration before continuing.',
                ]}
                fields={[
                  {
                    name: 'Duration',
                    required: true,
                    description:
                      'How long to wait. Enter a positive whole number.',
                  },
                  {
                    name: 'Unit',
                    required: true,
                    description:
                      'The unit of time: seconds, minutes, or hours.',
                  },
                ]}
                examples={[
                  {
                    label: 'Wait 30 seconds',
                    value: 'Duration: 30\nUnit: seconds',
                  },
                  {
                    label: 'Wait 5 minutes',
                    value: 'Duration: 5\nUnit: minutes',
                  },
                ]}
                tips={[
                  'The default maximum delay is 5 minutes. Contact your server administrator if you need longer delays.',
                  'For very long waits (hours or days), a Schedule Trigger on a second workflow is more reliable than a long Delay.',
                ]}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
