import { Link, useNavigate } from 'react-router-dom'
import { TriggrLogo } from '@/components/TriggrLogo'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

/**
 * Top navigation bar for the landing page.
 * Unauthenticated visitors see Sign in + Get started buttons.
 * Authenticated users see their avatar, which navigates to the app.
 */
export function LandingNavbar() {
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const navigate = useNavigate()

  const userInitial = (user?.name ?? user?.email ?? '?').charAt(0).toUpperCase()

  return (
    <header className="bg-background/90 fixed inset-x-0 top-0 z-50 flex h-16 items-center border-b px-6 backdrop-blur-sm">
      <Link to="/" aria-label="Triggr home">
        <TriggrLogo iconSize={26} />
      </Link>

      <div className="flex-1" />

      {!isLoading && (
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
