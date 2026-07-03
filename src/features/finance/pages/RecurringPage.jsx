import { Pause, Play, Trash2 } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext.jsx'
import { financeService, recurringFrequencies } from '../financeService.js'
import { useFinance } from '../useFinance.js'
import { Alert } from '../../../shared/ui/Alert.jsx'
import { Button } from '../../../shared/ui/Button.jsx'
import { EmptyState } from '../../../shared/ui/EmptyState.jsx'
import { useToast } from '../../../shared/ui/Toast.jsx'

export function RecurringPage() {
  const { user } = useAuth()
  const { actions, categories, recurringTransactions, savingsGoals } = useFinance(user.id)
  const { notify } = useToast()

  const getCategoryName = (categoryId) =>
    categories.find((category) => category.id === categoryId)?.name ?? 'Sin categoría'
  const getGoalName = (goalId) =>
    savingsGoals.find((goal) => goal.id === goalId)?.name ?? 'Meta de ahorro'

  const handleDelete = (recurring) => {
    if (!window.confirm('¿Eliminar esta recurrencia? No se eliminarán movimientos ya generados.')) {
      return
    }

    actions.deleteRecurring(recurring.id)
    notify('Recurrencia eliminada.')
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-[#1f7a4f]">Automatización</p>
        <h2 className="mt-1 text-3xl font-semibold text-[#17201c]">Transacciones Recurrentes</h2>
        <p className="mt-2 text-sm text-[#66756e]">
          Pausa, reanuda o elimina futuras generaciones sin borrar el historial ya creado.
        </p>
      </header>

      <Alert variant="info">
        Cuando exista una recurrencia vencida, el sistema genera automáticamente el movimiento
        correspondiente al consultar el estado y registra una notificación interna.
      </Alert>

      {!recurringTransactions.length ? (
        <EmptyState
          description="Marca un movimiento como recurrente desde el formulario de transacciones."
          title="No hay recurrencias activas"
        />
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {recurringTransactions.map((recurring) => (
            <article
              className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm"
              key={recurring.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#66756e]">
                    {financeService.labelFor(recurringFrequencies, recurring.frequency)}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-[#17201c]">
                    {recurring.template.kind === 'goal-contribution'
                      ? `Aporte a ${getGoalName(recurring.template.goalId)}`
                      : recurring.template.description ||
                        getCategoryName(recurring.template.categoryId)}
                  </h3>
                </div>
                <span
                  className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                    recurring.active ? 'bg-[#f3fbf6] text-[#1f7a4f]' : 'bg-[#edf2ee] text-[#66756e]'
                  }`}
                >
                  {recurring.active ? 'Activa' : 'Pausada'}
                </span>
              </div>
              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[#66756e]">Monto</dt>
                  <dd className="mt-1 font-semibold text-[#25322d]">
                    {financeService.formatMoney(
                      recurring.template.amount,
                      recurring.template.currency
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#66756e]">Próxima fecha</dt>
                  <dd className="mt-1 font-semibold text-[#25322d]">{recurring.nextDate}</dd>
                </div>
              </dl>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => {
                    actions.toggleRecurring(recurring.id)
                    notify(recurring.active ? 'Recurrencia pausada.' : 'Recurrencia reanudada.')
                  }}
                  variant="secondary"
                >
                  {recurring.active ? (
                    <Pause aria-hidden="true" size={16} />
                  ) : (
                    <Play aria-hidden="true" size={16} />
                  )}
                  {recurring.active ? 'Pausar' : 'Reanudar'}
                </Button>
                <Button onClick={() => handleDelete(recurring)} variant="ghost">
                  <Trash2 aria-hidden="true" size={16} />
                  Eliminar Recurrencia
                </Button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
