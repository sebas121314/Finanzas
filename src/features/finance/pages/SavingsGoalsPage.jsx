import { Edit3, PiggyBank, Plus, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext.jsx'
import { financeService, recurringFrequencies } from '../financeService.js'
import { useFinance } from '../useFinance.js'
import { Alert } from '../../../shared/ui/Alert.jsx'
import { Button } from '../../../shared/ui/Button.jsx'
import { EmptyState } from '../../../shared/ui/EmptyState.jsx'
import { useToast } from '../../../shared/ui/Toast.jsx'

const goalDefaults = {
  accountId: '',
  autoAmount: '',
  autoContribution: false,
  autoFrequency: 'monthly',
  description: '',
  id: '',
  name: '',
  targetAmount: '',
  targetDate: '',
}

const contributionDefaults = {
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  note: '',
}

export function SavingsGoalsPage() {
  const { user } = useAuth()
  const { actions, activeAccounts, savingsGoals } = useFinance(user.id)
  const { notify } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(goalDefaults)
  const [contributionGoalId, setContributionGoalId] = useState('')
  const [contributionForm, setContributionForm] = useState(contributionDefaults)
  const [error, setError] = useState('')

  const resetForm = () => {
    setForm(goalDefaults)
    setFormOpen(false)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    try {
      actions.saveSavingsGoal(form)
      notify(form.id ? 'Meta actualizada.' : 'Meta creada.')
      resetForm()
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  const handleEdit = (goal) => {
    setError('')
    setForm({
      accountId: goal.accountId,
      autoAmount: '',
      autoContribution: false,
      autoFrequency: 'monthly',
      description: goal.description,
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate,
    })
    setFormOpen(true)
  }

  const handleDelete = (goal) => {
    if (!window.confirm('¿Eliminar esta meta? Se marcará como cancelada.')) {
      return
    }

    actions.deleteSavingsGoal(goal.id)
    notify('Meta cancelada.')
  }

  const handleContributionSubmit = (event) => {
    event.preventDefault()
    setError('')

    try {
      actions.addGoalContribution(contributionGoalId, contributionForm)
      notify('Aporte registrado.')
      setContributionGoalId('')
      setContributionForm(contributionDefaults)
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1f7a4f]">Planeación financiera</p>
          <h2 className="mt-1 text-3xl font-semibold text-[#17201c]">Metas de Ahorro</h2>
          <p className="mt-2 text-sm text-[#66756e]">
            Define objetivos, registra aportes y sigue el progreso automáticamente.
          </p>
        </div>
        <Button
          onClick={() => {
            setError('')
            setForm(goalDefaults)
            setFormOpen(true)
          }}
        >
          <Plus aria-hidden="true" size={18} />
          Nueva meta
        </Button>
      </header>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      {formOpen ? (
        <form
          className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm"
          onSubmit={handleSubmit}
        >
          <h3 className="text-lg font-semibold text-[#17201c]">
            {form.id ? 'Editar meta' : 'Nueva meta'}
          </h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Nombre de la meta">
              <input
                className={inputClasses}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Viaje fin de año"
                value={form.name}
              />
            </Field>
            <Field label="Monto objetivo">
              <input
                className={inputClasses}
                min="0"
                onChange={(event) => setForm({ ...form, targetAmount: event.target.value })}
                type="number"
                value={form.targetAmount}
              />
            </Field>
            <Field label="Fecha objetivo">
              <input
                className={inputClasses}
                onChange={(event) => setForm({ ...form, targetDate: event.target.value })}
                type="date"
                value={form.targetDate}
              />
            </Field>
            <Field label="Cuenta de ahorro vinculada">
              <select
                className={inputClasses}
                onChange={(event) => setForm({ ...form, accountId: event.target.value })}
                value={form.accountId}
              >
                <option value="">Sin cuenta vinculada</option>
                {activeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Descripción opcional">
            <textarea
              className={`${inputClasses} min-h-24 py-3`}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              value={form.description}
            />
          </Field>
          <label className="mt-5 flex items-center gap-3 rounded-lg border border-[#dfe7df] p-4 text-sm font-semibold text-[#25322d]">
            <input
              checked={form.autoContribution}
              className="size-4 rounded border-[#cfdacf] text-[#1f7a4f] focus:ring-[#3f7f58]"
              onChange={(event) => setForm({ ...form, autoContribution: event.target.checked })}
              type="checkbox"
            />
            ¿Aporte automático recurrente?
          </label>
          {form.autoContribution ? (
            <div className="mt-4 grid gap-4 rounded-lg border border-[#dfe7df] bg-[#f8fbf8] p-4 md:grid-cols-2">
              <Field label="Monto automático">
                <input
                  className={inputClasses}
                  min="0"
                  onChange={(event) => setForm({ ...form, autoAmount: event.target.value })}
                  type="number"
                  value={form.autoAmount}
                />
              </Field>
              <Field label="Frecuencia">
                <select
                  className={inputClasses}
                  onChange={(event) => setForm({ ...form, autoFrequency: event.target.value })}
                  value={form.autoFrequency}
                >
                  {recurringFrequencies.map((frequency) => (
                    <option key={frequency.value} value={frequency.value}>
                      {frequency.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          ) : null}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button type="submit">
              <Save aria-hidden="true" size={18} />
              {form.id ? 'Guardar cambios' : 'Crear meta'}
            </Button>
            <Button onClick={resetForm} type="button" variant="secondary">
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {contributionGoalId ? (
        <form
          className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm"
          onSubmit={handleContributionSubmit}
        >
          <h3 className="text-lg font-semibold text-[#17201c]">Agregar aporte</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Field label="Monto del aporte">
              <input
                className={inputClasses}
                min="0"
                onChange={(event) =>
                  setContributionForm({ ...contributionForm, amount: event.target.value })
                }
                type="number"
                value={contributionForm.amount}
              />
            </Field>
            <Field label="Fecha">
              <input
                className={inputClasses}
                onChange={(event) =>
                  setContributionForm({ ...contributionForm, date: event.target.value })
                }
                type="date"
                value={contributionForm.date}
              />
            </Field>
            <Field label="Nota opcional">
              <input
                className={inputClasses}
                onChange={(event) =>
                  setContributionForm({ ...contributionForm, note: event.target.value })
                }
                value={contributionForm.note}
              />
            </Field>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button type="submit">Guardar aporte</Button>
            <Button onClick={() => setContributionGoalId('')} type="button" variant="secondary">
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {!savingsGoals.length ? (
        <EmptyState
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus aria-hidden="true" size={18} />
              Nueva meta
            </Button>
          }
          description="Crea metas para controlar el avance de objetivos concretos."
          title="No hay metas registradas"
        />
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {savingsGoals.map((goal) => (
            <article
              className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm"
              key={goal.id}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1f7a4f]">{goal.targetDate}</p>
                  <h3 className="mt-1 text-xl font-semibold text-[#17201c]">{goal.name}</h3>
                  {goal.description ? (
                    <p className="mt-2 text-sm text-[#66756e]">{goal.description}</p>
                  ) : null}
                </div>
                <span
                  className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                    goal.status === 'fulfilled'
                      ? 'bg-[#f3fbf6] text-[#1f7a4f]'
                      : goal.status === 'cancelled'
                        ? 'bg-[#edf2ee] text-[#66756e]'
                        : 'bg-[#f2f8fb] text-[#244b61]'
                  }`}
                >
                  {goal.status === 'fulfilled'
                    ? 'Cumplida'
                    : goal.status === 'cancelled'
                      ? 'Cancelada'
                      : 'Activa'}
                </span>
              </div>
              <div className="mt-5 h-2 rounded-lg bg-[#e6ece7]">
                <div
                  className="h-2 rounded-lg bg-[#d6a93a]"
                  style={{ width: `${goal.percent}%` }}
                />
              </div>
              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                <Metric
                  label="Objetivo"
                  value={financeService.formatMoney(goal.targetAmount, user.currency)}
                />
                <Metric
                  label="Acumulado"
                  value={financeService.formatMoney(goal.currentAmount, user.currency)}
                />
                <Metric label="Avance" value={`${goal.percent}%`} />
              </dl>
              {goal.status === 'fulfilled' ? (
                <Alert variant="success">La meta fue alcanzada.</Alert>
              ) : null}
              <section className="mt-5 rounded-lg border border-[#edf2ee] p-4">
                <h4 className="text-sm font-semibold text-[#25322d]">Historial de aportes</h4>
                {goal.contributions.length ? (
                  <div className="mt-3 space-y-2">
                    {goal.contributions.map((contribution) => (
                      <div
                        className="flex items-center justify-between gap-3 text-sm"
                        key={contribution.id}
                      >
                        <span className="text-[#66756e]">{contribution.date}</span>
                        <span className="font-semibold text-[#25322d]">
                          {financeService.formatMoney(contribution.amount, user.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[#66756e]">Sin aportes registrados.</p>
                )}
              </section>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => setContributionGoalId(goal.id)} variant="secondary">
                  <PiggyBank aria-hidden="true" size={16} />
                  Agregar aporte
                </Button>
                <Button onClick={() => handleEdit(goal)} variant="secondary">
                  <Edit3 aria-hidden="true" size={16} />
                  Editar meta
                </Button>
                <Button onClick={() => handleDelete(goal)} variant="ghost">
                  <Trash2 aria-hidden="true" size={16} />
                  Eliminar meta
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
