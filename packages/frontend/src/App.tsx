import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useInitAuth } from '@/hooks/useInitAuth'
import { useThemeStore } from '@/stores/themeStore'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PublicRoute } from '@/components/PublicRoute'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { CanvasPage } from '@/pages/CanvasPage'
import { VariablesPage } from '@/pages/VariablesPage'
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
        path="/workflows"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workflows/:id"
        element={
          <ProtectedRoute>
            <CanvasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/variables"
        element={
          <ProtectedRoute>
            <VariablesPage />
          </ProtectedRoute>
        }
      />
      <Route path="/dashboard" element={<Navigate to="/workflows" replace />} />
      <Route path="/" element={<Navigate to="/workflows" replace />} />
      <Route path="*" element={<Navigate to="/workflows" replace />} />
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
