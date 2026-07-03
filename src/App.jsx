import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AdminPage } from './features/admin/AdminPage.jsx'
import { ReportsPage } from './features/analytics/pages/ReportsPage.jsx'
import { AuthProvider } from './features/auth/AuthContext.jsx'
import { ForgotPasswordPage } from './features/auth/pages/ForgotPasswordPage.jsx'
import { LoginPage } from './features/auth/pages/LoginPage.jsx'
import { OnboardingPage } from './features/auth/pages/OnboardingPage.jsx'
import { RegisterPage } from './features/auth/pages/RegisterPage.jsx'
import { ResetPasswordPage } from './features/auth/pages/ResetPasswordPage.jsx'
import { VerifyAccountPage } from './features/auth/pages/VerifyAccountPage.jsx'
import { DashboardPage } from './features/dashboard/DashboardPage.jsx'
import { AccountsPage } from './features/finance/pages/AccountsPage.jsx'
import { BudgetsPage } from './features/finance/pages/BudgetsPage.jsx'
import { CategoriesPage } from './features/finance/pages/CategoriesPage.jsx'
import { RecurringPage } from './features/finance/pages/RecurringPage.jsx'
import { SavingsGoalsPage } from './features/finance/pages/SavingsGoalsPage.jsx'
import { TransactionFormPage } from './features/finance/pages/TransactionFormPage.jsx'
import { TransactionsPage } from './features/finance/pages/TransactionsPage.jsx'
import { ProfilePage } from './features/profile/ProfilePage.jsx'
import { AppShell } from './shared/layout/AppShell.jsx'
import { ProtectedRoute } from './shared/routes/ProtectedRoute.jsx'
import { PublicRoute } from './shared/routes/PublicRoute.jsx'
import { ToastProvider } from './shared/ui/Toast.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function createAppRouter() {
  return createBrowserRouter([
    {
      path: '/',
      element: <Navigate to="/dashboard" replace />,
    },
    {
      path: '/login',
      element: (
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      ),
    },
    {
      path: '/register',
      element: (
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      ),
    },
    {
      path: '/verify-account',
      element: <VerifyAccountPage />,
    },
    {
      path: '/verify-account/:token',
      element: <VerifyAccountPage />,
    },
    {
      path: '/forgot-password',
      element: (
        <PublicRoute>
          <ForgotPasswordPage />
        </PublicRoute>
      ),
    },
    {
      path: '/reset-password/:token',
      element: (
        <PublicRoute>
          <ResetPasswordPage />
        </PublicRoute>
      ),
    },
    {
      path: '/onboarding',
      element: (
        <ProtectedRoute allowOnboarding>
          <OnboardingPage />
        </ProtectedRoute>
      ),
    },
    {
      path: '/dashboard',
      element: (
        <ProtectedRoute>
          <AppShell>
            <DashboardPage />
          </AppShell>
        </ProtectedRoute>
      ),
    },
    {
      path: '/accounts',
      element: (
        <ProtectedRoute>
          <AppShell>
            <AccountsPage />
          </AppShell>
        </ProtectedRoute>
      ),
    },
    {
      path: '/categories',
      element: (
        <ProtectedRoute>
          <AppShell>
            <CategoriesPage />
          </AppShell>
        </ProtectedRoute>
      ),
    },
    {
      path: '/transactions',
      element: (
        <ProtectedRoute>
          <AppShell>
            <TransactionsPage />
          </AppShell>
        </ProtectedRoute>
      ),
    },
    {
      path: '/transactions/new',
      element: (
        <ProtectedRoute>
          <AppShell>
            <TransactionFormPage />
          </AppShell>
        </ProtectedRoute>
      ),
    },
    {
      path: '/transactions/:transactionId/edit',
      element: (
        <ProtectedRoute>
          <AppShell>
            <TransactionFormPage mode="edit" />
          </AppShell>
        </ProtectedRoute>
      ),
    },
    {
      path: '/transactions/:transactionId/duplicate',
      element: (
        <ProtectedRoute>
          <AppShell>
            <TransactionFormPage mode="duplicate" />
          </AppShell>
        </ProtectedRoute>
      ),
    },
    {
      path: '/budgets',
      element: (
        <ProtectedRoute>
          <AppShell>
            <BudgetsPage />
          </AppShell>
        </ProtectedRoute>
      ),
    },
    {
      path: '/savings-goals',
      element: (
        <ProtectedRoute>
          <AppShell>
            <SavingsGoalsPage />
          </AppShell>
        </ProtectedRoute>
      ),
    },
    {
      path: '/reports',
      element: (
        <ProtectedRoute>
          <AppShell>
            <ReportsPage />
          </AppShell>
        </ProtectedRoute>
      ),
    },
    {
      path: '/profile',
      element: (
        <ProtectedRoute>
          <AppShell>
            <ProfilePage />
          </AppShell>
        </ProtectedRoute>
      ),
    },
    {
      path: '/settings',
      element: (
        <ProtectedRoute>
          <AppShell>
            <ProfilePage />
          </AppShell>
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin',
      element: (
        <ProtectedRoute>
          <AppShell>
            <AdminPage />
          </AppShell>
        </ProtectedRoute>
      ),
    },
    {
      path: '/recurring',
      element: (
        <ProtectedRoute>
          <AppShell>
            <RecurringPage />
          </AppShell>
        </ProtectedRoute>
      ),
    },
    {
      path: '*',
      element: <Navigate to="/dashboard" replace />,
    },
  ])
}

function App() {
  const router = useMemo(() => createAppRouter(), [])

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
