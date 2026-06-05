import { TriggrLogo } from '@/components/TriggrLogo'

export function LandingFooter() {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 sm:flex-row">
        <TriggrLogo iconSize={40} />
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} Triggr. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
