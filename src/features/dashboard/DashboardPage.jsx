import {
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  CalendarRange,
  ChartNoAxesCombined,
  PiggyBank,
  ReceiptText,
  ShieldAlert,
  WalletCards,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { aiService } from '../ai/aiService.js'
import {
  buildFinancialAlerts,
  buildMonthlySeries,
  defaultDateFilters,
  summarizeFinancials,
} from '../analytics/analytics.js'
import { BarChart, ComparisonBars } from '../analytics/components/SimpleCharts.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import { financeService } from '../finance/financeService.js'
import { useFinance } from '../finance/useFinance.js'
import { EmptyState } from '../../shared/ui/EmptyState.jsx'

export function DashboardPage() {
  const { user } = useAuth()
  const finance = useFinance(user.id)
  const [filters, setFilters] = useState(defaultDateFilters)

  const summary = useMemo(() => summarizeFinancials(finance, filters), [finance, filters])
  const monthlySeries = useMemo(
    () => buildMonthlySeries(summary.filteredTransactions),
    [summary.filteredTransactions]
  )
  const alerts = useMemo(() => buildFinancialAlerts(finance), [finance])
  const aiInsights = useMemo(() => aiService.buildInsights(finance, user), [finance, user])
  const activeBudgets = finance.budgets.slice(0, 4)
  const activeGoals = finance.savingsGoals.filter((goal) => goal.status !== 'cancelled').slice(0, 4)
  const noMovements = finance.transactions.length === 0

  const cards = [
    {
      icon: WalletCards,
      label: 'Balance Total',
      value: financeService.formatMoney(summary.balance, user.currency),
    },
    {
      icon: ArrowUpRight,
      label: 'Ingresos del Mes',
      tone: 'positive',
      value: financeService.formatMoney(summary.income, user.currency),
    },
    {
      icon: ArrowDownRight,
      label: 'Gastos del Mes',
      tone: 'negative',
      value: financeService.formatMoney(summary.expenses, user.currency),
    },
    {
      icon: PiggyBank,
      label: 'Ahorro Actual',
      tone: summary.savings >= 0 ? 'positive' : 'negative',
      value: financeService.formatMoney(summary.savings, user.currency),
    },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1f7a4f]">Visibilidad y analisis</p>
          <h2 className="mt-1 text-3xl font-semibold text-[#17201c]">Dashboard</h2>
          <p className="mt-2 text-sm text-[#66756e]">
            Resumen calculado por rango de fechas y cuenta seleccionada.
          </p>
        </div>
        <DashboardFilters
          accounts={finance.activeAccounts}
          filters={filters}
          onChange={setFilters}
        />
      </header>

      <section
        aria-label="Resumen financiero"
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        {cards.map((card) => {
          const Icon = card.icon

          return (
            <article
              className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm"
              key={card.label}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-[#66756e]">{card.label}</p>
                  <p
                    className={`mt-3 text-2xl font-semibold ${
                      card.tone === 'positive'
                        ? 'text-[#1f7a4f]'
                        : card.tone === 'negative'
                          ? 'text-[#a24e30]'
                          : 'text-[#17201c]'
                    }`}
                  >
                    {card.value}
                  </p>
                </div>
                <span className="flex size-10 items-center justify-center rounded-lg bg-[#edf4ef] text-[#1f7a4f]">
                  <Icon aria-hidden="true" size={20} />
                </span>
              </div>
            </article>
          )
        })}
      </section>

      {noMovements ? (
        <EmptyState
          action={
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#1f7a4f] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#17633f]"
              to="/transactions/new"
            >
              Registra tu primer gasto
            </Link>
          }
          description="Cuando registres gastos o ingresos se activaran graficas, alertas y reportes."
          title="Registra tu primer gasto"
        />
      ) : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel
          description="Gastos agrupados por mes dentro del rango seleccionado."
          icon={ChartNoAxesCombined}
          title="Grafica de Gastos Mensuales"
        >
          <BarChart
            formatter={(value) => financeService.formatMoney(value, user.currency)}
            items={monthlySeries}
            valueKey="expenses"
          />
        </Panel>

        <Panel
          description="Comparacion de ingresos y gastos."
          icon={CalendarRange}
          title="Ingresos vs Gastos"
        >
          <ComparisonBars
            formatter={(value) => financeService.formatMoney(value, user.currency)}
            items={monthlySeries}
          />
        </Panel>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel
          description="Ultimos movimientos dentro del filtro activo."
          icon={ReceiptText}
          title="Ultimos Movimientos"
        >
          {summary.recentTransactions.length ? (
            <div className="space-y-3">
              {summary.recentTransactions.map((transaction) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-lg border border-[#edf2ee] p-3"
                  key={transaction.id}
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#25322d]">
                      {transaction.description || transaction.type}
                    </p>
                    <p className="text-xs text-[#66756e]">{transaction.date}</p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold ${
                      transaction.type === 'income' || transaction.amount > 0
                        ? 'text-[#1f7a4f]'
                        : 'text-[#a24e30]'
                    }`}
                  >
                    {financeService.formatMoney(transaction.amount, transaction.currency)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <SmallEmpty label="No hay movimientos en este filtro." />
          )}
        </Panel>

        <Panel
          description="Presupuestos activos con barra de progreso."
          icon={ShieldAlert}
          title="Presupuestos Activos"
        >
          {activeBudgets.length ? (
            <div className="space-y-4">
              {activeBudgets.map((budget) => (
                <ProgressItem
                  key={budget.id}
                  label={budget.categoryName}
                  meta={`${financeService.formatMoney(budget.used, user.currency)} de ${financeService.formatMoney(
                    budget.limit,
                    user.currency
                  )}`}
                  percent={budget.percent}
                  tone={
                    budget.percent > 100
                      ? 'danger'
                      : budget.percent >= budget.alertThreshold
                        ? 'warning'
                        : 'success'
                  }
                />
              ))}
            </div>
          ) : (
            <SmallEmpty label="No hay presupuestos activos." />
          )}
        </Panel>

        <Panel
          description="Presupuestos excedidos y metas proximas a vencer."
          icon={ShieldAlert}
          title="Alertas Financieras"
        >
          {alerts.length ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <p
                  className={`rounded-lg border p-3 text-sm font-medium ${
                    alert.tone === 'danger'
                      ? 'border-[#f0d2c7] bg-[#fff5f2] text-[#a24e30]'
                      : 'border-[#f1e1a7] bg-[#fff9e7] text-[#654d10]'
                  }`}
                  key={alert.id}
                >
                  {alert.message}
                </p>
              ))}
            </div>
          ) : (
            <SmallEmpty label="Sin alertas financieras." />
          )}
        </Panel>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_0.8fr]">
        <Panel
          description="Avance de metas activas o cumplidas."
          icon={PiggyBank}
          title="Metas de Ahorro"
        >
          {activeGoals.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {activeGoals.map((goal) => (
                <ProgressItem
                  key={goal.id}
                  label={goal.name}
                  meta={`${financeService.formatMoney(goal.currentAmount, user.currency)} de ${financeService.formatMoney(
                    goal.targetAmount,
                    user.currency
                  )}`}
                  percent={goal.percent}
                  tone={goal.status === 'fulfilled' ? 'success' : 'neutral'}
                />
              ))}
            </div>
          ) : (
            <SmallEmpty label="No hay metas de ahorro registradas." />
          )}
        </Panel>

        <Panel
          description="Resumen mensual, gastos hormiga y proyecciones."
          icon={BrainCircuit}
          title="Recomendaciones IA"
        >
          <div className="rounded-lg border border-[#edf2ee] bg-[#fbfcfb] p-4 text-sm leading-6 text-[#66756e]">
            {aiInsights.monthlySummary}
          </div>
          {aiInsights.recommendations.length ? (
            <div className="mt-4 space-y-3">
              {aiInsights.recommendations.map((recommendation) => (
                <p
                  className="rounded-lg border border-[#edf2ee] p-3 text-sm font-medium text-[#25322d]"
                  key={recommendation.id}
                >
                  {recommendation.text}
                </p>
              ))}
            </div>
          ) : (
            <SmallEmpty label="Sin recomendaciones activas." />
          )}
        </Panel>
      </section>
    </div>
  )
}

const inputClasses =
  'min-h-11 rounded-lg border border-[#cfdacf] bg-white px-3 text-sm text-[#17201c] outline-none transition focus:border-[#1f7a4f] focus:ring-2 focus:ring-[#b8d8c6]'

function DashboardFilters({ accounts, filters, onChange }) {
  const update = (key, value) => onChange((current) => ({ ...current, [key]: value }))

  return (
    <section className="grid gap-3 rounded-lg border border-[#dde7de] bg-white p-4 shadow-sm sm:grid-cols-3">
      <label className="text-sm font-medium text-[#25322d]">
        Fecha inicio
        <input
          className={`mt-2 w-full ${inputClasses}`}
          onChange={(event) => update('startDate', event.target.value)}
          type="date"
          value={filters.startDate}
        />
      </label>
      <label className="text-sm font-medium text-[#25322d]">
        Fecha fin
        <input
          className={`mt-2 w-full ${inputClasses}`}
          onChange={(event) => update('endDate', event.target.value)}
          type="date"
          value={filters.endDate}
        />
      </label>
      <label className="text-sm font-medium text-[#25322d]">
        Cuenta
        <select
          className={`mt-2 w-full ${inputClasses}`}
          onChange={(event) => update('accountId', event.target.value)}
          value={filters.accountId}
        >
          <option value="">Todas las cuentas</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </label>
    </section>
  )
}

function Panel({ children, description, icon: Icon, title }) {
  return (
    <article className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[#17201c]">{title}</h3>
          <p className="mt-1 text-sm text-[#66756e]">{description}</p>
        </div>
        <Icon aria-hidden="true" className="shrink-0 text-[#315b78]" size={23} />
      </div>
      {children}
    </article>
  )
}

function ProgressItem({ label, meta, percent, tone }) {
  const color =
    tone === 'danger'
      ? 'bg-[#a24e30]'
      : tone === 'warning'
        ? 'bg-[#d6a93a]'
        : tone === 'success'
          ? 'bg-[#1f7a4f]'
          : 'bg-[#315b78]'

  return (
    <div className="rounded-lg border border-[#edf2ee] p-4">
      <div className="flex items-start justify-between gap-3 text-sm">
        <div className="min-w-0">
          <p className="truncate font-semibold text-[#25322d]">{label}</p>
          <p className="mt-1 text-xs text-[#66756e]">{meta}</p>
        </div>
        <span className="shrink-0 font-semibold text-[#25322d]">{percent}%</span>
      </div>
      <div className="mt-3 h-2 rounded-lg bg-[#e6ece7]">
        <div
          className={`h-2 rounded-lg ${color}`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  )
}

function SmallEmpty({ label }) {
  return (
    <p className="rounded-lg border border-dashed border-[#cfdacf] bg-[#fbfcfb] p-4 text-sm text-[#66756e]">
      {label}
    </p>
  )
}
