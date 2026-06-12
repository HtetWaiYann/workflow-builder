import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { TriggrLogo } from '@/components/TriggrLogo'
import { Button } from '@/components/ui/button'
import { NavActions } from '@/components/NavActions'
import { NavDivider } from '@/components/NavDivider'
// import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuthStore } from '@/stores/authStore'

/**
 * Unified top navigation bar used across all public pages.
 * Auth actions (Sign in / Get started / user avatar) are only shown on the
 * landing page ("/"). All other public pages show the logo and theme toggle only.
 * On mobile a hamburger menu collapses the nav items into a dropdown.
 */
export function Navbar() {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const isLanding = location.pathname === '/'
  const showAuth = isLanding || location.pathname === '/docs'
  const userInitial = (user?.name ?? user?.email ?? '?').charAt(0).toUpperCase()

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header className="bg-background/90 fixed inset-x-0 top-0 z-50 border-b backdrop-blur-sm">
      <div className="flex h-16 items-center gap-3 px-6 pr-7">
        <Link to="/" aria-label="Triggr home" onClick={closeMenu}>
          <TriggrLogo iconSize={36} />
        </Link>

        <div className="flex-1" />

        {/* Desktop nav — hidden on mobile via CSS, always in DOM for tests */}
        <div className="hidden items-center gap-3 sm:flex">
          <NavActions />

          {showAuth && !isLoading && (
            <>
              <NavDivider />
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-sm">
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
        </div>

        {/* Mobile: hamburger button */}
        <button
          className="text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-md transition-colors sm:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile dropdown — only rendered when open, so no duplicate roles in tests */}
      {menuOpen && (
        <div className="border-t px-6 py-4 sm:hidden">
          <nav className="flex flex-col gap-4" aria-label="Mobile navigation">
            <Link
              to="/docs"
              className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 transition-colors hover:underline"
              onClick={closeMenu}
            >
              Documentation
            </Link>
            {/* <div>
              <ThemeToggle />
            </div> */}
            {showAuth && !isLoading && (
              <div className="flex items-center gap-2 border-t pt-4">
                {user ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        navigate('/workflows')
                        closeMenu()
                      }}
                      className="bg-primary text-primary-foreground focus-visible:ring-ring flex size-9 items-center justify-center rounded-full text-sm font-bold transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:outline-none"
                      title="Open app"
                    >
                      {userInitial}
                    </button>
                    <span className="text-muted-foreground text-sm">
                      {user.name ?? user.email}
                    </span>
                  </div>
                ) : (
                  <>
                    <Button variant="link" size="sm" asChild className="px-0">
                      <Link to="/login" onClick={closeMenu}>
                        Sign in
                      </Link>
                    </Button>
                    <br />
                    <Button size="sm" asChild>
                      <Link to="/register" onClick={closeMenu}>
                        Get started
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
