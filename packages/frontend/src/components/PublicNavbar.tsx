import { Link } from 'react-router-dom'
import { TriggrLogo } from '@/components/TriggrLogo'

/** Top navigation bar displayed on public-facing (unauthenticated) pages. */
export function PublicNavbar() {
  return (
    <header className="bg-background/90 fixed inset-x-0 top-0 z-50 flex h-14 items-center border-b px-6 backdrop-blur-sm">
      <Link to="/login" aria-label="Go to Triggr home">
        <TriggrLogo iconSize={24} />
      </Link>
    </header>
  )
}
