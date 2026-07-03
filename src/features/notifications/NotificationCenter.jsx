import { CheckCheck, ExternalLink, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../shared/ui/Button.jsx'

export function NotificationCenter({ darkMode = false, finance, onClose }) {
  const [filter, setFilter] = useState('all')
  const notifications = useMemo(() => {
    const source =
      filter === 'unread'
        ? finance.notifications.filter((notification) => !notification.read)
        : finance.notifications

    return [...source].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  }, [filter, finance.notifications])

  const panelClasses = darkMode
    ? 'border-[#33443a] bg-[#17201c] text-[#eef6f0]'
    : 'border-[#dde7de] bg-[#fbfcfb] text-[#17201c]'
  const itemClasses = darkMode
    ? 'border-[#33443a] bg-[#111815] text-[#d9e5de]'
    : 'border-[#edf2ee] bg-white text-[#25322d]'

  return (
    <section className={`rounded-lg border p-4 ${panelClasses}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Centro de notificaciones</h2>
          <p className={`mt-1 text-xs ${darkMode ? 'text-[#9fafaa]' : 'text-[#66756e]'}`}>
            Presupuestos, metas, pagos proximos y movimientos recurrentes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${
              filter === 'all' ? 'bg-[#1f7a4f] text-white' : 'border border-[#cfdacf]'
            }`}
            onClick={() => setFilter('all')}
            type="button"
          >
            Todas
          </button>
          <button
            className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${
              filter === 'unread' ? 'bg-[#1f7a4f] text-white' : 'border border-[#cfdacf]'
            }`}
            onClick={() => setFilter('unread')}
            type="button"
          >
            No leidas
          </button>
          <Button onClick={() => finance.actions.markAllNotificationsRead()} variant="secondary">
            <CheckCheck aria-hidden="true" size={16} />
            Marcar todas
          </Button>
        </div>
      </div>

      {notifications.length ? (
        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {notifications.map((notification) => (
            <article
              className={`rounded-lg border p-3 text-sm ${itemClasses}`}
              key={notification.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{notificationTypeLabel(notification.type)}</p>
                  <p className={`mt-1 ${darkMode ? 'text-[#c5d4cc]' : 'text-[#4e625a]'}`}>
                    {notification.message}
                  </p>
                  <p className={`mt-2 text-xs ${darkMode ? 'text-[#9fafaa]' : 'text-[#66756e]'}`}>
                    {new Date(notification.createdAt).toLocaleString('es-CO')}
                    {notification.emailQueued ? ' · email programado' : ''}
                  </p>
                </div>
                {!notification.read ? (
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-[#1f7a4f]" />
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {!notification.read ? (
                  <Button
                    onClick={() => finance.actions.markNotificationRead(notification.id)}
                    variant="secondary"
                  >
                    Marcar leida
                  </Button>
                ) : null}
                <Link
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#cfdacf] bg-white px-4 text-sm font-semibold text-[#25322d] shadow-sm transition hover:bg-[#f8fbf8]"
                  onClick={onClose}
                  to={notification.relatedTo ?? '/dashboard'}
                >
                  <ExternalLink aria-hidden="true" size={16} />
                  Abrir detalles
                </Link>
                <Button
                  onClick={() => finance.actions.deleteNotification(notification.id)}
                  variant="ghost"
                >
                  <Trash2 aria-hidden="true" size={16} />
                  Eliminar
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p
          className={`mt-4 rounded-lg border border-dashed p-4 text-sm ${
            darkMode ? 'text-[#9fafaa]' : 'text-[#66756e]'
          }`}
        >
          No hay notificaciones para mostrar.
        </p>
      )}
    </section>
  )
}

function notificationTypeLabel(type) {
  if (type === 'budget-exceeded') {
    return 'Presupuesto Excedido'
  }

  if (type === 'budget-threshold') {
    return 'Presupuesto en alerta'
  }

  if (type === 'goal-fulfilled') {
    return 'Meta Alcanzada'
  }

  if (type === 'recurring' || type === 'transaction-created') {
    return 'Nuevo Movimiento Registrado'
  }

  return 'Pago Proximo'
}
