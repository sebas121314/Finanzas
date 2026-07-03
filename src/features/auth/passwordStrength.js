import { passwordSpecialCharacterRegex } from './authSchemas.js'

export function getPasswordStrength(password = '') {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    passwordSpecialCharacterRegex.test(password),
  ]
  const score = checks.filter(Boolean).length

  if (!password) {
    return { label: 'Sin contraseña', percent: 0, tone: 'neutral' }
  }

  if (score <= 2) {
    return { label: 'Débil', percent: 33, tone: 'danger' }
  }

  if (score <= 4) {
    return { label: 'Media', percent: 66, tone: 'warning' }
  }

  return { label: 'Fuerte', percent: 100, tone: 'success' }
}
