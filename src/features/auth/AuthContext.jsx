import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { authService } from './authService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => authService.getSession())

  const refreshSession = useCallback(() => {
    const currentSession = authService.getSession()
    setSession(currentSession)
    return currentSession
  }, [])

  const login = useCallback(async (payload) => {
    const nextSession = await authService.login(payload)
    setSession(nextSession)
    return nextSession
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setSession(null)
  }, [])

  const completeOnboarding = useCallback((payload) => {
    const nextSession = authService.completeOnboarding(payload)
    setSession(nextSession)
    return nextSession
  }, [])

  const updateProfile = useCallback((payload) => {
    const nextSession = authService.updateProfile(payload)
    setSession(nextSession)
    return nextSession
  }, [])

  const changePassword = useCallback((payload) => authService.changePassword(payload), [])

  const closeActiveSessions = useCallback(() => {
    const result = authService.closeActiveSessions()
    setSession(null)
    return result
  }, [])

  const toggleTwoFactor = useCallback((enabled) => {
    const nextSession = authService.toggleTwoFactor(enabled)
    setSession(nextSession)
    return nextSession
  }, [])

  const saveNotificationPreferences = useCallback((preferences) => {
    const nextSession = authService.saveNotificationPreferences(preferences)
    setSession(nextSession)
    return nextSession
  }, [])

  const deleteAccount = useCallback((password) => {
    const result = authService.deleteAccount(password)
    setSession(null)
    return result
  }, [])

  const value = useMemo(
    () => ({
      changePassword,
      closeActiveSessions,
      completeOnboarding,
      deleteAccount,
      isAuthenticated: Boolean(session),
      login,
      logout,
      refreshSession,
      saveNotificationPreferences,
      session,
      toggleTwoFactor,
      updateProfile,
      user: session?.user ?? null,
    }),
    [
      changePassword,
      closeActiveSessions,
      completeOnboarding,
      deleteAccount,
      login,
      logout,
      refreshSession,
      saveNotificationPreferences,
      session,
      toggleTwoFactor,
      updateProfile,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)

  if (!value) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }

  return value
}
