import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CtaSection() {
  return (
    <section className="border-t py-24">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <p className="text-muted-foreground mb-3 font-mono text-[11px] font-semibold tracking-widest uppercase">
          Get Started
        </p>
        <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Start automating today.
        </h2>
        <p className="text-muted-foreground mb-10">
          Join teams already using Triggr to save hours of manual work every
          week.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/register">
              Create free account
              <ArrowRight className="ml-1.5 size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
