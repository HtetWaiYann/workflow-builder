import { Link, useLocation, useNavigate } from 'react-router-dom'
import { TriggrLogo } from '@/components/TriggrLogo'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuthStore } from '@/stores/authStore'

/**
 * Unified top navigation bar used across all public pages.
 * Auth actions (Sign in / Get started / user avatar) are only shown on the
 * landing page ("/"). All other public pages show the logo and theme toggle only.
 */
export function Navbar() {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const navigate = useNavigate()

  const isLanding = location.pathname === '/'
  const userInitial = (user?.name ?? user?.email ?? '?').charAt(0).toUpperCase()

  return (
    <header className="bg-background/90 fixed inset-x-0 top-0 z-50 flex h-16 items-center border-b px-6 backdrop-blur-sm">
      <Link to="/" aria-label="Triggr home">
        <TriggrLogo iconSize={36} />
      </Link>

      <div className="flex-1" />

      <Link
        to="/docs"
        className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 transition-colors duration-150 hover:underline"
      >
        Docs
      </Link>

      <ThemeToggle />

      {isLanding && !isLoading && (
        <>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground hidden text-sm sm:block">
                {user.name ?? user.email}
              </span>
              <button
                onClick={() => navigate('/workflows')}
                className="bg-primary text-primary-foreground focus-visible:ring-ring flex size-9 items-center justify-center rounded-full text-sm font-bold transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:outline-none"
                title="Open app"
              >
                {userInitial}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Get started</Link>
              </Button>
            </div>
          )}
        </>
      )}
    </header>
  )
}
