const STORAGE_KEY = 'finance-app.shared-access'

function createInitialState() {
  return {
    auditLog: [],
    members: [],
  }
}

function readState() {
  if (typeof window === 'undefined') {
    return createInitialState()
  }

  try {
    return {
      ...createInitialState(),
      ...JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}'),
    }
  } catch {
    return createInitialState()
  }
}

function writeState(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function createId(prefix) {
  return `${prefix}_${window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`
}

function pushAudit(state, action, userEmail) {
  state.auditLog.unshift({
    action,
    date: new Date().toISOString(),
    id: createId('aud'),
    userEmail,
  })
}

export const adminService = {
  getSnapshot() {
    return readState()
  },

  inviteMember({ email, role }) {
    const state = readState()
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      throw new Error('Ingresa un email para invitar.')
    }

    const existing = state.members.find((member) => member.email === normalizedEmail)

    if (existing) {
      throw new Error('El usuario ya tiene acceso compartido.')
    }

    state.members.unshift({
      email: normalizedEmail,
      id: createId('shr'),
      invitedAt: new Date().toISOString(),
      role,
      status: 'invited',
    })
    pushAudit(state, `Invitacion enviada como ${role}`, normalizedEmail)
    writeState(state)

    return state
  },

  updateRole(memberId, role) {
    const state = readState()
    const member = state.members.find((item) => item.id === memberId)

    if (member) {
      member.role = role
      pushAudit(state, `Rol actualizado a ${role}`, member.email)
      writeState(state)
    }

    return state
  },

  revokeAccess(memberId) {
    const state = readState()
    const member = state.members.find((item) => item.id === memberId)

    if (member) {
      state.members = state.members.filter((item) => item.id !== memberId)
      pushAudit(state, 'Acceso revocado', member.email)
      writeState(state)
    }

    return state
  },
}
