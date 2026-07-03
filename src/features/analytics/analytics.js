const ALL_VALUE = ''

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function startOfMonthISO(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10)
}

export function defaultDateFilters() {
  return {
    accountId: ALL_VALUE,
    endDate: todayISO(),
    startDate: startOfMonthISO(),
  }
}

export function filterTransactions(transactions, filters = {}) {
  const normalizedSearch = normalize(filters.search)
  const normalizedTag = normalize(filters.tag)
  const minAmount = Number(filters.minAmount || 0)
  const maxAmount = Number(filters.maxAmount || 0)

  return transactions.filter((transaction) => {
    const amount = Math.abs(Number(transaction.amount || 0))
    const searchableText = normalize(
      [
        transaction.description,
        transaction.type,
        transaction.status,
        transaction.paymentMethod,
        ...(transaction.tags ?? []),
      ].join(' ')
    )

    return (
      (!filters.startDate || transaction.date >= filters.startDate) &&
      (!filters.endDate || transaction.date <= filters.endDate) &&
      (!filters.accountId || transaction.accountId === filters.accountId) &&
      (!filters.categoryId || transaction.categoryId === filters.categoryId) &&
      (!filters.type || transaction.type === filters.type) &&
      (!filters.paymentMethod || transaction.paymentMethod === filters.paymentMethod) &&
      (!minAmount || amount >= minAmount) &&
      (!maxAmount || amount <= maxAmount) &&
      (!normalizedTag ||
        (transaction.tags ?? []).some((tag) => normalize(tag).includes(normalizedTag))) &&
      (!normalizedSearch || searchableText.includes(normalizedSearch))
    )
  })
}

export function sortTransactions(transactions, sort) {
  const { direction = 'desc', key = 'date' } = sort ?? {}
  const multiplier = direction === 'asc' ? 1 : -1

  return [...transactions].sort((left, right) => {
    const leftValue = transactionSortValue(left, key)
    const rightValue = transactionSortValue(right, key)

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return (leftValue - rightValue) * multiplier
    }

    return String(leftValue).localeCompare(String(rightValue)) * multiplier
  })
}

export function summarizeFinancials(snapshot, filters = {}) {
  const filteredTransactions = filterTransactions(snapshot.transactions, filters)
  const activeAccounts = snapshot.accounts.filter((account) => account.active)
  const selectedAccount = filters.accountId
    ? activeAccounts.find((account) => account.id === filters.accountId)
    : null
  const scopedAccounts = selectedAccount ? [selectedAccount] : activeAccounts
  const balance = scopedAccounts.reduce(
    (total, account) => total + Number(account.currentBalance),
    0
  )
  const income = sumTransactions(filteredTransactions, 'income')
  const expenses = sumTransactions(filteredTransactions, 'expense')

  return {
    balance,
    expenses,
    filteredTransactions,
    income,
    recentTransactions: filteredTransactions.slice(0, 5),
    savings: income - expenses,
  }
}

export function sumTransactions(transactions, type) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0)
}

export function buildMonthlySeries(transactions) {
  const grouped = new Map()

  transactions
    .filter((transaction) => transaction.type !== 'transfer')
    .forEach((transaction) => {
      const key = transaction.date.slice(0, 7)
      const current = grouped.get(key) ?? { expenses: 0, income: 0, key, label: monthLabel(key) }

      if (transaction.type === 'income') {
        current.income += Number(transaction.amount || 0)
      }

      if (transaction.type === 'expense') {
        current.expenses += Number(transaction.amount || 0)
      }

      grouped.set(key, current)
    })

  const rows = [...grouped.values()].sort((left, right) => left.key.localeCompare(right.key))

  if (rows.length) {
    return rows
  }

  return lastMonths(6).map((key) => ({ expenses: 0, income: 0, key, label: monthLabel(key) }))
}

export function buildCategorySeries(transactions, categories) {
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]))
  const grouped = new Map()

  transactions
    .filter((transaction) => transaction.type === 'expense')
    .forEach((transaction) => {
      const label = categoryMap.get(transaction.categoryId) ?? 'Sin categoria'
      grouped.set(label, (grouped.get(label) ?? 0) + Number(transaction.amount || 0))
    })

  return [...grouped.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 8)
}

export function buildCashflowSeries(transactions) {
  let running = 0

  return buildMonthlySeries(transactions).map((row) => {
    running += row.income - row.expenses
    return { ...row, value: running }
  })
}

export function buildFinancialAlerts(snapshot) {
  const budgetAlerts = snapshot.budgets
    .filter((budget) => budget.percent >= budget.alertThreshold || budget.percent > 100)
    .map((budget) => ({
      id: `budget-${budget.id}`,
      message:
        budget.percent > 100
          ? `Presupuesto ${budget.categoryName} excedido`
          : `Presupuesto ${budget.categoryName} al ${budget.percent}%`,
      tone: budget.percent > 100 ? 'danger' : 'warning',
    }))

  const today = new Date(`${todayISO()}T00:00:00`)
  const goalAlerts = snapshot.savingsGoals
    .filter((goal) => goal.status === 'active' && goal.targetDate)
    .filter((goal) => {
      const daysLeft = Math.ceil((new Date(`${goal.targetDate}T00:00:00`) - today) / 86400000)
      return daysLeft >= 0 && daysLeft <= 30
    })
    .map((goal) => ({
      id: `goal-${goal.id}`,
      message: `Meta ${goal.name} vence pronto`,
      tone: 'warning',
    }))

  return [...budgetAlerts, ...goalAlerts]
}

export function searchFinanceData(snapshot, query) {
  const q = normalize(query)

  if (!q) {
    return emptySearchResults()
  }

  const accountById = new Map(snapshot.accounts.map((account) => [account.id, account]))
  const categoryById = new Map(snapshot.categories.map((category) => [category.id, category]))

  return {
    accounts: snapshot.accounts
      .filter((account) => includes(account.name, q) || includes(account.type, q))
      .map((account) => ({
        id: account.id,
        label: account.name,
        meta: account.active ? 'Cuenta activa' : 'Cuenta archivada',
        to: '/accounts',
      })),
    budgets: snapshot.budgets
      .filter((budget) => includes(budget.categoryName, q) || includes(budget.periodLabel, q))
      .map((budget) => ({
        id: budget.id,
        label: budget.categoryName,
        meta: `Presupuesto ${budget.percent}% usado`,
        to: '/budgets',
      })),
    categories: snapshot.categories
      .filter((category) => includes(category.name, q) || includes(category.type, q))
      .map((category) => ({
        id: category.id,
        label: category.name,
        meta: category.type === 'expense' ? 'Categoria de gasto' : 'Categoria de ingreso',
        to: '/categories',
      })),
    goals: snapshot.savingsGoals
      .filter((goal) => includes(goal.name, q) || includes(goal.description, q))
      .map((goal) => ({
        id: goal.id,
        label: goal.name,
        meta: `Meta ${goal.percent}% alcanzada`,
        to: '/savings-goals',
      })),
    transactions: snapshot.transactions
      .filter((transaction) =>
        includes(
          [
            transaction.description,
            transaction.paymentMethod,
            transaction.status,
            accountById.get(transaction.accountId)?.name,
            categoryById.get(transaction.categoryId)?.name,
            ...(transaction.tags ?? []),
          ].join(' '),
          q
        )
      )
      .slice(0, 8)
      .map((transaction) => ({
        id: transaction.id,
        label: transaction.description || transaction.type,
        meta: `${transaction.date} · ${accountById.get(transaction.accountId)?.name ?? 'Cuenta'}`,
        to: `/transactions?focus=${transaction.id}`,
      })),
  }
}

export function hasSearchResults(results) {
  return Object.values(results).some((items) => items.length > 0)
}

export function downloadCsv(filename, rows) {
  if (!rows.length) {
    downloadFile(filename, '', 'text/csv;charset=utf-8')
    return
  }

  const headers = Object.keys(rows[0])
  const content = [
    headers.map(csvCell).join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
  ].join('\n')

  downloadFile(filename, content, 'text/csv;charset=utf-8')
}

export function downloadTextFile(filename, content, type = 'text/plain;charset=utf-8') {
  downloadFile(filename, content, type)
}

export function downloadExcel(filename, rows) {
  const headers = rows.length ? Object.keys(rows[0]) : ['Reporte']
  const body = rows.length ? rows : [{ Reporte: 'Sin informacion disponible' }]
  const html = `
    <table>
      <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
      <tbody>
        ${body
          .map(
            (row) =>
              `<tr>${headers.map((header) => `<td>${escapeHtml(row[header] ?? '')}</td>`).join('')}</tr>`
          )
          .join('')}
      </tbody>
    </table>
  `

  downloadFile(filename, html, 'application/vnd.ms-excel;charset=utf-8')
}

export function financeRows(transactions, accounts, categories) {
  const accountById = new Map(accounts.map((account) => [account.id, account.name]))
  const categoryById = new Map(categories.map((category) => [category.id, category.name]))

  return transactions.map((transaction) => ({
    cuenta: accountById.get(transaction.accountId) ?? 'Cuenta archivada',
    categoria:
      transaction.type === 'transfer'
        ? 'Transferencia'
        : (categoryById.get(transaction.categoryId) ?? 'Sin categoria'),
    descripcion: transaction.description || 'Sin descripcion',
    estado: transaction.status,
    fecha: transaction.date,
    metodo: transaction.paymentMethod,
    monto: transaction.amount,
    tags: (transaction.tags ?? []).join(', '),
    tipo: transaction.type,
  }))
}

function transactionSortValue(transaction, key) {
  if (key === 'amount') {
    return Math.abs(Number(transaction.amount || 0))
  }

  if (key === 'tags') {
    return (transaction.tags ?? []).join(', ')
  }

  return transaction[key] ?? ''
}

function lastMonths(count) {
  const date = new Date()
  const months = []

  for (let index = count - 1; index >= 0; index -= 1) {
    const current = new Date(date.getFullYear(), date.getMonth() - index, 1)
    months.push(current.toISOString().slice(0, 7))
  }

  return months
}

function monthLabel(key) {
  return new Date(`${key}-01T00:00:00`).toLocaleDateString('es-CO', {
    month: 'short',
  })
}

function emptySearchResults() {
  return {
    accounts: [],
    budgets: [],
    categories: [],
    goals: [],
    transactions: [],
  }
}

function includes(value, query) {
  return normalize(value).includes(query)
}

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function downloadFile(filename, content, type) {
  if (typeof document === 'undefined') {
    return
  }

  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
