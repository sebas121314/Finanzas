const STORAGE_KEY = 'finance-app.finance'
const AUTH_STORAGE_KEY = 'finance-app.auth'
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024
const ALLOWED_ATTACHMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

export const accountTypes = [
  { label: 'Efectivo', value: 'cash' },
  { label: 'Débito', value: 'debit' },
  { label: 'Crédito', value: 'credit' },
  { label: 'Ahorros', value: 'savings' },
  { label: 'Inversión', value: 'investment' },
]

export const currencies = ['COP', 'USD', 'EUR', 'MXN']

export const categoryTypes = [
  { label: 'Gasto', value: 'expense' },
  { label: 'Ingreso', value: 'income' },
]

export const paymentMethods = [
  { label: 'Efectivo', value: 'cash' },
  { label: 'Débito', value: 'debit' },
  { label: 'Crédito', value: 'credit' },
  { label: 'Transferencia', value: 'transfer' },
]

export const recurringFrequencies = [
  { label: 'Diaria', value: 'daily' },
  { label: 'Semanal', value: 'weekly' },
  { label: 'Mensual', value: 'monthly' },
  { label: 'Anual', value: 'yearly' },
]

export const budgetPeriods = [
  { label: 'Mensual', value: 'monthly' },
  { label: 'Semanal', value: 'weekly' },
  { label: 'Anual', value: 'yearly' },
]

export const colorOptions = ['#1f7a4f', '#2d7c96', '#d6a93a', '#a24e30', '#315b78', '#6d5aa7']

export const iconOptions = ['wallet', 'bank', 'card', 'cash', 'chart', 'tag', 'home', 'cart']

export class FinanceError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = 'FinanceError'
    this.code = code
    this.details = details
  }
}

function createInitialState() {
  return { users: {} }
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
    return { ...createInitialState(), ...JSON.parse(rawState) }
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
  window.dispatchEvent(new CustomEvent('finance-app:finance-updated'))
}

function createUserState(userId) {
  const onboarding = readOnboarding(userId)
  const account = onboarding?.account?.name
    ? [
        {
          active: true,
          color: '#1f7a4f',
          createdAt: new Date().toISOString(),
          currency: 'COP',
          currentBalance: Number(onboarding.account.balance || 0),
          icon: 'bank',
          id: createId('acc'),
          initialBalance: Number(onboarding.account.balance || 0),
          name: onboarding.account.name,
          type: mapOnboardingAccountType(onboarding.account.type),
          userId,
        },
      ]
    : []
  const categories = (onboarding?.categories ?? []).map((category, index) => ({
    color: colorOptions[index % colorOptions.length],
    icon: category === 'Salario' ? 'cash' : 'tag',
    id: createId('cat'),
    name: category,
    parentId: '',
    type: category === 'Salario' ? 'income' : 'expense',
    userId,
  }))

  return {
    accounts: account,
    budgetHistory: [],
    budgets: [],
    categories,
    goalContributions: [],
    notifications: [],
    recurringTransactions: [],
    savingsGoals: [],
    transactions: [],
    userId,
  }
}

function readOnboarding(userId) {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const authState = JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEY) ?? '{}')
    return authState.onboarding?.[userId] ?? null
  } catch {
    return null
  }
}

function mapOnboardingAccountType(type) {
  const normalizedType = String(type ?? '').toLowerCase()

  if (normalizedType.includes('efectivo')) {
    return 'cash'
  }

  if (normalizedType.includes('tarjeta')) {
    return 'credit'
  }

  return 'debit'
}

function getUserState(state, userId) {
  if (!state.users[userId]) {
    state.users[userId] = createUserState(userId)
  }

  state.users[userId] = {
    ...createUserState(userId),
    ...state.users[userId],
    accounts: state.users[userId].accounts ?? [],
    budgetHistory: state.users[userId].budgetHistory ?? [],
    budgets: state.users[userId].budgets ?? [],
    categories: state.users[userId].categories ?? [],
    goalContributions: state.users[userId].goalContributions ?? [],
    notifications: state.users[userId].notifications ?? [],
    recurringTransactions: state.users[userId].recurringTransactions ?? [],
    savingsGoals: state.users[userId].savingsGoals ?? [],
    transactions: state.users[userId].transactions ?? [],
    userId,
  }

  return state.users[userId]
}

function createId(prefix) {
  const randomValue =
    typeof window !== 'undefined' && window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  return `${prefix}_${randomValue}`
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function toAmount(value) {
  const amount = Number(value)

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new FinanceError('INVALID_AMOUNT', 'Ingresa un monto mayor a cero.')
  }

  return amount
}

function getAccount(userState, accountId) {
  return userState.accounts.find((account) => account.id === accountId)
}

function getCategory(userState, categoryId) {
  if (!categoryId) {
    return null
  }

  return userState.categories.find((category) => category.id === categoryId)
}

function applyTransactionImpact(userState, transaction, direction = 1) {
  const account = getAccount(userState, transaction.accountId)

  if (!account) {
    throw new FinanceError('ACCOUNT_NOT_FOUND', 'Selecciona una cuenta válida.')
  }

  if (transaction.type === 'expense') {
    account.currentBalance -= transaction.amount * direction
  }

  if (transaction.type === 'income') {
    account.currentBalance += transaction.amount * direction
  }
}

function revertTransactionImpact(userState, transaction) {
  applyTransactionImpact(userState, transaction, -1)
}

function applyTransferReversal(userState, transferGroupId) {
  const transferItems = userState.transactions.filter(
    (transaction) => transaction.transferGroupId === transferGroupId
  )

  transferItems.forEach((transaction) => {
    const account = getAccount(userState, transaction.accountId)

    if (account) {
      account.currentBalance -= transaction.amount
    }
  })

  userState.transactions = userState.transactions.filter(
    (transaction) => transaction.transferGroupId !== transferGroupId
  )
}

function normalizeName(name) {
  return name.trim().toLowerCase()
}

function validateCategoryAvailability(userState, categoryId, type) {
  const category = getCategory(userState, categoryId)

  if (!category || category.type !== type) {
    throw new FinanceError('CATEGORY_REQUIRED', 'Selecciona una categoría válida.')
  }

  return category
}

function validateAccountAvailability(userState, accountId) {
  const account = getAccount(userState, accountId)

  if (!account || !account.active) {
    throw new FinanceError('ACCOUNT_REQUIRED', 'Selecciona una cuenta activa.')
  }

  return account
}

function validateDate(date) {
  if (!date) {
    throw new FinanceError('DATE_REQUIRED', 'Selecciona una fecha.')
  }

  return date
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((tag) => tag.trim()).filter(Boolean)
  }

  return String(tags ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function normalizeAttachment(attachment) {
  if (!attachment) {
    return null
  }

  if (!ALLOWED_ATTACHMENT_TYPES.includes(attachment.type)) {
    throw new FinanceError('INVALID_ATTACHMENT_TYPE', 'Adjunta una imagen o PDF válido.')
  }

  if (attachment.size > MAX_ATTACHMENT_SIZE) {
    throw new FinanceError('INVALID_ATTACHMENT_SIZE', 'El comprobante no puede superar 5 MB.')
  }

  return {
    name: attachment.name,
    size: attachment.size,
    type: attachment.type,
  }
}

function createTransactionPayload(userState, userId, payload, currentTransaction = null) {
  const type = payload.type

  if (!['expense', 'income'].includes(type)) {
    throw new FinanceError('INVALID_TYPE', 'Selecciona gasto o ingreso.')
  }

  const amount = toAmount(payload.amount)
  validateCategoryAvailability(userState, payload.categoryId, type)
  validateAccountAvailability(userState, payload.accountId)
  validateDate(payload.date)

  return {
    accountId: payload.accountId,
    amount,
    attachment: payload.attachment ?? currentTransaction?.attachment ?? null,
    categoryId: payload.categoryId,
    createdAt: currentTransaction?.createdAt ?? new Date().toISOString(),
    currency: payload.currency ?? getAccount(userState, payload.accountId).currency,
    date: payload.date,
    description: payload.description?.trim() ?? '',
    id: currentTransaction?.id ?? createId('txn'),
    paymentMethod: payload.paymentMethod || 'cash',
    recurrentId: currentTransaction?.recurrentId ?? payload.recurrentId ?? '',
    status: 'posted',
    tags: normalizeTags(payload.tags),
    transferGroupId: '',
    type,
    userId,
  }
}

function addFrequency(dateValue, frequency) {
  const date = new Date(`${dateValue}T00:00:00`)

  if (frequency === 'daily') {
    date.setDate(date.getDate() + 1)
  }

  if (frequency === 'weekly') {
    date.setDate(date.getDate() + 7)
  }

  if (frequency === 'monthly') {
    date.setMonth(date.getMonth() + 1)
  }

  if (frequency === 'yearly') {
    date.setFullYear(date.getFullYear() + 1)
  }

  return date.toISOString().slice(0, 10)
}

function getPeriodBounds(period, referenceDate = todayISO(), offset = 0) {
  const date = new Date(`${referenceDate}T00:00:00`)

  if (period === 'weekly') {
    date.setDate(date.getDate() + offset * 7)
    const day = date.getDay() || 7
    const start = new Date(date)
    start.setDate(date.getDate() - day + 1)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)

    return {
      end: end.toISOString().slice(0, 10),
      label: `${start.toISOString().slice(0, 10)} - ${end.toISOString().slice(0, 10)}`,
      start: start.toISOString().slice(0, 10),
    }
  }

  if (period === 'yearly') {
    const year = date.getFullYear() + offset

    return {
      end: `${year}-12-31`,
      label: `${year}`,
      start: `${year}-01-01`,
    }
  }

  date.setMonth(date.getMonth() + offset)
  const year = date.getFullYear()
  const month = date.getMonth()
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)

  return {
    end: end.toISOString().slice(0, 10),
    label: start.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
    start: start.toISOString().slice(0, 10),
  }
}

function dateInRange(date, start, end) {
  return date >= start && date <= end
}

function budgetCategoryLabel(userState, budget) {
  if (!budget.categoryId) {
    return 'General'
  }

  return getCategory(userState, budget.categoryId)?.name ?? 'Categoría eliminada'
}

function calculateBudgetProgress(userState, budget, offset = 0) {
  const period = getPeriodBounds(budget.period, todayISO(), offset)
  const used = userState.transactions
    .filter(
      (transaction) =>
        transaction.type === 'expense' &&
        dateInRange(transaction.date, period.start, period.end) &&
        (!budget.categoryId || transaction.categoryId === budget.categoryId)
    )
    .reduce((total, transaction) => total + transaction.amount, 0)
  const limit = Number(budget.limit)
  const available = limit - used
  const percent = limit > 0 ? Math.round((used / limit) * 100) : 0

  return {
    ...budget,
    available,
    categoryName: budgetCategoryLabel(userState, budget),
    limit,
    percent,
    periodEnd: period.end,
    periodLabel: period.label,
    periodStart: period.start,
    status: percent > 100 ? 'exceeded' : 'on-track',
    used,
  }
}

function pushNotification(userState, notification) {
  if (!shouldNotify(userState.userId, notification.type, 'inApp')) {
    return false
  }

  if (notification.key && userState.notifications.some((item) => item.key === notification.key)) {
    return false
  }

  userState.notifications.push({
    createdAt: new Date().toISOString(),
    emailQueued: shouldNotify(userState.userId, notification.type, 'email'),
    id: createId('ntf'),
    read: false,
    relatedTo: notification.relatedTo ?? relatedRouteForNotification(notification.type),
    ...notification,
  })

  return true
}

function shouldNotify(userId, type, channel) {
  const key = notificationPreferenceKey(type)

  if (!userId || !key || typeof window === 'undefined') {
    return true
  }

  try {
    const authState = JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEY) ?? '{}')
    const user = authState.users?.find((item) => item.id === userId)
    return user?.notificationPreferences?.[key]?.[channel] ?? true
  } catch {
    return true
  }
}

function notificationPreferenceKey(type) {
  if (type?.startsWith('budget')) {
    return 'budgetExceeded'
  }

  if (type?.startsWith('goal')) {
    return 'goalReached'
  }

  if (type === 'recurring' || type === 'transaction-created') {
    return 'newMovement'
  }

  return 'upcomingPayment'
}

function relatedRouteForNotification(type) {
  if (type?.startsWith('budget')) {
    return '/budgets'
  }

  if (type?.startsWith('goal')) {
    return '/savings-goals'
  }

  if (type === 'recurring' || type === 'transaction-created') {
    return '/transactions'
  }

  return '/dashboard'
}

function processBudgetAlerts(userState) {
  let changed = false

  userState.budgets.forEach((budget) => {
    const progress = calculateBudgetProgress(userState, budget)
    const periodKey = `${budget.id}:${progress.periodStart}:${progress.periodEnd}`

    if (progress.percent > 100) {
      changed =
        pushNotification(userState, {
          key: `${periodKey}:exceeded`,
          message: `El presupuesto ${progress.categoryName} fue excedido.`,
          type: 'budget-exceeded',
        }) || changed
      return
    }

    if (progress.percent >= budget.alertThreshold) {
      changed =
        pushNotification(userState, {
          key: `${periodKey}:threshold`,
          message: `El presupuesto ${progress.categoryName} alcanzó el ${progress.percent}% de uso.`,
          type: 'budget-threshold',
        }) || changed
    }
  })

  return changed
}

function budgetHistoryFor(userState) {
  return [
    ...userState.budgetHistory,
    ...userState.budgets.map((budget) => {
      const previous = calculateBudgetProgress(userState, budget, -1)

      return {
        ...previous,
        id: `${budget.id}:${previous.periodStart}`,
        result: previous.percent > 100 ? 'excedido' : 'cumplido',
      }
    }),
  ]
}

function getSavingsGoal(userState, goalId) {
  return userState.savingsGoals.find((goal) => goal.id === goalId)
}

function goalWithProgress(userState, goal) {
  const contributions = userState.goalContributions.filter(
    (contribution) => contribution.goalId === goal.id
  )
  const currentAmount = contributions.reduce(
    (total, contribution) => total + contribution.amount,
    0
  )
  const percent =
    goal.targetAmount > 0 ? Math.min(100, Math.round((currentAmount / goal.targetAmount) * 100)) : 0
  const status =
    goal.status === 'cancelled'
      ? 'cancelled'
      : currentAmount >= goal.targetAmount
        ? 'fulfilled'
        : 'active'

  return {
    ...goal,
    contributions,
    currentAmount,
    percent,
    status,
  }
}

function processGoalCompletion(userState, goal) {
  const progress = goalWithProgress(userState, goal)

  if (progress.status !== 'fulfilled' || goal.status === 'fulfilled') {
    goal.status = progress.status
    return false
  }

  goal.status = 'fulfilled'

  return pushNotification(userState, {
    key: `${goal.id}:fulfilled`,
    message: `La meta ${goal.name} fue cumplida.`,
    type: 'goal-fulfilled',
  })
}

function addGoalContributionRecord(userState, goalId, payload, generatedBy = '') {
  const goal = getSavingsGoal(userState, goalId)

  if (!goal) {
    throw new FinanceError('GOAL_NOT_FOUND', 'No fue posible encontrar la meta.')
  }

  const amount = toAmount(payload.amount)
  const date = validateDate(payload.date)

  userState.goalContributions.push({
    amount,
    date,
    generatedBy,
    goalId,
    id: createId('gct'),
    note: payload.note?.trim() ?? '',
  })

  return processGoalCompletion(userState, goal)
}

function processDueRecurrences(userState, userId) {
  const today = todayISO()
  const generated = []

  userState.recurringTransactions = userState.recurringTransactions.map((recurring) => {
    if (!recurring.active) {
      return recurring
    }

    let nextDate = recurring.nextDate
    let guard = 0

    while (
      nextDate <= today &&
      (!recurring.endDate || nextDate <= recurring.endDate) &&
      guard < 24
    ) {
      const transaction = {
        ...recurring.template,
        createdAt: new Date().toISOString(),
        date: nextDate,
        id: createId('txn'),
        recurrentId: recurring.id,
        userId,
      }

      if (transaction.kind === 'goal-contribution') {
        addGoalContributionRecord(
          userState,
          transaction.goalId,
          {
            amount: transaction.amount,
            date: nextDate,
            note: transaction.description,
          },
          recurring.id
        )
        generated.push(transaction)
      } else {
        userState.transactions.push(transaction)
        applyTransactionImpact(userState, transaction)
        generated.push(transaction)
      }
      nextDate = addFrequency(nextDate, recurring.frequency)
      guard += 1
    }

    return {
      ...recurring,
      active: recurring.endDate && nextDate > recurring.endDate ? false : recurring.active,
      nextDate,
    }
  })

  if (generated.length) {
    userState.notifications.push({
      createdAt: new Date().toISOString(),
      id: createId('ntf'),
      message: `Se generaron ${generated.length} movimientos recurrentes pendientes.`,
      read: false,
      type: 'recurring',
    })
  }

  return generated
}

function sortedByDateDesc(items) {
  return [...items].sort((left, right) => right.date.localeCompare(left.date))
}

function snapshotFor(userState) {
  return {
    accounts: [...userState.accounts],
    activeAccounts: userState.accounts.filter((account) => account.active),
    budgetHistory: budgetHistoryFor(userState),
    budgets: userState.budgets.map((budget) => calculateBudgetProgress(userState, budget)),
    categories: [...userState.categories],
    goalContributions: [...userState.goalContributions],
    notifications: [...userState.notifications],
    recurringTransactions: [...userState.recurringTransactions],
    savingsGoals: userState.savingsGoals.map((goal) => goalWithProgress(userState, goal)),
    transactions: sortedByDateDesc(userState.transactions),
  }
}

export const financeService = {
  constants: {
    ALLOWED_ATTACHMENT_TYPES,
    MAX_ATTACHMENT_SIZE,
  },

  getSnapshot(userId) {
    const state = readState()
    const existed = Boolean(state.users[userId])
    const userState = getUserState(state, userId)
    const generated = processDueRecurrences(userState, userId)
    const budgetAlertsChanged = processBudgetAlerts(userState)

    if (!existed || generated.length || budgetAlertsChanged) {
      writeState(state)
    }

    return snapshotFor(userState)
  },

  getDashboard(userId) {
    const snapshot = this.getSnapshot(userId)
    const balance = snapshot.accounts
      .filter((account) => account.active)
      .reduce((total, account) => total + account.currentBalance, 0)
    const income = snapshot.transactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((total, transaction) => total + transaction.amount, 0)
    const expenses = snapshot.transactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((total, transaction) => total + transaction.amount, 0)

    return {
      balance,
      expenses,
      income,
      recentTransactions: snapshot.transactions.slice(0, 5),
    }
  },

  saveBudget(userId, payload) {
    const state = readState()
    const userState = getUserState(state, userId)
    const limit = toAmount(payload.limit)
    const alertThreshold = Number(payload.alertThreshold || 80)

    if (!budgetPeriods.some((period) => period.value === payload.period)) {
      throw new FinanceError('INVALID_PERIOD', 'Selecciona un período válido.')
    }

    if (!Number.isFinite(alertThreshold) || alertThreshold <= 0 || alertThreshold > 100) {
      throw new FinanceError('INVALID_THRESHOLD', 'El umbral debe estar entre 1 y 100.')
    }

    if (payload.categoryId) {
      const category = getCategory(userState, payload.categoryId)

      if (!category || category.type !== 'expense') {
        throw new FinanceError('INVALID_BUDGET_CATEGORY', 'Selecciona una categoría de gasto.')
      }
    }

    if (payload.id) {
      const budget = userState.budgets.find((item) => item.id === payload.id)

      if (!budget) {
        throw new FinanceError('BUDGET_NOT_FOUND', 'No fue posible encontrar el presupuesto.')
      }

      Object.assign(budget, {
        alertThreshold,
        categoryId: payload.categoryId ?? '',
        limit,
        period: payload.period,
        rollover: Boolean(payload.rollover),
      })
    } else {
      userState.budgets.push({
        alertThreshold,
        categoryId: payload.categoryId ?? '',
        createdAt: new Date().toISOString(),
        id: createId('bdg'),
        limit,
        period: payload.period,
        rollover: Boolean(payload.rollover),
        userId,
      })
    }

    processBudgetAlerts(userState)
    writeState(state)
    return snapshotFor(userState)
  },

  deleteBudget(userId, budgetId) {
    const state = readState()
    const userState = getUserState(state, userId)
    const budget = userState.budgets.find((item) => item.id === budgetId)

    if (!budget) {
      throw new FinanceError('BUDGET_NOT_FOUND', 'No fue posible encontrar el presupuesto.')
    }

    const progress = calculateBudgetProgress(userState, budget)
    userState.budgetHistory.push({
      ...progress,
      deletedAt: new Date().toISOString(),
      id: `${budget.id}:${progress.periodStart}:deleted`,
      result: progress.percent > 100 ? 'excedido' : 'cumplido',
    })
    userState.budgets = userState.budgets.filter((item) => item.id !== budgetId)
    writeState(state)

    return snapshotFor(userState)
  },

  saveSavingsGoal(userId, payload) {
    const state = readState()
    const userState = getUserState(state, userId)
    const targetAmount = toAmount(payload.targetAmount)

    if (!payload.name?.trim()) {
      throw new FinanceError('GOAL_NAME_REQUIRED', 'Ingresa el nombre de la meta.')
    }

    if (!payload.targetDate) {
      throw new FinanceError('GOAL_DATE_REQUIRED', 'Selecciona una fecha objetivo.')
    }

    if (payload.accountId) {
      validateAccountAvailability(userState, payload.accountId)
    }

    let goal

    if (payload.id) {
      goal = getSavingsGoal(userState, payload.id)

      if (!goal) {
        throw new FinanceError('GOAL_NOT_FOUND', 'No fue posible encontrar la meta.')
      }

      Object.assign(goal, {
        accountId: payload.accountId ?? '',
        description: payload.description?.trim() ?? '',
        name: payload.name.trim(),
        targetAmount,
        targetDate: payload.targetDate,
      })
    } else {
      goal = {
        accountId: payload.accountId ?? '',
        createdAt: new Date().toISOString(),
        description: payload.description?.trim() ?? '',
        id: createId('gol'),
        name: payload.name.trim(),
        status: 'active',
        targetAmount,
        targetDate: payload.targetDate,
        userId,
      }
      userState.savingsGoals.push(goal)
    }

    userState.recurringTransactions = userState.recurringTransactions.filter(
      (recurring) => recurring.template?.goalId !== goal.id
    )

    if (payload.autoContribution) {
      const amount = toAmount(payload.autoAmount)
      const frequency = payload.autoFrequency || 'monthly'

      userState.recurringTransactions.push({
        active: true,
        createdAt: new Date().toISOString(),
        endDate: '',
        frequency,
        id: createId('rec'),
        nextDate: addFrequency(todayISO(), frequency),
        template: {
          accountId: goal.accountId,
          amount,
          currency: 'COP',
          description: `Aporte automático a ${goal.name}`,
          goalId: goal.id,
          id: '',
          kind: 'goal-contribution',
          status: 'posted',
          tags: ['meta'],
          type: 'goal-contribution',
        },
        userId,
      })
    }

    processGoalCompletion(userState, goal)
    writeState(state)

    return snapshotFor(userState)
  },

  deleteSavingsGoal(userId, goalId) {
    const state = readState()
    const userState = getUserState(state, userId)
    const goal = getSavingsGoal(userState, goalId)

    if (!goal) {
      throw new FinanceError('GOAL_NOT_FOUND', 'No fue posible encontrar la meta.')
    }

    goal.status = 'cancelled'
    userState.recurringTransactions = userState.recurringTransactions.filter(
      (recurring) => recurring.template?.goalId !== goalId
    )
    writeState(state)

    return snapshotFor(userState)
  },

  addGoalContribution(userId, goalId, payload) {
    const state = readState()
    const userState = getUserState(state, userId)
    addGoalContributionRecord(userState, goalId, payload)
    writeState(state)

    return snapshotFor(userState)
  },

  saveAccount(userId, payload) {
    const state = readState()
    const userState = getUserState(state, userId)
    const initialBalance = Number(payload.initialBalance || 0)

    if (!payload.name?.trim()) {
      throw new FinanceError('ACCOUNT_NAME_REQUIRED', 'Ingresa el nombre de la cuenta.')
    }

    if (!Number.isFinite(initialBalance)) {
      throw new FinanceError('INVALID_BALANCE', 'Ingresa un saldo inicial válido.')
    }

    if (payload.id) {
      const account = getAccount(userState, payload.id)

      if (!account) {
        throw new FinanceError('ACCOUNT_NOT_FOUND', 'No fue posible encontrar la cuenta.')
      }

      Object.assign(account, {
        color: payload.color,
        currency: payload.currency,
        icon: payload.icon,
        name: payload.name.trim(),
        type: payload.type,
      })
    } else {
      userState.accounts.push({
        active: true,
        color: payload.color,
        createdAt: new Date().toISOString(),
        currency: payload.currency,
        currentBalance: initialBalance,
        icon: payload.icon,
        id: createId('acc'),
        initialBalance,
        name: payload.name.trim(),
        type: payload.type,
        userId,
      })
    }

    writeState(state)
    return snapshotFor(userState)
  },

  archiveAccount(userId, accountId) {
    const state = readState()
    const userState = getUserState(state, userId)
    const account = getAccount(userState, accountId)

    if (!account) {
      throw new FinanceError('ACCOUNT_NOT_FOUND', 'No fue posible encontrar la cuenta.')
    }

    account.active = false
    writeState(state)

    return snapshotFor(userState)
  },

  transfer(userId, payload) {
    const state = readState()
    const userState = getUserState(state, userId)
    const amount = toAmount(payload.amount)
    const date = validateDate(payload.date)
    const source = validateAccountAvailability(userState, payload.sourceAccountId)
    const destination = validateAccountAvailability(userState, payload.destinationAccountId)

    if (source.id === destination.id) {
      throw new FinanceError('SAME_ACCOUNT', 'Selecciona cuentas diferentes para transferir.')
    }

    source.currentBalance -= amount
    destination.currentBalance += amount

    const transferGroupId = createId('trf')
    const createdAt = new Date().toISOString()

    userState.transactions.push(
      {
        accountId: source.id,
        amount: -amount,
        attachment: null,
        categoryId: '',
        createdAt,
        currency: source.currency,
        date,
        description: `Transferencia a ${destination.name}`,
        id: createId('txn'),
        linkedAccountId: destination.id,
        paymentMethod: 'transfer',
        recurrentId: '',
        status: 'posted',
        tags: ['transferencia'],
        transferGroupId,
        type: 'transfer',
        userId,
      },
      {
        accountId: destination.id,
        amount,
        attachment: null,
        categoryId: '',
        createdAt,
        currency: destination.currency,
        date,
        description: `Transferencia desde ${source.name}`,
        id: createId('txn'),
        linkedAccountId: source.id,
        paymentMethod: 'transfer',
        recurrentId: '',
        status: 'posted',
        tags: ['transferencia'],
        transferGroupId,
        type: 'transfer',
        userId,
      }
    )

    writeState(state)
    return snapshotFor(userState)
  },

  saveCategory(userId, payload) {
    const state = readState()
    const userState = getUserState(state, userId)
    const name = payload.name?.trim()

    if (!name) {
      throw new FinanceError('CATEGORY_NAME_REQUIRED', 'Ingresa el nombre de la categoría.')
    }

    const duplicated = userState.categories.some(
      (category) =>
        category.id !== payload.id &&
        category.type === payload.type &&
        normalizeName(category.name) === normalizeName(name)
    )

    if (duplicated) {
      throw new FinanceError('DUPLICATED_CATEGORY', 'La categoría ya está registrada.')
    }

    if (payload.id) {
      const category = getCategory(userState, payload.id)

      if (!category) {
        throw new FinanceError('CATEGORY_NOT_FOUND', 'No fue posible encontrar la categoría.')
      }

      Object.assign(category, {
        color: payload.color,
        icon: payload.icon,
        name,
        parentId: payload.parentId ?? '',
        type: payload.type,
      })
    } else {
      userState.categories.push({
        color: payload.color,
        icon: payload.icon,
        id: createId('cat'),
        name,
        parentId: payload.parentId ?? '',
        type: payload.type,
        userId,
      })
    }

    writeState(state)
    return snapshotFor(userState)
  },

  deleteCategory(userId, categoryId, reassignCategoryId = '') {
    const state = readState()
    const userState = getUserState(state, userId)
    const category = getCategory(userState, categoryId)

    if (!category) {
      throw new FinanceError('CATEGORY_NOT_FOUND', 'No fue posible encontrar la categoría.')
    }

    const affectedTransactions = userState.transactions.filter(
      (transaction) => transaction.categoryId === categoryId
    )

    if (affectedTransactions.length && reassignCategoryId === '') {
      throw new FinanceError(
        'CATEGORY_HAS_TRANSACTIONS',
        'Reasigna los movimientos antes de eliminar.'
      )
    }

    userState.transactions = userState.transactions.map((transaction) =>
      transaction.categoryId === categoryId
        ? { ...transaction, categoryId: reassignCategoryId || '' }
        : transaction
    )
    userState.categories = userState.categories.filter((item) => item.id !== categoryId)

    writeState(state)
    return snapshotFor(userState)
  },

  createTransaction(userId, payload) {
    const state = readState()
    const userState = getUserState(state, userId)
    const transaction = createTransactionPayload(userState, userId, {
      ...payload,
      attachment: normalizeAttachment(payload.attachment),
    })

    userState.transactions.push(transaction)
    applyTransactionImpact(userState, transaction)

    if (payload.isRecurring) {
      const recurring = {
        active: true,
        createdAt: new Date().toISOString(),
        endDate: payload.recurringEndDate || '',
        frequency: payload.frequency,
        id: createId('rec'),
        nextDate: addFrequency(transaction.date, payload.frequency),
        template: {
          ...transaction,
          attachment: null,
          id: '',
        },
        userId,
      }

      transaction.recurrentId = recurring.id
      recurring.template.recurrentId = recurring.id
      userState.recurringTransactions.push(recurring)
    }

    writeState(state)
    return snapshotFor(userState)
  },

  updateTransaction(userId, transactionId, payload) {
    const state = readState()
    const userState = getUserState(state, userId)
    const index = userState.transactions.findIndex(
      (transaction) => transaction.id === transactionId
    )

    if (index < 0) {
      throw new FinanceError('TRANSACTION_NOT_FOUND', 'No fue posible encontrar el movimiento.')
    }

    const currentTransaction = userState.transactions[index]

    if (currentTransaction.type === 'transfer') {
      throw new FinanceError(
        'TRANSFER_EDIT_BLOCKED',
        'Las transferencias se gestionan desde cuentas.'
      )
    }

    revertTransactionImpact(userState, currentTransaction)

    const updatedTransaction = createTransactionPayload(
      userState,
      userId,
      {
        ...payload,
        attachment: payload.attachment
          ? normalizeAttachment(payload.attachment)
          : currentTransaction.attachment,
      },
      currentTransaction
    )

    userState.transactions[index] = updatedTransaction
    applyTransactionImpact(userState, updatedTransaction)
    writeState(state)

    return snapshotFor(userState)
  },

  deleteTransaction(userId, transactionId) {
    const state = readState()
    const userState = getUserState(state, userId)
    const transaction = userState.transactions.find((item) => item.id === transactionId)

    if (!transaction) {
      throw new FinanceError('TRANSACTION_NOT_FOUND', 'No fue posible encontrar el movimiento.')
    }

    if (transaction.type === 'transfer') {
      applyTransferReversal(userState, transaction.transferGroupId)
    } else {
      revertTransactionImpact(userState, transaction)
      userState.transactions = userState.transactions.filter((item) => item.id !== transactionId)
    }

    writeState(state)
    return snapshotFor(userState)
  },

  markNotificationRead(userId, notificationId) {
    const state = readState()
    const userState = getUserState(state, userId)
    const notification = userState.notifications.find((item) => item.id === notificationId)

    if (notification) {
      notification.read = true
    }

    writeState(state)
    return snapshotFor(userState)
  },

  markAllNotificationsRead(userId) {
    const state = readState()
    const userState = getUserState(state, userId)

    userState.notifications = userState.notifications.map((notification) => ({
      ...notification,
      read: true,
    }))

    writeState(state)
    return snapshotFor(userState)
  },

  deleteNotification(userId, notificationId) {
    const state = readState()
    const userState = getUserState(state, userId)

    userState.notifications = userState.notifications.filter(
      (notification) => notification.id !== notificationId
    )

    writeState(state)
    return snapshotFor(userState)
  },

  exportUserData(userId) {
    const state = readState()
    const userState = getUserState(state, userId)
    return snapshotFor(userState)
  },

  deleteUserData(userId) {
    const state = readState()
    delete state.users[userId]
    writeState(state)
    return { success: true }
  },

  toggleRecurring(userId, recurringId) {
    const state = readState()
    const userState = getUserState(state, userId)
    const recurring = userState.recurringTransactions.find((item) => item.id === recurringId)

    if (!recurring) {
      throw new FinanceError('RECURRING_NOT_FOUND', 'No fue posible encontrar la recurrencia.')
    }

    recurring.active = !recurring.active
    writeState(state)

    return snapshotFor(userState)
  },

  deleteRecurring(userId, recurringId) {
    const state = readState()
    const userState = getUserState(state, userId)
    userState.recurringTransactions = userState.recurringTransactions.filter(
      (item) => item.id !== recurringId
    )
    writeState(state)

    return snapshotFor(userState)
  },

  formatMoney(value, currency = 'COP') {
    return new Intl.NumberFormat('es-CO', {
      currency,
      maximumFractionDigits: 0,
      style: 'currency',
    }).format(Number(value || 0))
  },

  labelFor(collection, value) {
    return collection.find((item) => item.value === value)?.label ?? value
  },
}
