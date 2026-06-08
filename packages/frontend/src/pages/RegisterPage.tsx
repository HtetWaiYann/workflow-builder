import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CircleCheck } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Navbar } from '@/components/Navbar'

const PASSWORD_RULES = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (p: string) => p.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter (A–Z)',
    test: (p: string) => /[A-Z]/.test(p),
  },
  {
    id: 'number',
    label: 'One number (0–9)',
    test: (p: string) => /[0-9]/.test(p),
  },
  {
    id: 'special',
    label: 'One special character',
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
] as const

export function RegisterPage() {
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard'
  const prefillEmail = searchParams.get('email') ?? ''

  const [name, setName] = useState('')
  const [email, setEmail] = useState(prefillEmail)
  const [password, setPassword] = useState('')
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const allRulesPassed = PASSWORD_RULES.every((r) => r.test(password))
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const { user, workspaces } = await api.auth.register({
        email,
        password,
        name: name || undefined,
      })
      setAuth(user, workspaces)
      navigate(redirect)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen items-center justify-center pt-14">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>
              Sign up to get started with Triggr.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <CardContent className="flex flex-col gap-4">
              {error && (
                <p
                  role="alert"
                  aria-live="polite"
                  className="text-destructive text-sm"
                >
                  {error}
                </p>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (!passwordTouched) setPasswordTouched(true)
                  }}
                />
                {passwordTouched && (
                  <ul
                    className="mt-1 flex flex-col gap-1"
                    aria-label="Password requirements"
                  >
                    {PASSWORD_RULES.map((rule) => {
                      const passed = rule.test(password)
                      return (
                        <li
                          key={rule.id}
                          className={`flex items-center gap-1.5 text-xs ${
                            passed
                              ? 'text-green-500 dark:text-green-400'
                              : 'text-muted-foreground'
                          }`}
                        >
                          <CircleCheck
                            className={`size-3.5 shrink-0 ${passed ? 'opacity-100' : 'opacity-30'}`}
                          />
                          {rule.label}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !allRulesPassed}
              >
                {isSubmitting ? 'Creating account…' : 'Create account'}
              </Button>
              <p className="text-muted-foreground text-sm">
                Already have an account?{' '}
                <Link
                  to={`/login?redirect=${encodeURIComponent(redirect)}`}
                  className="text-foreground underline underline-offset-4"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  )
}
