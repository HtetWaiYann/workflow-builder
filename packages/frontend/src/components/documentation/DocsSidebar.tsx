import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

type NavLeaf = { kind: 'item'; id: string; label: string }
type NavSubGroup = { kind: 'subgroup'; heading: string; items: NavLeaf[] }
type NavEntry = NavLeaf | NavSubGroup

interface NavGroup {
  heading: string
  entries: NavEntry[]
}

const NAV: NavGroup[] = [
  {
    heading: 'Getting Started',
    entries: [
      { kind: 'item', id: 'introduction', label: 'Introduction' },
      { kind: 'item', id: 'tech-stack', label: 'Technology Stack' },
      { kind: 'item', id: 'local-setup', label: 'Local Setup' },
      { kind: 'item', id: 'deployment', label: 'Server Deployment' },
    ],
  },
  {
    heading: 'Your Workspace',
    entries: [
      { kind: 'item', id: 'workspaces', label: 'Workspaces' },
      { kind: 'item', id: 'members-roles', label: 'Members & Roles' },
      { kind: 'item', id: 'invitations', label: 'Invitations' },
      { kind: 'item', id: 'env-variables', label: 'Environment Variables' },
    ],
  },
  {
    heading: 'Node Reference',
    entries: [
      {
        kind: 'subgroup',
        heading: 'Triggers',
        items: [
          { kind: 'item', id: 'manual-trigger', label: 'Manual Trigger' },
          { kind: 'item', id: 'webhook-trigger', label: 'Webhook Trigger' },
          { kind: 'item', id: 'cron-trigger', label: 'Schedule Trigger' },
        ],
      },
      {
        kind: 'subgroup',
        heading: 'Actions',
        items: [
          { kind: 'item', id: 'http-request', label: 'HTTP Request' },
          { kind: 'item', id: 'run-js-code', label: 'Run JavaScript' },
        ],
      },
      {
        kind: 'subgroup',
        heading: 'Logic',
        items: [
          { kind: 'item', id: 'if-condition', label: 'If Condition' },
          { kind: 'item', id: 'switch', label: 'Switch' },
          { kind: 'item', id: 'merge', label: 'Merge' },
        ],
      },
      {
        kind: 'subgroup',
        heading: 'Transform',
        items: [
          { kind: 'item', id: 'set-fields', label: 'Set Fields' },
          { kind: 'item', id: 'filter-array', label: 'Filter Array' },
          { kind: 'item', id: 'rename-keys', label: 'Rename Keys' },
        ],
      },
      {
        kind: 'subgroup',
        heading: 'Notifications',
        items: [
          { kind: 'item', id: 'slack-message', label: 'Slack Message' },
          { kind: 'item', id: 'send-email', label: 'Send Email' },
          { kind: 'item', id: 'delay', label: 'Delay' },
        ],
      },
    ],
  },
]

interface NavItemButtonProps {
  item: NavLeaf
  activeId: string
  onSelect: (id: string) => void
}

function NavItemButton({ item, activeId, onSelect }: NavItemButtonProps) {
  const isActive = activeId === item.id
  return (
    <button
      onClick={() => onSelect(item.id)}
      className={`w-full rounded-md py-1.5 pr-3 pl-5 text-left text-sm leading-snug transition-colors duration-150 ${
        isActive
          ? 'bg-foreground/8 text-foreground font-medium'
          : 'text-muted-foreground hover:bg-foreground/4 hover:text-foreground'
      }`}
    >
      {item.label}
    </button>
  )
}

interface DocsSidebarProps {
  activeId: string
  onSelect: (id: string) => void
}

export function DocsSidebar({ activeId, onSelect }: DocsSidebarProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  function toggleSubgroup(heading: string) {
    setCollapsed((prev) => ({ ...prev, [heading]: !prev[heading] }))
  }

  return (
    <nav aria-label="Documentation navigation" className="space-y-6">
      {NAV.map((group) => (
        <div key={group.heading} className="mb-6">
          <div className="border-border/40 border-b px-3 pb-2">
            <p className="text-foreground text-xs font-semibold tracking-widest uppercase mb-2">
              {group.heading}
            </p>
          </div>
          <div className="mt-2 space-y-0.5">
            {group.entries.map((entry) => {
              if (entry.kind === 'item') {
                return (
                  <NavItemButton
                    key={entry.id}
                    item={entry}
                    activeId={activeId}
                    onSelect={onSelect}
                  />
                )
              }

              const isCollapsed = collapsed[entry.heading] ?? false

              return (
                <div key={entry.heading}>
                  <button
                    onClick={() => toggleSubgroup(entry.heading)}
                    className="hover:bg-foreground/4 flex w-full items-center justify-between rounded-md py-1.5 pr-3 pl-5 text-left transition-colors duration-150"
                  >
                    <span className="text-muted-foreground/60 text-[11px] font-semibold tracking-widest uppercase">
                      {entry.heading}
                    </span>
                    {isCollapsed ? (
                      <ChevronRight className="text-muted-foreground/40 size-3 shrink-0" />
                    ) : (
                      <ChevronDown className="text-muted-foreground/40 size-3 shrink-0" />
                    )}
                  </button>
                  {!isCollapsed && (
                    <div className="space-y-0.5 pl-2">
                      {entry.items.map((item) => (
                        <NavItemButton
                          key={item.id}
                          item={item}
                          activeId={activeId}
                          onSelect={onSelect}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
