import * as React from 'react'
import { Copy, Check, RefreshCw, ShieldCheck, ShieldOff } from 'lucide-react'
import { WebhookTriggerConfigSchema } from '@workflow-builder/shared'
import type { WebhookSecretStatus } from '@workflow-builder/shared'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DialogRoot,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field } from '@/components/canvas/NodeConfigForm/Field'
import { str, HTTP_METHODS } from '@/lib/nodeConfigHelpers'
import { getConfigErrors } from '@/lib/nodeConfigValidation'
import { api } from '@/lib/api'

interface Props {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
  workflowId?: string
  nodeId?: string
}

type HmacState =
  | { status: 'loading' }
  | { status: 'disabled' }
  | { status: 'enabled'; hint: string }
  | { status: 'just-generated'; secret: string; hint: string }

export function WebhookTriggerConfig({
  config,
  onChange,
  workflowId,
  nodeId,
}: Props) {
  const [touched, setTouched] = React.useState<ReadonlySet<string>>(new Set())
  const [hmac, setHmac] = React.useState<HmacState>({ status: 'loading' })
  const [copied, setCopied] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [confirmDisable, setConfirmDisable] = React.useState(false)
  const [confirmRegenerate, setConfirmRegenerate] = React.useState(false)

  const canManage = !!workflowId && !!nodeId

  React.useEffect(() => {
    if (!canManage) {
      setHmac({ status: 'disabled' })
      return
    }

    let cancelled = false
    api.webhookSecrets
      .get(workflowId, nodeId)
      .then((data: WebhookSecretStatus) => {
        if (cancelled) return
        if (data.exists && data.hint) {
          setHmac({ status: 'enabled', hint: data.hint })
        } else {
          setHmac({ status: 'disabled' })
        }
      })
      .catch(() => {
        if (!cancelled) setHmac({ status: 'disabled' })
      })

    return () => {
      cancelled = true
    }
  }, [workflowId, nodeId, canManage])

  function touchField(field: string) {
    setTouched((prev) => {
      const next = new Set(prev)
      next.add(field)
      return next
    })
  }

  const schemaErrors = getConfigErrors(WebhookTriggerConfigSchema, config)
  const path = str(config, 'path')
  const extraErrors: Record<string, string> = {}
  if (path && !path.startsWith('/'))
    extraErrors['path'] = "Path must begin with '/' (e.g. /my-webhook)"
  const errors = { ...schemaErrors, ...extraErrors }
  const fieldError = (f: string) => (touched.has(f) ? errors[f] : undefined)

  async function handleEnableHmac() {
    if (!canManage) return
    setBusy(true)
    try {
      const data = await api.webhookSecrets.generate(workflowId, nodeId)
      setHmac({
        status: 'just-generated',
        secret: data.secret,
        hint: data.hint,
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleDisableHmac() {
    if (!canManage) return
    setBusy(true)
    try {
      await api.webhookSecrets.delete(workflowId, nodeId)
      setHmac({ status: 'disabled' })
    } finally {
      setBusy(false)
      setConfirmDisable(false)
    }
  }

  async function handleRegenerate() {
    if (!canManage) return
    setBusy(true)
    try {
      const data = await api.webhookSecrets.generate(workflowId, nodeId)
      setHmac({
        status: 'just-generated',
        secret: data.secret,
        hint: data.hint,
      })
    } finally {
      setBusy(false)
      setConfirmRegenerate(false)
    }
  }

  function handleCopy(secret: string) {
    void navigator.clipboard.writeText(secret).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleAcknowledge() {
    if (hmac.status === 'just-generated') {
      setHmac({ status: 'enabled', hint: hmac.hint })
    }
  }

  const hmacEnabled =
    hmac.status === 'enabled' || hmac.status === 'just-generated'

  return (
    <div className="space-y-3">
      <Field label="Method">
        <Select
          value={str(config, 'method', 'POST')}
          onValueChange={(value) => onChange({ ...config, method: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HTTP_METHODS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Path" error={fieldError('path')}>
        <Input
          value={path}
          onChange={(e) => onChange({ ...config, path: e.target.value })}
          onBlur={() => touchField('path')}
          aria-invalid={touched.has('path') && !!errors['path']}
          placeholder="/my-hook"
        />
      </Field>

      {/* HMAC Authentication */}
      <div className="border-t pt-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {hmacEnabled ? (
              <ShieldCheck size={13} className="text-green-500" />
            ) : (
              <ShieldOff size={13} className="text-muted-foreground" />
            )}
            <span className="text-xs font-medium">HMAC Authentication</span>
          </div>

          {canManage && hmac.status !== 'loading' && (
            <button
              type="button"
              role="switch"
              aria-checked={hmacEnabled}
              disabled={busy}
              onClick={() => {
                if (hmacEnabled) {
                  setConfirmDisable(true)
                } else {
                  void handleEnableHmac()
                }
              }}
              className={[
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                'transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none',
                'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                hmacEnabled ? 'bg-green-500' : 'bg-input',
              ].join(' ')}
            >
              <span
                className={[
                  'bg-background pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-transform duration-200',
                  hmacEnabled ? 'translate-x-4' : 'translate-x-0',
                ].join(' ')}
              />
            </button>
          )}
        </div>

        {!canManage && (
          <p className="text-muted-foreground text-xs">
            Save the workflow to manage HMAC authentication.
          </p>
        )}

        {/* One-time secret reveal */}
        {hmac.status === 'just-generated' && (
          <div className="mt-2 rounded-md border border-yellow-400/50 bg-yellow-50 p-3 dark:border-yellow-500/30 dark:bg-yellow-950/30">
            <p className="mb-2 text-xs font-medium text-yellow-800 dark:text-yellow-300">
              Copy this secret now — it will never be shown again.
            </p>
            <div className="mb-2 flex items-center gap-1.5">
              <code className="bg-background flex-1 rounded border px-2 py-1 font-mono text-xs break-all">
                {hmac.secret}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 w-7 shrink-0 p-0"
                onClick={() => handleCopy(hmac.secret)}
              >
                {copied ? (
                  <Check size={12} className="text-green-500" />
                ) : (
                  <Copy size={12} />
                )}
              </Button>
            </div>
            <p className="mb-2 text-xs text-yellow-700 dark:text-yellow-400">
              Add{' '}
              <code className="rounded bg-yellow-100 px-1 dark:bg-yellow-900">
                X-Webhook-Signature: sha256=&lt;hmac-sha256&gt;
              </code>{' '}
              to your requests.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 w-full text-xs"
              onClick={handleAcknowledge}
            >
              I've saved it
            </Button>
          </div>
        )}

        {/* Active secret — masked hint + regenerate */}
        {hmac.status === 'enabled' && (
          <div className="mt-2 flex items-center justify-between gap-2">
            <code className="text-muted-foreground bg-muted rounded px-2 py-1 font-mono text-xs">
              {hmac.hint}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => setConfirmRegenerate(true)}
              disabled={busy}
            >
              <RefreshCw size={11} />
              Regenerate
            </Button>
          </div>
        )}
      </div>

      {/* Confirm disable dialog */}
      <DialogRoot open={confirmDisable} onOpenChange={setConfirmDisable}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable HMAC authentication?</DialogTitle>
            <DialogDescription>
              The secret will be permanently deleted. Callers will no longer
              need to sign their requests — the webhook will be publicly
              accessible again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDisable(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDisableHmac()}
              disabled={busy}
            >
              Disable
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Confirm regenerate dialog */}
      <DialogRoot open={confirmRegenerate} onOpenChange={setConfirmRegenerate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate secret?</DialogTitle>
            <DialogDescription>
              The current secret will stop working immediately. Any callers
              using the old secret will need to be updated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmRegenerate(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleRegenerate()} disabled={busy}>
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </div>
  )
}
