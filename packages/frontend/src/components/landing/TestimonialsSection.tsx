const TESTIMONIALS = [
  {
    quote:
      "Replaced a tangle of Python scripts we'd been copying for two years. Took a weekend.",
    name: 'Alex Kim',
    title: 'Backend · Indie Hacker',
  },
  {
    quote:
      'The execution logs are the killer feature. Per-node inspection means I can actually debug production failures now.',
    name: 'Sarah Okonkwo',
    title: 'Full-stack Engineer',
  },
  {
    quote:
      'Automated our entire onboarding pipeline — webhook fires, Stripe charges, Slack pings the team — without a single line of code.',
    name: 'Marco Dellini',
    title: 'Platform Engineer',
  },
]

export function TestimonialsSection() {
  return (
    <section className="border-t py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="flex flex-col gap-6">
              <p className="text-foreground text-sm leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-auto flex items-center gap-3">
                <div className="bg-muted text-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">
                    {t.name}
                  </p>
                  <p className="text-muted-foreground text-xs">{t.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
