import { financeService } from '../finance/financeService.js'

const keywordCategoryHints = [
  { keywords: ['mercado', 'comida', 'restaurante', 'almuerzo', 'cafe'], name: 'alimentacion' },
  { keywords: ['taxi', 'bus', 'metro', 'gasolina', 'uber'], name: 'transporte' },
  { keywords: ['arriendo', 'renta', 'servicio', 'luz', 'agua'], name: 'vivienda' },
  { keywords: ['medico', 'farmacia', 'salud'], name: 'salud' },
  { keywords: ['cine', 'netflix', 'juego', 'concierto'], name: 'entretenimiento' },
  { keywords: ['nomina', 'salario', 'pago'], name: 'salario' },
]

export const aiService = {
  isEnabled() {
    return window.localStorage.getItem('finance-app.ai.enabled') !== 'false'
  },

  setEnabled(enabled) {
    window.localStorage.setItem('finance-app.ai.enabled', String(Boolean(enabled)))
  },

  buildInsights(snapshot, user) {
    if (!this.isEnabled()) {
      return {
        enabled: false,
        monthlySummary: 'Las recomendaciones IA estan desactivadas.',
        recommendations: [],
      }
    }

    const currentMonth = new Date().toISOString().slice(0, 7)
    const monthTransactions = snapshot.transactions.filter((transaction) =>
      transaction.date.startsWith(currentMonth)
    )
    const income = sumByType(monthTransactions, 'income')
    const expenses = sumByType(monthTransactions, 'expense')
    const savings = income - expenses
    const antExpenses = detectSmallRepeatedExpenses(
      monthTransactions,
      snapshot.categories,
      user.currency
    )
    const projections = projectBudgets(snapshot.budgets, user.currency)
    const recommendations = [
      ...antExpenses,
      ...projections,
      ...buildGeneralRecommendations(income, expenses, savings, user.currency),
    ].slice(0, 5)

    return {
      enabled: true,
      monthlySummary: buildMonthlySummary(
        income,
        expenses,
        savings,
        monthTransactions.length,
        user.currency
      ),
      recommendations,
    }
  },

  suggestCategory({ categories, description, transactions, type }) {
    const normalizedDescription = normalize(description)

    if (!normalizedDescription || !categories.length) {
      return null
    }

    const candidates = categories.filter((category) => category.type === type)
    const scoredCandidates = candidates
      .map((category) => ({
        category,
        score:
          scoreByName(category, normalizedDescription) +
          scoreByHistory(category, normalizedDescription, transactions) +
          scoreByKeyword(category, normalizedDescription),
      }))
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score)

    if (!scoredCandidates.length) {
      return null
    }

    const best = scoredCandidates[0]

    return {
      category: best.category,
      confidence: Math.min(95, 55 + best.score * 10),
      reason: 'Sugerencia basada en descripcion y movimientos anteriores.',
    }
  },
}

function detectSmallRepeatedExpenses(transactions, categories, currency) {
  const categoryById = new Map(categories.map((category) => [category.id, category.name]))
  const grouped = new Map()

  transactions
    .filter((transaction) => transaction.type === 'expense' && Number(transaction.amount) <= 50000)
    .forEach((transaction) => {
      const key = transaction.categoryId || 'uncategorized'
      const current = grouped.get(key) ?? {
        category: categoryById.get(transaction.categoryId) ?? 'Sin categoria',
        count: 0,
        total: 0,
      }
      current.count += 1
      current.total += Number(transaction.amount || 0)
      grouped.set(key, current)
    })

  return [...grouped.values()]
    .filter((item) => item.count >= 3)
    .map((item) => ({
      id: `ant-${item.category}`,
      text: `Detecte ${item.count} gastos hormiga en ${item.category} por ${financeService.formatMoney(
        item.total,
        currency
      )}.`,
      type: 'gastos-hormiga',
    }))
}

function projectBudgets(budgets, currency) {
  const today = new Date()
  const dayOfMonth = Math.max(1, today.getDate())

  return budgets
    .filter((budget) => budget.period === 'monthly' && Number(budget.used) > 0)
    .map((budget) => {
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
      const projected = (Number(budget.used) / dayOfMonth) * daysInMonth
      const outsideBudget = projected > Number(budget.limit)

      return {
        id: `projection-${budget.id}`,
        text: outsideBudget
          ? `Al ritmo actual, ${budget.categoryName} podria cerrar en ${financeService.formatMoney(
              projected,
              currency
            )}, por encima del presupuesto.`
          : `${budget.categoryName} proyecta cerrar dentro del limite mensual.`,
        type: 'proyeccion',
      }
    })
}

function buildGeneralRecommendations(income, expenses, savings, currency) {
  if (!income && !expenses) {
    return [
      {
        id: 'start',
        text: 'Registra algunos movimientos para generar recomendaciones personalizadas.',
        type: 'inicio',
      },
    ]
  }

  if (savings < 0) {
    return [
      {
        id: 'negative-savings',
        text: `Este mes vas ${financeService.formatMoney(Math.abs(savings), currency)} por debajo del equilibrio.`,
        type: 'alerta',
      },
    ]
  }

  return [
    {
      id: 'positive-savings',
      text: `Tienes ${financeService.formatMoney(savings, currency)} disponibles para ahorro o metas.`,
      type: 'ahorro',
    },
  ]
}

function buildMonthlySummary(income, expenses, savings, count, currency) {
  if (!count) {
    return 'Aun no hay movimientos este mes para generar un resumen mensual.'
  }

  const direction =
    savings >= 0
      ? `con un saldo positivo de ${financeService.formatMoney(savings, currency)}`
      : `con un deficit de ${financeService.formatMoney(Math.abs(savings), currency)}`

  return `Este mes registraste ${count} movimientos, ingresos por ${financeService.formatMoney(
    income,
    currency
  )} y gastos por ${financeService.formatMoney(expenses, currency)}, ${direction}.`
}

function scoreByName(category, description) {
  const categoryName = normalize(category.name)
  return description.includes(categoryName) || categoryName.includes(description) ? 4 : 0
}

function scoreByHistory(category, description, transactions) {
  return transactions
    .filter((transaction) => transaction.categoryId === category.id)
    .some((transaction) => sharedWords(description, normalize(transaction.description)))
    ? 3
    : 0
}

function scoreByKeyword(category, description) {
  const categoryName = normalize(category.name)
  const hint = keywordCategoryHints.find((item) => categoryName.includes(item.name))

  if (!hint) {
    return 0
  }

  return hint.keywords.some((keyword) => description.includes(keyword)) ? 4 : 0
}

function sharedWords(left, right) {
  const words = left.split(/\s+/).filter((word) => word.length >= 4)
  return words.some((word) => right.includes(word))
}

function sumByType(transactions, type) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0)
}

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}
