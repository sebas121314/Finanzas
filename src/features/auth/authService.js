const STORAGE_KEY = 'finance-app.auth'
const LOGIN_ATTEMPT_LIMIT = 5
const LOCK_TIME_MS = 60 * 1000
const TOKEN_TTL_MS = 15 * 60 * 1000
const TEST_PIN = '123456'

const defaultNotificationPreferences = {
  budgetExceeded: { email: true, inApp: true },
  goalReached: { email: true, inApp: true },
  newMovement: { email: false, inApp: true },
  upcomingPayment: { email: true, inApp: true },
}

const demoUser = {
  birthDate: '1998-03-12',
  currency: 'COP',
  darkMode: false,
  email: 'demo@finance.app',
  fullName: 'Sebastia Macias',
  id: 'usr_demo',
  language: 'es',
  notificationPreferences: defaultNotificationPreferences,
  onboardingCompleted: false,
  passwordHash: encodePassword('Demo@123'),
  phone: '3001234567',
  role: 'owner',
  twoFactorEnabled: false,
  verified: true,
  createdAt: new Date('2026-07-01T00:00:00.000Z').toISOString(),
}

function createInitialState() {
  return {
    users: [demoUser],
    session: null,
    verificationRequests: [],
    passwordResetRequests: [],
    loginAttempts: {},
    onboarding: {},
    sessions: [],
  }
}

function readState() {
  if (typeof window === 'undefined') {
    return createInitialState()
  }

  const rawState = window.localStorage.getItem(STORAGE_KEY)

  if (!rawState) {
    const initialState = createInitialState()
    writeState(initialState)
    return initialState
  }

  try {
    const parsedState = JSON.parse(rawState)

    return {
      ...createInitialState(),
      ...parsedState,
      sessions: parsedState.sessions ?? [],
      users: Array.isArray(parsedState.users) ? parsedState.users.map(normalizeUser) : [demoUser],
    }
  } catch {
    const initialState = createInitialState()
    writeState(initialState)
    return initialState
  }
}

function writeState(state) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function wait(ms = 350) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

function encodePassword(password) {
  return Array.from(password)
    .map((character) => character.codePointAt(0).toString(16).padStart(4, '0'))
    .join('')
}

function generateToken(prefix) {
  const randomValue =
    typeof window !== 'undefined' && window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  return `${prefix}_${randomValue}`
}

function createSession(user, rememberMe = false) {
  return {
    accessToken: generateToken('access'),
    createdAt: new Date().toISOString(),
    deviceInfo: getDeviceInfo(),
    expiresAt: new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000).toISOString(),
    id: generateToken('ses'),
    ip: 'Local',
    rememberMe,
    user: sanitizeUser(user),
  }
}

function sanitizeUser(user) {
  const safeUser = normalizeUser(user)
  delete safeUser.passwordHash

  return safeUser
}

function normalizeUser(user) {
  return {
    ...user,
    currency: user.currency ?? 'COP',
    darkMode: Boolean(user.darkMode),
    language: user.language ?? 'es',
    notificationPreferences: normalizeNotificationPreferences(user.notificationPreferences),
    role: user.role ?? 'owner',
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
  }
}

function normalizeNotificationPreferences(preferences = {}) {
  return Object.fromEntries(
    Object.entries(defaultNotificationPreferences).map(([key, value]) => [
      key,
      {
        email: preferences[key]?.email ?? value.email,
        inApp: preferences[key]?.inApp ?? value.inApp,
      },
    ])
  )
}

function getDeviceInfo() {
  if (typeof window === 'undefined') {
    return 'Dispositivo local'
  }

  const userAgent = window.navigator?.userAgent ?? 'Navegador local'

  if (userAgent.includes('Chrome')) {
    return 'Chrome en Windows'
  }

  if (userAgent.includes('Firefox')) {
    return 'Firefox en Windows'
  }

  if (userAgent.includes('Safari')) {
    return 'Safari'
  }

  return 'Navegador local'
}

function getUserByEmail(state, email) {
  const normalizedEmail = normalizeEmail(email)
  return state.users.find((user) => user.email === normalizedEmail)
}

function getSessionUserIndex(state) {
  const userId = state.session?.user?.id

  if (!userId) {
    throw new AuthError('NO_SESSION', 'No hay una sesiÃ³n activa.')
  }

  const userIndex = state.users.findIndex((user) => user.id === userId)

  if (userIndex < 0) {
    throw new AuthError('NO_SESSION', 'No hay una sesiÃ³n activa.')
  }

  return userIndex
}

function getLoginStatus(state, email) {
  const normalizedEmail = normalizeEmail(email)
  const attemptState = state.loginAttempts[normalizedEmail]

  if (!attemptState?.lockedUntil) {
    return { locked: false }
  }

  if (attemptState.lockedUntil > Date.now()) {
    return {
      locked: true,
      secondsRemaining: Math.ceil((attemptState.lockedUntil - Date.now()) / 1000),
    }
  }

  delete state.loginAttempts[normalizedEmail]
  writeState(state)
  return { locked: false }
}

function registerFailure(state, email) {
  const normalizedEmail = normalizeEmail(email)
  const previousAttempt = state.loginAttempts[normalizedEmail] ?? { count: 0, lockedUntil: null }
  const count = previousAttempt.count + 1
  const lockedUntil = count >= LOGIN_ATTEMPT_LIMIT ? Date.now() + LOCK_TIME_MS : null

  state.loginAttempts[normalizedEmail] = { count, lockedUntil }
  writeState(state)

  return {
    count,
    locked: Boolean(lockedUntil),
    secondsRemaining: lockedUntil ? Math.ceil((lockedUntil - Date.now()) / 1000) : 0,
  }
}

function clearLoginFailures(state, email) {
  delete state.loginAttempts[normalizeEmail(email)]
  writeState(state)
}

function createVerificationRequest(userId) {
  return {
    token: generateToken('verify'),
    userId,
    pin: TEST_PIN,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  }
}

function createPasswordResetRequest(userId) {
  return {
    token: generateToken('reset'),
    userId,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  }
}

function isExpired(request) {
  return request.expiresAt <= Date.now()
}

export class AuthError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = 'AuthError'
    this.code = code
    this.details = details
  }
}

export const authService = {
  constants: {
    LOGIN_ATTEMPT_LIMIT,
    TEST_PIN,
  },

  getSession() {
    const state = readState()
    return state.session
  },

  getActiveSessions(userId) {
    const state = readState()
    return state.sessions
      .filter((session) => session.userId === userId)
      .map((session) => ({
        createdAt: session.createdAt,
        deviceInfo: session.deviceInfo,
        expiresAt: session.expiresAt,
        id: session.id,
        ip: session.ip,
        isCurrent: session.id === state.session?.id,
      }))
  },

  async login({ email, password, rememberMe }) {
    await wait()

    const state = readState()
    const loginStatus = getLoginStatus(state, email)

    if (loginStatus.locked) {
      throw new AuthError(
        'LOGIN_LOCKED',
        `Has superado los intentos permitidos. Intenta de nuevo en ${loginStatus.secondsRemaining} segundos.`,
        loginStatus
      )
    }

    const user = getUserByEmail(state, email)
    const passwordMatches = user?.passwordHash === encodePassword(password)

    if (!user || !passwordMatches || !user.verified) {
      const failure = registerFailure(state, email)
      const message = failure.locked
        ? 'Has superado los intentos permitidos. Bloqueamos temporalmente el acceso.'
        : 'No pudimos iniciar sesión con esas credenciales.'

      throw new AuthError('INVALID_CREDENTIALS', message, failure)
    }

    clearLoginFailures(state, email)
    const session = createSession(user, rememberMe)
    state.session = session
    state.sessions = [
      ...state.sessions.filter((item) => item.id !== session.id),
      {
        createdAt: session.createdAt,
        deviceInfo: session.deviceInfo,
        expiresAt: session.expiresAt,
        id: session.id,
        ip: session.ip,
        userId: user.id,
      },
    ]
    writeState(state)

    return session
  },

  logout() {
    const state = readState()
    if (state.session?.id) {
      state.sessions = state.sessions.filter((session) => session.id !== state.session.id)
    }
    state.session = null
    writeState(state)
  },

  async register(payload) {
    await wait()

    const state = readState()
    const email = normalizeEmail(payload.email)
    const existingUser = getUserByEmail(state, email)

    if (existingUser) {
      throw new AuthError('EMAIL_EXISTS', 'No fue posible crear la cuenta con esos datos.')
    }

    const user = {
      id: generateToken('usr'),
      fullName: payload.fullName.trim(),
      email,
      birthDate: payload.birthDate,
      phone: payload.phone.trim(),
      passwordHash: encodePassword(payload.password),
      verified: false,
      onboardingCompleted: false,
      currency: 'COP',
      darkMode: false,
      language: 'es',
      notificationPreferences: defaultNotificationPreferences,
      role: 'owner',
      twoFactorEnabled: false,
      createdAt: new Date().toISOString(),
    }
    const verificationRequest = createVerificationRequest(user.id)

    state.users.push(user)
    state.verificationRequests = [
      ...state.verificationRequests.filter((request) => request.userId !== user.id),
      verificationRequest,
    ]
    writeState(state)

    return {
      email,
      pin: verificationRequest.pin,
      token: verificationRequest.token,
    }
  },

  getVerification(token) {
    const state = readState()
    const request = state.verificationRequests.find((item) => item.token === token)

    if (!request) {
      return { status: 'invalid' }
    }

    if (isExpired(request)) {
      return {
        status: 'expired',
        email: state.users.find((user) => user.id === request.userId)?.email,
      }
    }

    const user = state.users.find((item) => item.id === request.userId)

    return {
      email: user?.email,
      pin: request.pin,
      status: 'valid',
      token: request.token,
    }
  },

  async resendVerification(token) {
    await wait()

    const state = readState()
    const request = state.verificationRequests.find((item) => item.token === token)

    if (!request) {
      throw new AuthError('INVALID_TOKEN', 'No fue posible generar una nueva verificación.')
    }

    const nextRequest = createVerificationRequest(request.userId)
    state.verificationRequests = [
      ...state.verificationRequests.filter((item) => item.userId !== request.userId),
      nextRequest,
    ]
    writeState(state)

    return {
      pin: nextRequest.pin,
      token: nextRequest.token,
    }
  },

  async verifyAccount({ token, pin }) {
    await wait()

    const state = readState()
    const request = state.verificationRequests.find((item) => item.token === token)

    if (!request) {
      throw new AuthError('INVALID_TOKEN', 'No fue posible validar la cuenta.')
    }

    if (isExpired(request)) {
      throw new AuthError('EXPIRED_TOKEN', 'La verificación expiró. Genera una nueva verificación.')
    }

    if (request.pin !== pin) {
      throw new AuthError('INVALID_PIN', 'El código ingresado no es válido.')
    }

    const userIndex = state.users.findIndex((user) => user.id === request.userId)

    if (userIndex < 0) {
      throw new AuthError('INVALID_TOKEN', 'No fue posible validar la cuenta.')
    }

    const verifiedUser = {
      ...state.users[userIndex],
      verified: true,
    }

    state.users[userIndex] = verifiedUser
    state.verificationRequests = state.verificationRequests.filter(
      (item) => item.userId !== verifiedUser.id
    )
    state.session = createSession(verifiedUser)
    state.sessions = [
      ...state.sessions.filter((session) => session.userId !== verifiedUser.id),
      {
        createdAt: state.session.createdAt,
        deviceInfo: state.session.deviceInfo,
        expiresAt: state.session.expiresAt,
        id: state.session.id,
        ip: state.session.ip,
        userId: verifiedUser.id,
      },
    ]
    writeState(state)

    return state.session
  },

  updateProfile(payload) {
    const state = readState()
    const userIndex = getSessionUserIndex(state)
    const currentUser = state.users[userIndex]
    const email = normalizeEmail(payload.email)
    const duplicated = state.users.some(
      (user) => user.id !== currentUser.id && user.email === email
    )

    if (duplicated) {
      throw new AuthError('EMAIL_EXISTS', 'No fue posible actualizar el email.')
    }

    const updatedUser = normalizeUser({
      ...currentUser,
      currency: payload.currency ?? currentUser.currency,
      darkMode: Boolean(payload.darkMode),
      email,
      fullName: payload.fullName?.trim() || currentUser.fullName,
      language: payload.language ?? currentUser.language,
      phone: payload.phone?.trim() ?? currentUser.phone,
    })

    state.users[userIndex] = updatedUser
    state.session = {
      ...state.session,
      user: sanitizeUser(updatedUser),
    }
    writeState(state)

    return state.session
  },

  changePassword({ currentPassword, newPassword }) {
    const state = readState()
    const userIndex = getSessionUserIndex(state)
    const user = state.users[userIndex]

    if (user.passwordHash !== encodePassword(currentPassword)) {
      throw new AuthError('INVALID_PASSWORD', 'La contraseÃ±a actual no coincide.')
    }

    state.users[userIndex] = {
      ...user,
      passwordHash: encodePassword(newPassword),
    }
    writeState(state)

    return { success: true }
  },

  closeActiveSessions() {
    const state = readState()
    const userId = state.session?.user?.id

    if (!userId) {
      throw new AuthError('NO_SESSION', 'No hay una sesiÃ³n activa.')
    }

    state.sessions = state.sessions.filter((session) => session.userId !== userId)
    state.session = null
    writeState(state)

    return { success: true }
  },

  toggleTwoFactor(enabled) {
    const state = readState()
    const userIndex = getSessionUserIndex(state)
    const updatedUser = normalizeUser({
      ...state.users[userIndex],
      twoFactorEnabled: Boolean(enabled),
    })

    state.users[userIndex] = updatedUser
    state.session = {
      ...state.session,
      user: sanitizeUser(updatedUser),
    }
    writeState(state)

    return state.session
  },

  saveNotificationPreferences(preferences) {
    const state = readState()
    const userIndex = getSessionUserIndex(state)
    const updatedUser = normalizeUser({
      ...state.users[userIndex],
      notificationPreferences: normalizeNotificationPreferences(preferences),
    })

    state.users[userIndex] = updatedUser
    state.session = {
      ...state.session,
      user: sanitizeUser(updatedUser),
    }
    writeState(state)

    return state.session
  },

  deleteAccount(password) {
    const state = readState()
    const userIndex = getSessionUserIndex(state)
    const user = state.users[userIndex]

    if (user.passwordHash !== encodePassword(password)) {
      throw new AuthError('INVALID_PASSWORD', 'La contraseÃ±a no coincide.')
    }

    state.users = state.users.filter((item) => item.id !== user.id)
    state.sessions = state.sessions.filter((session) => session.userId !== user.id)
    state.verificationRequests = state.verificationRequests.filter(
      (request) => request.userId !== user.id
    )
    state.passwordResetRequests = state.passwordResetRequests.filter(
      (request) => request.userId !== user.id
    )
    delete state.onboarding[user.id]
    state.session = null
    writeState(state)

    return { success: true }
  },

  async requestPasswordReset(email) {
    await wait()

    const state = readState()
    const user = getUserByEmail(state, email)

    if (user) {
      const resetRequest = createPasswordResetRequest(user.id)
      state.passwordResetRequests = [
        ...state.passwordResetRequests.filter((request) => request.userId !== user.id),
        resetRequest,
      ]
      writeState(state)

      return {
        token: resetRequest.token,
      }
    }

    writeState(state)
    return { token: null }
  },

  getPasswordReset(token) {
    const state = readState()
    const request = state.passwordResetRequests.find((item) => item.token === token)

    if (!request) {
      return { status: 'invalid' }
    }

    if (isExpired(request)) {
      return { status: 'expired' }
    }

    return { status: 'valid' }
  },

  async resetPassword({ token, password }) {
    await wait()

    const state = readState()
    const request = state.passwordResetRequests.find((item) => item.token === token)

    if (!request) {
      throw new AuthError('INVALID_TOKEN', 'El enlace de recuperación no es válido.')
    }

    if (isExpired(request)) {
      throw new AuthError('EXPIRED_TOKEN', 'El enlace de recuperación expiró.')
    }

    const userIndex = state.users.findIndex((user) => user.id === request.userId)

    if (userIndex < 0) {
      throw new AuthError('INVALID_TOKEN', 'El enlace de recuperación no es válido.')
    }

    state.users[userIndex] = {
      ...state.users[userIndex],
      passwordHash: encodePassword(password),
    }
    state.passwordResetRequests = state.passwordResetRequests.filter(
      (item) => item.userId !== request.userId
    )
    state.session = null
    writeState(state)

    return { success: true }
  },

  completeOnboarding(payload) {
    const state = readState()
    const session = state.session

    if (!session) {
      throw new AuthError('NO_SESSION', 'No hay una sesión activa.')
    }

    const userIndex = state.users.findIndex((user) => user.id === session.user.id)

    if (userIndex < 0) {
      throw new AuthError('NO_SESSION', 'No hay una sesión activa.')
    }

    const updatedUser = {
      ...state.users[userIndex],
      currency: payload.currency ?? state.users[userIndex].currency,
      onboardingCompleted: true,
    }

    state.users[userIndex] = updatedUser
    state.onboarding[updatedUser.id] = {
      account: payload.account ?? null,
      categories: payload.categories ?? [],
      completedAt: new Date().toISOString(),
    }
    state.session = {
      ...session,
      user: sanitizeUser(updatedUser),
    }
    writeState(state)

    return state.session
  },
}
