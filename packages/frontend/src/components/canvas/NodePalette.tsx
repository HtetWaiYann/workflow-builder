import * as React from 'react'
import { Search, ChevronDown, ChevronRight } from 'lucide-react'
import type { NodeType, NodeGroup } from '@workflow-builder/shared'
import { NODE_GROUPS, ICON_MAP } from '@/lib/nodeRegistry'

const GROUP_ORDER: NodeGroup[] = [
  'Triggers',
  'Actions',
  'Logic',
  'Transform',
  'Notify',
]

export function NodePalette() {
  const [search, setSearch] = React.useState('')
  const [collapsed, setCollapsed] = React.useState<Record<NodeGroup, boolean>>({
    Triggers: false,
    Actions: false,
    Logic: false,
    Transform: false,
    Notify: false,
  })

  const query = search.trim().toLowerCase()

  function toggleGroup(group: NodeGroup) {
    setCollapsed((prev) => ({ ...prev, [group]: !prev[group] }))
  }

  function handleDragStart(e: React.DragEvent, type: NodeType) {
    e.dataTransfer.setData('application/reactflow', type)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="bg-background flex w-65 shrink-0 flex-col border-r">
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <input
            className="border-input bg-muted/40 placeholder:text-muted-foreground focus:ring-ring h-8 w-full rounded-md border pr-3 pl-8 text-sm focus:ring-1 focus:outline-none"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto">
        {GROUP_ORDER.map((group) => {
          const defs = NODE_GROUPS[group]
          const filtered = query
            ? defs.filter(
                (d) =>
                  d.label.toLowerCase().includes(query) ||
                  d.description.toLowerCase().includes(query)
              )
            : defs

          if (filtered.length === 0) return null

          const isCollapsed = collapsed[group] && !query

          return (
            <div key={group} className="mb-3">
              {/* Group header — click to collapse */}
              <button
                onClick={() => toggleGroup(group)}
                className="hover:bg-muted/30 flex w-full items-center justify-between rounded px-3 pt-2 pb-1 text-left"
              >
                <span className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
                  {group}
                </span>
                {isCollapsed ? (
                  <ChevronRight className="text-muted-foreground size-3 shrink-0" />
                ) : (
                  <ChevronDown className="text-muted-foreground size-3 shrink-0" />
                )}
              </button>

              {!isCollapsed && (
                <div className="space-y-0.5 px-2">
                  {filtered.map((def) => {
                    const IconComponent = ICON_MAP[def.icon]
                    return (
                      <div
                        key={def.type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, def.type)}
                        className="hover:bg-muted/60 flex cursor-grab items-center gap-2.5 rounded-md px-2 py-1.5 active:cursor-grabbing"
                      >
                        {IconComponent && (
                          <IconComponent
                            size={16}
                            style={{ color: def.color, flexShrink: 0 }}
                          />
                        )}
                        <span className="truncate text-sm">{def.label}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
