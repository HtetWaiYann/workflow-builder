import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { DocsSidebar } from '@/components/documentation/DocsSidebar'
import { DocBlock } from '@/components/documentation/DocBlock'
import { DOC_PAGES } from '@/lib/docsData'

const PAGE_IDS = DOC_PAGES.map((p) => p.id)

export function DocsPage() {
  const mainRef = useRef<HTMLElement>(null)

  const [activeId, setActiveId] = useState<string>(() => {
    const hash = window.location.hash.slice(1)
    return PAGE_IDS.includes(hash) ? hash : PAGE_IDS[0]
  })

  const currentIndex = PAGE_IDS.indexOf(activeId)
  const currentPage = DOC_PAGES[currentIndex]
  const prevPage = currentIndex > 0 ? DOC_PAGES[currentIndex - 1] : null
  const nextPage =
    currentIndex < DOC_PAGES.length - 1 ? DOC_PAGES[currentIndex + 1] : null

  function handleSelect(id: string) {
    setActiveId(id)
    window.history.replaceState(null, '', `/docs#${id}`)
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }

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
            {(
              [
                { label: 'Getting Started', id: 'introduction' },
                { label: 'Your Workspace', id: 'workspaces' },
                { label: 'Node Reference', id: 'manual-trigger' },
              ] as const
            ).map(({ label, id }) => (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                className="bg-muted text-muted-foreground hover:bg-accent hover:text-foreground shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mx-auto max-w-3xl px-6 py-10 lg:px-8">
            {/* Page title */}
            <h2 className="text-foreground mb-8 text-3xl font-bold tracking-tight">
              {currentPage.title}
            </h2>

            {/* Content blocks */}
            <div>
              {currentPage.blocks.map((block, i) => (
                <DocBlock key={i} block={block} />
              ))}
            </div>

            {/* Prev / Next navigation */}
            <div className="mt-16 flex items-center justify-between border-t pt-6">
              {prevPage ? (
                <button
                  onClick={() => handleSelect(prevPage.id)}
                  className="text-muted-foreground hover:text-foreground group flex items-center gap-2 text-sm transition-colors duration-150"
                >
                  <ChevronLeft className="size-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
                  <span>{prevPage.title}</span>
                </button>
              ) : (
                <div />
              )}

              <span className="text-muted-foreground/50 text-xs tabular-nums">
                {currentIndex + 1} / {DOC_PAGES.length}
              </span>

              {nextPage ? (
                <button
                  onClick={() => handleSelect(nextPage.id)}
                  className="text-muted-foreground hover:text-foreground group flex items-center gap-2 text-sm transition-colors duration-150"
                >
                  <span>{nextPage.title}</span>
                  <ChevronRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </button>
              ) : (
                <div />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
