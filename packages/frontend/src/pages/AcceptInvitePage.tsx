import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import type { InvitePreview } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Navbar } from '@/components/Navbar'
import { LoadingScreen } from '@/components/LoadingScreen'

export function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const workspaces = useAuthStore((s) => s.workspaces)
  const setAuth = useAuthStore((s) => s.setAuth)
  const switchWorkspace = useAuthStore((s) => s.switchWorkspace)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const [invite, setInvite] = useState<InvitePreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    api.workspaces
      .getInvite(token)
      .then(({ invite: i }) => setInvite(i))
      .catch(() => setError('This invite link is invalid or has expired.'))
      .finally(() => setLoading(false))
  }, [token])

  async function handleAccept() {
    if (!token || !user) return
    setAccepting(true)
    try {
      const { role } = await api.workspaces.acceptInvite(token)
      const { user: refreshedUser, workspaces: refreshedWorkspaces } =
        await api.auth.me()
      setAuth(refreshedUser, refreshedWorkspaces)
      if (invite) switchWorkspace(invite.workspace.id)
      toast.success(
        `Joined ${invite?.workspace.name ?? 'workspace'} as ${role}`
      )
      navigate('/workflows')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to accept invite'
      toast.error(msg)
      setAccepting(false)
    }
  }

  async function handleDecline() {
    if (!token) return
    setDeclining(true)
    try {
      await api.workspaces.rejectInvite(token)
      toast.success('Invite declined')
      navigate('/workflows')
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to decline invite'
      toast.error(msg)
      setDeclining(false)
    }
  }

  async function handleLogout() {
    try {
      await api.auth.logout()
    } catch {
      // best-effort
    }
    clearAuth()
    navigate(`/login?redirect=/invites/${token}`)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <LoadingScreen />
      </>
    )
  }

  if (error || !invite) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 pt-14 text-center">
          <h1 className="text-xl font-semibold">Invite not found</h1>
          <p className="text-muted-foreground text-sm">
            {error ?? 'This invite link is invalid or has expired.'}
          </p>
          <Button variant="outline" onClick={() => navigate('/workflows')}>
            Go to dashboard
          </Button>
        </div>
      </>
    )
  }

  const alreadyMember = workspaces.some(
    (m) => m.workspace.id === invite.workspace.id
  )
  const emailMismatch = !!user && user.email !== invite.email

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen items-center justify-center px-4 pt-14">
        <div className="w-full max-w-sm rounded-xl border p-8 shadow-sm">
          <div className="bg-primary text-primary-foreground mb-4 flex size-12 items-center justify-center rounded-xl text-xl font-bold">
            {invite.workspace.name.charAt(0).toUpperCase()}
          </div>

          <h1 className="mb-1 text-lg font-semibold">You have been invited</h1>
          <p className="text-muted-foreground mb-6 text-sm">
            <span className="text-foreground font-medium">
              {invite.invitedBy.name ?? invite.invitedBy.email}
            </span>{' '}
            invited{' '}
            <span className="text-foreground font-medium">{invite.email}</span>{' '}
            to join{' '}
            <span className="text-foreground font-medium">
              {invite.workspace.name}
            </span>{' '}
            as <span className="font-medium">{invite.role}</span>.
          </p>

          {/* Not logged in */}
          {!user && (
            <>
              <p className="text-muted-foreground mb-4 text-sm">
                Sign in or create an account with{' '}
                <span className="text-foreground font-medium">
                  {invite.email}
                </span>{' '}
                to accept this invite.
              </p>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => navigate(`/login?redirect=/invites/${token}`)}
                >
                  Log in
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    navigate(
                      `/register?email=${encodeURIComponent(invite.email)}&redirect=/invites/${token}`
                    )
                  }
                >
                  Register
                </Button>
              </div>
            </>
          )}

          {/* Logged in as wrong account */}
          {emailMismatch && (
            <>
              <div className="bg-muted mb-4 rounded-lg p-3 text-sm">
                <p className="text-foreground font-medium">Wrong account</p>
                <p className="text-muted-foreground mt-0.5">
                  You are signed in as{' '}
                  <span className="text-foreground">{user.email}</span>, but
                  this invite is for{' '}
                  <span className="text-foreground">{invite.email}</span>.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={handleLogout} className="w-full">
                  Log out and switch account
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/workflows')}
                >
                  Go to my dashboard
                </Button>
              </div>
            </>
          )}

          {/* Already a member */}
          {!emailMismatch && alreadyMember && (
            <>
              <p className="text-muted-foreground mb-4 text-sm">
                You are already a member of this workspace.
              </p>
              <Button className="w-full" onClick={() => navigate('/workflows')}>
                Go to dashboard
              </Button>
            </>
          )}

          {/* Ready to accept */}
          {!emailMismatch && !alreadyMember && user && (
            <>
              <p className="text-muted-foreground mb-4 text-sm">
                Accepting as{' '}
                <span className="text-foreground font-medium">
                  {user.email}
                </span>
                . Expires {new Date(invite.expiresAt).toLocaleDateString()}.
              </p>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleAccept}
                  disabled={accepting || declining}
                >
                  {accepting ? 'Joining…' : 'Accept'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDecline}
                  disabled={accepting || declining}
                >
                  {declining ? 'Declining…' : 'Decline'}
                </Button>
              </div>
              <p className="text-muted-foreground mt-3 text-center text-xs">
                Not your account?{' '}
                <button
                  onClick={handleLogout}
                  className="text-foreground underline underline-offset-2"
                >
                  Log out and switch
                </button>
              </p>
            </>
          )}

          {/* Footer link for unauthenticated users */}
          {!user && (
            <p className="text-muted-foreground mt-4 text-center text-xs">
              Already have the right account?{' '}
              <Link
                to={`/login?redirect=/invites/${token}`}
                className="text-foreground underline underline-offset-2"
              >
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </>
  )
}
