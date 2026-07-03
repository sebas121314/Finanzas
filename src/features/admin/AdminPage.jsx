import { Save, ShieldCheck, Trash2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { adminService } from './adminService.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { Alert } from '../../shared/ui/Alert.jsx'
import { Button } from '../../shared/ui/Button.jsx'
import { EmptyState } from '../../shared/ui/EmptyState.jsx'
import { useToast } from '../../shared/ui/Toast.jsx'

const roles = [
  { label: 'Miembro', value: 'member' },
  { label: 'Solo lectura', value: 'readonly' },
]

export function AdminPage() {
  const { user } = useAuth()
  const { notify } = useToast()
  const [snapshot, setSnapshot] = useState(() => adminService.getSnapshot())
  const [form, setForm] = useState({ email: '', role: 'member' })
  const [error, setError] = useState('')

  const refresh = (nextSnapshot) => setSnapshot({ ...nextSnapshot })

  const handleInvite = (event) => {
    event.preventDefault()
    setError('')

    try {
      refresh(adminService.inviteMember(form))
      setForm({ email: '', role: 'member' })
      notify('Invitacion enviada.')
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  const handleRoleChange = (memberId, role) => {
    refresh(adminService.updateRole(memberId, role))
    notify('Rol actualizado.')
  }

  const handleRevoke = (memberId) => {
    if (!window.confirm('Revocar acceso compartido?')) {
      return
    }

    refresh(adminService.revokeAccess(memberId))
    notify('Acceso revocado.')
  }

  if ((user.role ?? 'owner') !== 'owner') {
    return (
      <Alert variant="warning" title="Acceso restringido">
        Solo el propietario puede administrar accesos compartidos.
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-[#1f7a4f]">Panel opcional</p>
        <h2 className="mt-1 text-3xl font-semibold text-[#17201c]">Administracion</h2>
        <p className="mt-2 text-sm text-[#66756e]">
          Gestiona acceso compartido y revisa el log de auditoria del propietario.
        </p>
      </header>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <form
          className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm"
          onSubmit={handleInvite}
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-[#edf4ef] text-[#1f7a4f]">
              <UserPlus aria-hidden="true" size={20} />
            </span>
            <h3 className="text-lg font-semibold text-[#17201c]">Invitar usuario a una cuenta</h3>
          </div>
          <div className="mt-5 grid gap-4">
            <label className="text-sm font-medium text-[#25322d]">
              Email
              <input
                className={inputClasses}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="persona@email.com"
                type="email"
                value={form.email}
              />
            </label>
            <label className="text-sm font-medium text-[#25322d]">
              Rol
              <select
                className={inputClasses}
                onChange={(event) =>
                  setForm((current) => ({ ...current, role: event.target.value }))
                }
                value={form.role}
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-5">
            <Button type="submit">
              <Save aria-hidden="true" size={18} />
              Invitar usuario
            </Button>
          </div>
        </form>

        <section className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-[#edf4ef] text-[#1f7a4f]">
              <ShieldCheck aria-hidden="true" size={20} />
            </span>
            <h3 className="text-lg font-semibold text-[#17201c]">Usuarios con acceso</h3>
          </div>

          {snapshot.members.length ? (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#dfe7df] text-[#66756e]">
                    <th className="py-3 font-medium">Usuario</th>
                    <th className="py-3 font-medium">Rol</th>
                    <th className="py-3 font-medium">Estado</th>
                    <th className="py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.members.map((member) => (
                    <tr className="border-b border-[#edf2ee] last:border-0" key={member.id}>
                      <td className="py-4 font-semibold text-[#25322d]">{member.email}</td>
                      <td className="py-4">
                        <select
                          className={inputClasses}
                          onChange={(event) => handleRoleChange(member.id, event.target.value)}
                          value={member.role}
                        >
                          {roles.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4 text-[#66756e]">{member.status}</td>
                      <td className="py-4 text-right">
                        <Button onClick={() => handleRevoke(member.id)} variant="ghost">
                          <Trash2 aria-hidden="true" size={16} />
                          Revocar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              description="Aun no hay usuarios invitados a cuentas compartidas."
              title="Sin accesos compartidos"
            />
          )}
        </section>
      </section>

      <section className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-[#17201c]">Log de auditoria</h3>
        {snapshot.auditLog.length ? (
          <div className="mt-4 space-y-3">
            {snapshot.auditLog.map((entry) => (
              <div className="rounded-lg border border-[#edf2ee] p-4 text-sm" key={entry.id}>
                <p className="font-semibold text-[#25322d]">{entry.action}</p>
                <p className="mt-1 text-[#66756e]">
                  {entry.userEmail} · {new Date(entry.date).toLocaleString('es-CO')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-[#cfdacf] p-4 text-sm text-[#66756e]">
            Sin eventos de auditoria registrados.
          </p>
        )}
      </section>
    </div>
  )
}

const inputClasses =
  'mt-2 min-h-12 w-full rounded-lg border border-[#cfdacf] bg-white px-4 text-sm text-[#17201c] outline-none transition focus:border-[#1f7a4f] focus:ring-2 focus:ring-[#b8d8c6]'
