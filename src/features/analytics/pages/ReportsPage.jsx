import { Download, FileSpreadsheet, FileText, Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  buildCashflowSeries,
  buildCategorySeries,
  buildMonthlySeries,
  defaultDateFilters,
  downloadExcel,
  downloadTextFile,
  filterTransactions,
  financeRows,
} from '../analytics.js'
import { BarChart, ComparisonBars, LineChart } from '../components/SimpleCharts.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { financeService, paymentMethods } from '../../finance/financeService.js'
import { useFinance } from '../../finance/useFinance.js'
import { Button } from '../../../shared/ui/Button.jsx'
import { EmptyState } from '../../../shared/ui/EmptyState.jsx'
import { useToast } from '../../../shared/ui/Toast.jsx'

const FAVORITES_KEY = 'finance-app.report-favorites'

const reportTypes = [
  { description: 'Gastos agrupados por mes.', id: 'monthly-expenses', label: 'Gastos mensuales' },
  { description: 'Ingresos agrupados por mes.', id: 'monthly-income', label: 'Ingresos mensuales' },
  {
    description: 'Ingresos contra gastos.',
    id: 'period-comparison',
    label: 'Comparativas entre periodos',
  },
  {
    description: 'Lectura anual por mes.',
    id: 'year-over-year',
    label: 'Comparativo ano contra ano',
  },
  { description: 'Evolucion estadistica simple.', id: 'trends', label: 'Tendencias' },
  { description: 'Saldo acumulado mensual.', id: 'cashflow', label: 'Flujo de caja mensual' },
  { description: 'Ranking de categorias.', id: 'categories', label: 'Categorias mas utilizadas' },
  { description: 'Activos menos pasivos.', id: 'net-worth', label: 'Patrimonio neto' },
]

export function ReportsPage() {
  const { user } = useAuth()
  const finance = useFinance(user.id)
  const { notify } = useToast()
  const [selectedReport, setSelectedReport] = useState(reportTypes[0].id)
  const [filters, setFilters] = useState({
    ...defaultDateFilters(),
    categoryId: '',
    paymentMethod: '',
  })
  const [favorites, setFavorites] = useState(readFavorites)

  const filteredTransactions = useMemo(
    () =>
      filterTransactions(finance.transactions, {
        accountId: filters.accountId,
        categoryId: filters.categoryId,
        endDate: filters.endDate,
        paymentMethod: filters.paymentMethod,
        startDate: filters.startDate,
      }),
    [finance.transactions, filters]
  )
  const monthlySeries = useMemo(
    () => buildMonthlySeries(filteredTransactions),
    [filteredTransactions]
  )
  const categorySeries = useMemo(
    () => buildCategorySeries(filteredTransactions, finance.categories),
    [filteredTransactions, finance.categories]
  )
  const cashflowSeries = useMemo(
    () => buildCashflowSeries(filteredTransactions),
    [filteredTransactions]
  )
  const netWorth = finance.accounts.reduce((total, account) => {
    const balance = Number(account.currentBalance || 0)
    return account.type === 'credit' ? total - Math.abs(balance) : total + balance
  }, 0)

  const reportRows = financeRows(filteredTransactions, finance.accounts, finance.categories)

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const handleSaveFavorite = () => {
    const favorite = {
      filters,
      id: window.crypto?.randomUUID?.() ?? `${Date.now()}`,
      report: selectedReport,
      savedAt: new Date().toISOString(),
    }
    const nextFavorites = [favorite, ...favorites].slice(0, 6)
    setFavorites(nextFavorites)
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(nextFavorites))
    notify('Filtro guardado como favorito.')
  }

  const handleExportPdf = () => {
    const report = reportTypes.find((item) => item.id === selectedReport)
    const content = [
      `Reporte: ${report?.label ?? selectedReport}`,
      `Periodo: ${filters.startDate} - ${filters.endDate}`,
      `Generado: ${new Date().toLocaleString('es-CO')}`,
      '',
      ...reportRows.map(
        (row) =>
          `${row.fecha} | ${row.tipo} | ${row.categoria} | ${row.cuenta} | ${row.descripcion} | ${row.monto}`
      ),
    ].join('\n')

    downloadTextFile('reporte-financiero.pdf', content, 'application/pdf')
    notify('PDF exportado.')
  }

  const handleExportExcel = () => {
    downloadExcel('reporte-financiero.xls', reportRows)
    notify('Excel exportado.')
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1f7a4f]">Reportes</p>
          <h2 className="mt-1 text-3xl font-semibold text-[#17201c]">Dashboard de reportes</h2>
          <p className="mt-2 text-sm text-[#66756e]">
            Analiza movimientos por periodo, categoria, cuenta y metodo de pago.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleSaveFavorite} variant="secondary">
            <Save aria-hidden="true" size={18} />
            Guardar filtro
          </Button>
          <Button onClick={handleExportPdf} variant="secondary">
            <FileText aria-hidden="true" size={18} />
            Exportar PDF
          </Button>
          <Button onClick={handleExportExcel}>
            <FileSpreadsheet aria-hidden="true" size={18} />
            Exportar Excel
          </Button>
        </div>
      </header>

      <ReportFilters finance={finance} filters={filters} onUpdate={updateFilter} />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {reportTypes.map((report) => (
          <button
            className={`rounded-lg border p-4 text-left shadow-sm transition ${
              selectedReport === report.id
                ? 'border-[#1f7a4f] bg-[#f3fbf6]'
                : 'border-[#dde7de] bg-white hover:border-[#8fb49d]'
            }`}
            key={report.id}
            onClick={() => setSelectedReport(report.id)}
            type="button"
          >
            <span className="block font-semibold text-[#17201c]">{report.label}</span>
            <span className="mt-2 block text-sm leading-5 text-[#66756e]">
              {report.description}
            </span>
          </button>
        ))}
      </section>

      {!finance.transactions.length ? (
        <EmptyState
          description="No hay informacion disponible para reportar. Registra movimientos primero."
          title="No hay movimientos registrados"
        />
      ) : (
        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[#17201c]">
                  {reportTypes.find((item) => item.id === selectedReport)?.label}
                </h3>
                <p className="mt-1 text-sm text-[#66756e]">
                  {filteredTransactions.length} movimientos incluidos en el reporte.
                </p>
              </div>
              <Button onClick={handleExportPdf} variant="secondary">
                <Download aria-hidden="true" size={17} />
                Descargar reporte
              </Button>
            </div>
            <ReportVisualization
              categorySeries={categorySeries}
              cashflowSeries={cashflowSeries}
              currency={user.currency}
              monthlySeries={monthlySeries}
              netWorth={netWorth}
              reportId={selectedReport}
            />
          </article>

          <aside className="space-y-4">
            <article className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-[#17201c]">Resumen del filtro</h3>
              <dl className="mt-4 grid gap-3 text-sm">
                <Metric
                  label="Ingresos"
                  value={financeService.formatMoney(
                    sumByType(filteredTransactions, 'income'),
                    user.currency
                  )}
                />
                <Metric
                  label="Gastos"
                  value={financeService.formatMoney(
                    sumByType(filteredTransactions, 'expense'),
                    user.currency
                  )}
                />
                <Metric
                  label="Patrimonio neto"
                  value={financeService.formatMoney(netWorth, user.currency)}
                />
                <Metric label="Movimientos" value={filteredTransactions.length} />
              </dl>
            </article>

            <article className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-[#17201c]">Filtros favoritos</h3>
              {favorites.length ? (
                <div className="mt-4 space-y-2">
                  {favorites.map((favorite) => (
                    <button
                      className="w-full rounded-lg border border-[#edf2ee] p-3 text-left text-sm transition hover:bg-[#f8fbf8]"
                      key={favorite.id}
                      onClick={() => {
                        setSelectedReport(favorite.report)
                        setFilters(favorite.filters)
                      }}
                      type="button"
                    >
                      <span className="block font-semibold text-[#25322d]">
                        {reportTypes.find((item) => item.id === favorite.report)?.label}
                      </span>
                      <span className="mt-1 block text-xs text-[#66756e]">
                        {favorite.filters.startDate} - {favorite.filters.endDate}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-lg border border-dashed border-[#cfdacf] p-4 text-sm text-[#66756e]">
                  No hay filtros favoritos guardados.
                </p>
              )}
            </article>
          </aside>
        </section>
      )}
    </div>
  )
}

const inputClasses =
  'mt-2 min-h-11 w-full rounded-lg border border-[#cfdacf] bg-white px-3 text-sm text-[#17201c] outline-none transition focus:border-[#1f7a4f] focus:ring-2 focus:ring-[#b8d8c6]'

function ReportFilters({ finance, filters, onUpdate }) {
  return (
    <section className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Field label="Fecha inicio">
          <input
            className={inputClasses}
            onChange={(event) => onUpdate('startDate', event.target.value)}
            type="date"
            value={filters.startDate}
          />
        </Field>
        <Field label="Fecha fin">
          <input
            className={inputClasses}
            onChange={(event) => onUpdate('endDate', event.target.value)}
            type="date"
            value={filters.endDate}
          />
        </Field>
        <Field label="Categoria">
          <select
            className={inputClasses}
            onChange={(event) => onUpdate('categoryId', event.target.value)}
            value={filters.categoryId}
          >
            <option value="">Todas</option>
            {finance.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cuenta">
          <select
            className={inputClasses}
            onChange={(event) => onUpdate('accountId', event.target.value)}
            value={filters.accountId}
          >
            <option value="">Todas</option>
            {finance.accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Metodo de pago">
          <select
            className={inputClasses}
            onChange={(event) => onUpdate('paymentMethod', event.target.value)}
            value={filters.paymentMethod}
          >
            <option value="">Todos</option>
            {paymentMethods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </section>
  )
}

function ReportVisualization({
  categorySeries,
  cashflowSeries,
  currency,
  monthlySeries,
  netWorth,
  reportId,
}) {
  const formatMoney = (value) => financeService.formatMoney(value, currency)

  if (reportId === 'monthly-expenses') {
    return <BarChart formatter={formatMoney} items={monthlySeries} valueKey="expenses" />
  }

  if (reportId === 'monthly-income') {
    return <BarChart formatter={formatMoney} items={monthlySeries} valueKey="income" />
  }

  if (reportId === 'period-comparison' || reportId === 'year-over-year') {
    return <ComparisonBars formatter={formatMoney} items={monthlySeries} />
  }

  if (reportId === 'trends' || reportId === 'cashflow') {
    return <LineChart formatter={formatMoney} items={cashflowSeries} />
  }

  if (reportId === 'categories') {
    return <BarChart formatter={formatMoney} items={categorySeries} valueKey="value" />
  }

  return (
    <div className="rounded-lg border border-[#edf2ee] bg-[#fbfcfb] p-8 text-center">
      <p className="text-sm font-medium text-[#66756e]">Patrimonio neto estimado</p>
      <p className="mt-3 text-3xl font-semibold text-[#17201c]">{formatMoney(netWorth)}</p>
    </div>
  )
}

function Field({ children, label }) {
  return (
    <label className="block text-sm font-medium text-[#25322d]">
      {label}
      {children}
    </label>
  )
}

function Metric({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#edf2ee] pb-3 last:border-0 last:pb-0">
      <dt className="text-[#66756e]">{label}</dt>
      <dd className="font-semibold text-[#25322d]">{value}</dd>
    </div>
  )
}

function sumByType(transactions, type) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0)
}

function readFavorites() {
  try {
    return JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? '[]')
  } catch {
    return []
  }
}
