import { Navigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext.jsx'

export function PublicRoute({ children }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return children
  }

  return <Navigate to={user?.onboardingCompleted ? '/dashboard' : '/onboarding'} replace />
}
