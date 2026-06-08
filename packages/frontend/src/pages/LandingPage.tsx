import { Navbar } from '@/components/Navbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { RunStripSection } from '@/components/landing/RunStripSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { CtaSection } from '@/components/landing/CtaSection'
import { LandingFooter } from '@/components/landing/LandingFooter'

export function LandingPage() {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <HeroSection />
      <RunStripSection />
      <FeaturesSection />
      {/* TODO: we should implement only after we have actual testimonials */}
      {/* <TestimonialsSection />  */}
      <CtaSection />
      <LandingFooter />
    </div>
  )
}
