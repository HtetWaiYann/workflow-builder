import { TriggrLogo } from '@/components/TriggrLogo'

export function LandingFooter() {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 sm:flex-row">
        <TriggrLogo iconSize={40} />
        <div className="flex items-center gap-3">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Triggr. All rights reserved.
          </p>
          <span className="text-muted-foreground/50 text-xs">
            v{__APP_VERSION__}
          </span>
        </div>
      </div>
    </footer>
  )
}
