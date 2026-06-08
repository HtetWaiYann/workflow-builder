import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useInitAuth } from '@/hooks/useInitAuth'
import { useThemeStore } from '@/stores/themeStore'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { WorkspaceRoute } from '@/components/WorkspaceRoute'
import { PublicRoute } from '@/components/PublicRoute'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { CanvasPage } from '@/pages/CanvasPage'
import { VariablesPage } from '@/pages/VariablesPage'
import { WorkspaceSettingsPage } from '@/pages/WorkspaceSettingsPage'
import { AcceptInvitePage } from '@/pages/AcceptInvitePage'
import { CreateFirstWorkspacePage } from '@/pages/CreateFirstWorkspacePage'
import { LandingPage } from '@/pages/LandingPage'
import { Toaster } from '@/components/ui/sonner'

function ThemeApplier() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    if (theme !== 'system') {
      root.classList.toggle('dark', theme === 'dark')
      return
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    function handleChange(e: MediaQueryListEvent) {
      root.classList.toggle('dark', e.matches)
    }
    root.classList.toggle('dark', mq.matches)
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [theme])

  return null
}

function AppRoutes() {
  useInitAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/workspaces/new"
        element={
          <ProtectedRoute>
            <CreateFirstWorkspacePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workflows"
        element={
          <WorkspaceRoute>
            <DashboardPage />
          </WorkspaceRoute>
        }
      />
      <Route
        path="/workflows/:id"
        element={
          <WorkspaceRoute>
            <CanvasPage />
          </WorkspaceRoute>
        }
      />
      <Route
        path="/settings/variables"
        element={
          <WorkspaceRoute>
            <VariablesPage />
          </WorkspaceRoute>
        }
      />
      <Route
        path="/workspaces/:workspaceId/settings"
        element={
          <WorkspaceRoute>
            <WorkspaceSettingsPage />
          </WorkspaceRoute>
        }
      />
      <Route path="/invites/:token" element={<AcceptInvitePage />} />
      <Route path="/dashboard" element={<Navigate to="/workflows" replace />} />
      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ThemeApplier />
      <AppRoutes />
      <Toaster />
    </BrowserRouter>
  )
}

export default App
