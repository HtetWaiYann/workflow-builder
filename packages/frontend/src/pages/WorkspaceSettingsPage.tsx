import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import type {
  WorkspaceMember,
  WorkspaceMemberRole,
  PendingInvite,
} from '@triggr/shared'
import { TopBar } from '@/components/TopBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { ArrowLeft, MoreHorizontal, Clock } from 'lucide-react'

const ROLE_OPTIONS: WorkspaceMemberRole[] = ['OWNER', 'EDITOR', 'VIEWER']

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Email is required'
  if (!emailRegex.test(value)) return 'Enter a valid email address'
  return null
}

export function WorkspaceSettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()
  const currentRole = useAuthStore((s) => s.currentRole)
  const currentWorkspace = useAuthStore((s) => s.currentWorkspace)
  const user = useAuthStore((s) => s.user)

  const updateCurrentWorkspaceName = useAuthStore(
    (s) => s.updateCurrentWorkspaceName
  )

  const [workspaceName, setWorkspaceName] = useState(
    currentWorkspace?.name ?? ''
  )
  const [savingName, setSavingName] = useState(false)

  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteEmailError, setInviteEmailError] = useState<string | null>(null)
  const [inviteEmailTouched, setInviteEmailTouched] = useState(false)
  const [inviteRole, setInviteRole] = useState<WorkspaceMemberRole>('EDITOR')
  const [inviting, setInviting] = useState(false)

  const isOwner = currentRole === 'OWNER'

  useEffect(() => {
    if (!workspaceId) return
    setLoadingMembers(true)
    const fetchMembers = api.workspaces
      .listMembers(workspaceId)
      .then(({ members: m }) => setMembers(m))
    const fetchInvites = isOwner
      ? api.workspaces
          .listInvites(workspaceId)
          .then(({ invites }) => setPendingInvites(invites))
      : Promise.resolve()
    Promise.all([fetchMembers, fetchInvites])
      .catch(() => toast.error('Failed to load members'))
      .finally(() => setLoadingMembers(false))
  }, [workspaceId, isOwner])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!workspaceId) return
    const error = validateEmail(inviteEmail)
    setInviteEmailTouched(true)
    setInviteEmailError(error)
    if (error) return
    setInviting(true)
    try {
      const { invite } = await api.workspaces.invite(workspaceId, {
        email: inviteEmail,
        role: inviteRole,
      })
      setPendingInvites((prev) => [
        {
          ...invite,
          workspaceId: workspaceId,
          invitedBy: {
            id: user!.id,
            email: user!.email,
            name: user!.name,
            createdAt: '',
          },
        },
        ...prev,
      ])
      setInviteEmail('')
      setInviteEmailTouched(false)
      setInviteEmailError(null)
      toast.success(`Invite sent to ${invite.email}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create invite'
      toast.error(msg)
    } finally {
      setInviting(false)
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    if (!workspaceId) return
    try {
      await api.workspaces.revokeInvite(workspaceId, inviteId)
      setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId))
      toast.success('Invite revoked')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to revoke invite'
      toast.error(msg)
    }
  }

  async function handleResendInvite(inviteId: string) {
    if (!workspaceId) return
    try {
      const { invite } = await api.workspaces.resendInvite(
        workspaceId,
        inviteId
      )
      setPendingInvites((prev) =>
        prev.map((i) => (i.id === inviteId ? invite : i))
      )
      toast.success('Invite resent')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to resend invite'
      toast.error(msg)
    }
  }

  async function handleRoleChange(userId: string, role: WorkspaceMemberRole) {
    if (!workspaceId) return
    try {
      const { member } = await api.workspaces.updateMemberRole(
        workspaceId,
        userId,
        { role }
      )
      setMembers((prev) => prev.map((m) => (m.id === member.id ? member : m)))
      toast.success('Role updated')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update role'
      toast.error(msg)
    }
  }

  async function handleRenameName(e: React.FormEvent) {
    e.preventDefault()
    if (!workspaceId) return
    const trimmed = workspaceName.trim()
    if (!trimmed || trimmed === currentWorkspace?.name) return
    setSavingName(true)
    try {
      const { workspace } = await api.workspaces.updateName(workspaceId, {
        name: trimmed,
      })
      updateCurrentWorkspaceName(workspace.name)
      toast.success('Workspace name updated')
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to update workspace name'
      toast.error(msg)
      setWorkspaceName(currentWorkspace?.name ?? '')
    } finally {
      setSavingName(false)
    }
  }

  async function handleRemove(userId: string) {
    if (!workspaceId) return
    try {
      await api.workspaces.removeMember(workspaceId, userId)
      setMembers((prev) => prev.filter((m) => m.userId !== userId))
      toast.success('Member removed')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to remove member'
      toast.error(msg)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <button
          onClick={() => navigate('/workflows')}
          className="text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to workflows
        </button>

        <h1 className="mb-6 text-xl font-semibold">Workspace Settings</h1>

        {/* Workspace name */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium">Workspace name</h2>
          {isOwner ? (
            <form
              onSubmit={handleRenameName}
              className="flex items-center gap-2"
            >
              <Input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="max-w-xs"
                disabled={savingName}
                aria-label="Workspace name"
              />
              <Button
                type="submit"
                variant="outline"
                disabled={
                  savingName ||
                  !workspaceName.trim() ||
                  workspaceName.trim() === currentWorkspace?.name
                }
              >
                {savingName ? 'Saving…' : 'Save'}
              </Button>
            </form>
          ) : (
            <p className="text-sm">{currentWorkspace?.name}</p>
          )}
        </section>

        {/* Divider */}
        <div className="mb-8 border-t" />

        <h2 className="mb-1 text-base font-semibold">Members</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Manage who has access to this workspace.
        </p>

        {/* Invite form — OWNER only */}
        {isOwner && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-medium">Invite a member</h2>
            <form onSubmit={handleInvite} className="flex items-start gap-2">
              <div className="flex-1">
                <Label htmlFor="invite-email" className="sr-only">
                  Email address
                </Label>
                <Input
                  id="invite-email"
                  type="text"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value)
                    if (inviteEmailTouched) {
                      setInviteEmailError(validateEmail(e.target.value))
                    }
                  }}
                  onBlur={() => {
                    setInviteEmailTouched(true)
                    setInviteEmailError(validateEmail(inviteEmail))
                  }}
                  aria-invalid={inviteEmailTouched && !!inviteEmailError}
                />
                {inviteEmailTouched && inviteEmailError && (
                  <p className="text-destructive mt-1 text-xs">
                    {inviteEmailError}
                  </p>
                )}
              </div>
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as WorkspaceMemberRole)}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" disabled={inviting}>
                {inviting ? 'Inviting…' : 'Invite'}
              </Button>
            </form>
          </section>
        )}

        {/* Members list */}
        <section>
          {loadingMembers ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {/* Active members */}
              {members.map((m) => {
                const isSelf = m.userId === user?.id
                return (
                  <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium">
                      {(m.user.name ?? m.user.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {m.user.name ?? m.user.email}
                        {isSelf && (
                          <span className="text-muted-foreground ml-1.5 text-xs">
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {m.user.email}
                      </p>
                    </div>

                    {isOwner && !isSelf ? (
                      <Select
                        value={m.role}
                        onValueChange={(v) =>
                          handleRoleChange(m.userId, v as WorkspaceMemberRole)
                        }
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-muted-foreground w-28 text-right text-sm">
                        {m.role}
                      </span>
                    )}

                    {isOwner && !isSelf && (
                      <DropdownMenuRoot>
                        <DropdownMenuTrigger asChild>
                          <button className="text-muted-foreground hover:text-foreground transition-colors">
                            <MoreHorizontal className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => handleRemove(m.userId)}
                          >
                            Remove from workspace
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenuRoot>
                    )}
                  </li>
                )
              })}

              {/* Pending invites */}
              {isOwner &&
                pendingInvites.map((invite) => (
                  <li
                    key={invite.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium">
                      {invite.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {invite.email}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        Expires{' '}
                        {new Date(invite.expiresAt).toLocaleDateString()}
                      </p>
                    </div>

                    <span className="text-muted-foreground w-28 text-right text-sm">
                      {invite.role}
                    </span>

                    <span className="text-warning flex items-center gap-1 text-xs font-medium text-amber-500">
                      <Clock className="size-3.5" />
                      Pending
                    </span>

                    <DropdownMenuRoot>
                      <DropdownMenuTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <MoreHorizontal className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => handleResendInvite(invite.id)}
                        >
                          Resend invite
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => handleRevokeInvite(invite.id)}
                        >
                          Revoke invite
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenuRoot>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
