import { Edit3, History, Plus, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext.jsx'
import { budgetPeriods, financeService } from '../financeService.js'
import { useFinance } from '../useFinance.js'
import { Alert } from '../../../shared/ui/Alert.jsx'
import { Button } from '../../../shared/ui/Button.jsx'
import { EmptyState } from '../../../shared/ui/EmptyState.jsx'
import { useToast } from '../../../shared/ui/Toast.jsx'

const budgetDefaults = {
  alertThreshold: 80,
  categoryId: '',
  id: '',
  limit: '',
  period: 'monthly',
  rollover: false,
}

export function BudgetsPage() {
  const { user } = useAuth()
  const { actions, budgetHistory, budgets, categories } = useFinance(user.id)
  const { notify } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [form, setForm] = useState(budgetDefaults)
  const [error, setError] = useState('')

  const expenseCategories = categories.filter((category) => category.type === 'expense')

  const resetForm = () => {
    setForm(budgetDefaults)
    setFormOpen(false)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    try {
      actions.saveBudget(form)
      notify(form.id ? 'Presupuesto actualizado.' : 'Presupuesto guardado.')
      resetForm()
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  const handleEdit = (budget) => {
    setError('')
    setForm({
      alertThreshold: budget.alertThreshold,
      categoryId: budget.categoryId,
      id: budget.id,
      limit: budget.limit,
      period: budget.period,
      rollover: budget.rollover,
    })
    setFormOpen(true)
  }

  const handleDelete = (budget) => {
    if (!window.confirm('¿Eliminar este presupuesto?')) {
      return
    }

    actions.deleteBudget(budget.id)
    notify('Presupuesto eliminado.')
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1f7a4f]">Planeación financiera</p>
          <h2 className="mt-1 text-3xl font-semibold text-[#17201c]">Presupuestos</h2>
          <p className="mt-2 text-sm text-[#66756e]">
            Define límites por categoría o generales y monitorea el uso automáticamente.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => setHistoryOpen((current) => !current)} variant="secondary">
            <History aria-hidden="true" size={18} />
            Ver historial
          </Button>
          <Button
            onClick={() => {
              setError('')
              setForm(budgetDefaults)
              setFormOpen(true)
            }}
          >
            <Plus aria-hidden="true" size={18} />
            Nuevo presupuesto
          </Button>
        </div>
      </header>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      {formOpen ? (
        <form
          className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm"
          onSubmit={handleSubmit}
        >
          <h3 className="text-lg font-semibold text-[#17201c]">
            {form.id ? 'Editar presupuesto' : 'Nuevo presupuesto'}
          </h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Categoría">
              <select
                className={inputClasses}
                onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
                value={form.categoryId}
              >
                <option value="">General</option>
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Límite Mensual">
              <input
                className={inputClasses}
                min="0"
                onChange={(event) => setForm({ ...form, limit: event.target.value })}
                type="number"
                value={form.limit}
              />
            </Field>
            <Field label="Período">
              <select
                className={inputClasses}
                onChange={(event) => setForm({ ...form, period: event.target.value })}
                value={form.period}
              >
                {budgetPeriods.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Umbral de alerta (%)">
              <input
                className={inputClasses}
                max="100"
                min="1"
                onChange={(event) => setForm({ ...form, alertThreshold: event.target.value })}
                type="number"
                value={form.alertThreshold}
              />
            </Field>
          </div>
          <label className="mt-5 flex items-center gap-3 rounded-lg border border-[#dfe7df] p-4 text-sm font-semibold text-[#25322d]">
            <input
              checked={form.rollover}
              className="size-4 rounded border-[#cfdacf] text-[#1f7a4f] focus:ring-[#3f7f58]"
              onChange={(event) => setForm({ ...form, rollover: event.target.checked })}
              type="checkbox"
            />
            Rollover
          </label>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button type="submit">
              <Save aria-hidden="true" size={18} />
              Guardar Presupuesto
            </Button>
            <Button onClick={resetForm} type="button" variant="secondary">
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {historyOpen ? (
        <section className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-[#17201c]">Historial de Presupuestos</h3>
          {budgetHistory.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#dfe7df] text-[#66756e]">
                    <th className="py-3 font-medium">Período</th>
                    <th className="py-3 font-medium">Categoría</th>
                    <th className="py-3 text-right font-medium">Límite</th>
                    <th className="py-3 text-right font-medium">Usado</th>
                    <th className="py-3 text-right font-medium">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetHistory.map((item) => (
                    <tr className="border-b border-[#edf2ee] last:border-0" key={item.id}>
                      <td className="py-4 text-[#66756e]">{item.periodLabel}</td>
                      <td className="py-4 font-semibold text-[#25322d]">{item.categoryName}</td>
                      <td className="py-4 text-right">
                        {financeService.formatMoney(item.limit, user.currency)}
                      </td>
                      <td className="py-4 text-right">
                        {financeService.formatMoney(item.used, user.currency)}
                      </td>
                      <td className="py-4 text-right font-semibold">
                        {item.result ?? (item.percent > 100 ? 'excedido' : 'cumplido')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 rounded-lg border border-dashed border-[#cfdacf] p-4 text-sm text-[#66756e]">
              Sin períodos anteriores para mostrar.
            </p>
          )}
        </section>
      ) : null}

      {!budgets.length ? (
        <EmptyState
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus aria-hidden="true" size={18} />
              Nuevo presupuesto
            </Button>
          }
          description="Cuando registres un presupuesto, el sistema comenzará a calcular el uso con tus gastos."
          title="No hay información disponible"
        />
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {budgets.map((budget) => (
            <article
              className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm"
              key={budget.id}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1f7a4f]">{budget.periodLabel}</p>
                  <h3 className="mt-1 text-xl font-semibold text-[#17201c]">
                    {budget.categoryName}
                  </h3>
                </div>
                <span
                  className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                    budget.percent > 100
                      ? 'bg-[#fff5f2] text-[#a24e30]'
                      : budget.percent >= budget.alertThreshold
                        ? 'bg-[#fff9e7] text-[#654d10]'
                        : 'bg-[#f3fbf6] text-[#1f7a4f]'
                  }`}
                >
                  {budget.percent > 100
                    ? 'Excedido'
                    : budget.percent >= budget.alertThreshold
                      ? 'Alerta'
                      : 'En seguimiento'}
                </span>
              </div>
              <div className="mt-5 h-2 rounded-lg bg-[#e6ece7]">
                <div
                  className={`h-2 rounded-lg ${
                    budget.percent > 100 ? 'bg-[#a24e30]' : 'bg-[#1f7a4f]'
                  }`}
                  style={{ width: `${Math.min(100, budget.percent)}%` }}
                />
              </div>
              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-4">
                <Metric
                  label="Límite"
                  value={financeService.formatMoney(budget.limit, user.currency)}
                />
                <Metric
                  label="Usado"
                  value={financeService.formatMoney(budget.used, user.currency)}
                />
                <Metric
                  label="Disponible"
                  value={financeService.formatMoney(budget.available, user.currency)}
                />
                <Metric label="% de uso" value={`${budget.percent}%`} />
              </dl>
              {budget.percent > 100 ? (
                <Alert variant="danger">El presupuesto fue excedido.</Alert>
              ) : budget.percent >= budget.alertThreshold ? (
                <Alert variant="warning">
                  El presupuesto alcanzó el umbral configurado de {budget.alertThreshold}%.
                </Alert>
              ) : null}
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => handleEdit(budget)} variant="secondary">
                  <Edit3 aria-hidden="true" size={16} />
                  Editar
                </Button>
                <Button onClick={() => handleDelete(budget)} variant="ghost">
                  <Trash2 aria-hidden="true" size={16} />
                  Eliminar
                </Button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}

const inputClasses =
  'mt-2 min-h-12 w-full rounded-lg border border-[#cfdacf] bg-white px-4 text-sm text-[#17201c] outline-none transition focus:border-[#1f7a4f] focus:ring-2 focus:ring-[#b8d8c6]'

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
    <div>
      <dt className="text-[#66756e]">{label}</dt>
      <dd className="mt-1 font-semibold text-[#25322d]">{value}</dd>
    </div>
  )
}
