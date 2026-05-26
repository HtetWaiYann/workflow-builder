import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useInitAuth } from '@/hooks/useInitAuth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PublicRoute } from '@/components/PublicRoute'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { CanvasPage } from '@/pages/CanvasPage'
import { Toaster } from '@/components/ui/sonner'

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
      <Route path="/dashboard" element={<Navigate to="/workflows" replace />} />
      <Route path="/" element={<Navigate to="/workflows" replace />} />
      <Route path="*" element={<Navigate to="/workflows" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster />
    </BrowserRouter>
  )
}

export default App
