import { Link } from 'react-router-dom'
import { ThemeToggle } from '@/components/ThemeToggle'
import { NavDivider } from '@/components/NavDivider'

/** Shared Docs link + divider + ThemeToggle used in both Navbar and TopBar. */
export function NavActions() {
  return (
    <>
      <Link
        to="/docs"
        className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 transition-colors duration-150 hover:underline"
      >
        Docs
      </Link>
      <NavDivider />
      <ThemeToggle />
    </>
  )
}
