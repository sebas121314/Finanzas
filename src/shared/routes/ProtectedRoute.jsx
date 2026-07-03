import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext.jsx'

export function ProtectedRoute({ allowOnboarding = false, children }) {
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!allowOnboarding && !user?.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}
