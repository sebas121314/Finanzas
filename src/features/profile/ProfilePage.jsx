import { Download, Lock, Mail, Save, Shield, Trash2, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { downloadCsv, downloadTextFile, financeRows } from '../analytics/analytics.js'
import { aiService } from '../ai/aiService.js'
import { authService } from '../auth/authService.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { currencies } from '../finance/financeService.js'
import { useFinance } from '../finance/useFinance.js'
import { Alert } from '../../shared/ui/Alert.jsx'
import { Button } from '../../shared/ui/Button.jsx'
import { useToast } from '../../shared/ui/Toast.jsx'

const languages = [
  { label: 'Espanol', value: 'es' },
  { label: 'English', value: 'en' },
]

const notificationTypes = [
  { key: 'budgetExceeded', label: 'Presupuesto excedido' },
  { key: 'goalReached', label: 'Meta alcanzada' },
  { key: 'upcomingPayment', label: 'Pago proximo' },
  { key: 'newMovement', label: 'Nuevo movimiento' },
]

export function ProfilePage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const { user } = auth
  const finance = useFinance(user.id)
  const { notify } = useToast()
  const [profileForm, setProfileForm] = useState(() => ({
    currency: user.currency ?? 'COP',
    darkMode: Boolean(user.darkMode ?? window.localStorage.getItem('finance-app.dark') === 'true'),
    email: user.email ?? '',
    fullName: user.fullName ?? '',
    language: user.language ?? 'es',
    phone: user.phone ?? '',
  }))
  const [passwordForm, setPasswordForm] = useState({
    confirmPassword: '',
    currentPassword: '',
    newPassword: '',
  })
  const [deletePassword, setDeletePassword] = useState('')
  const [sessionsOpen, setSessionsOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(aiService.isEnabled())
  const [error, setError] = useState('')

  const sessions = authService.getActiveSessions(user.id)
  const preferences = user.notificationPreferences ?? {}

  const updateProfileForm = (key, value) => {
    setProfileForm((current) => ({ ...current, [key]: value }))
  }

  const handleProfileSubmit = (event) => {
    event.preventDefault()
    setError('')

    try {
      auth.updateProfile(profileForm)
      window.localStorage.setItem('finance-app.dark', String(profileForm.darkMode))
      window.dispatchEvent(
        new CustomEvent('finance-app:theme-updated', { detail: profileForm.darkMode })
      )
      notify('Perfil actualizado.')
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  const handlePasswordSubmit = (event) => {
    event.preventDefault()
    setError('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('La confirmacion de contrasena no coincide.')
      return
    }

    try {
      auth.changePassword(passwordForm)
      setPasswordForm({ confirmPassword: '', currentPassword: '', newPassword: '' })
      notify('Contrasena actualizada.')
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  const handleCloseSessions = () => {
    if (
      !window.confirm('Cerrar todas las sesiones activas? Tendras que iniciar sesion de nuevo.')
    ) {
      return
    }

    auth.closeActiveSessions()
    notify('Sesiones cerradas.')
    navigate('/login', { replace: true })
  }

  const handleTwoFactor = (enabled) => {
    auth.toggleTwoFactor(enabled)
    notify(enabled ? '2FA activado.' : '2FA desactivado.')
  }

  const handlePreferenceChange = (typeKey, channel, checked) => {
    auth.saveNotificationPreferences({
      ...preferences,
      [typeKey]: {
        ...preferences[typeKey],
        [channel]: checked,
      },
    })
    notify('Preferencias de notificacion actualizadas.')
  }

  const handleExportJson = () => {
    const payload = {
      finance: finance.actions.exportUserData(),
      profile: user,
    }

    downloadTextFile(
      'mis-datos-finanzas.json',
      JSON.stringify(payload, null, 2),
      'application/json'
    )
    notify('Datos exportados en JSON.')
  }

  const handleExportCsv = () => {
    downloadCsv(
      'mis-movimientos.csv',
      financeRows(finance.transactions, finance.accounts, finance.categories)
    )
    notify('Datos exportados en CSV.')
  }

  const handleDeleteAccount = () => {
    setError('')

    try {
      auth.deleteAccount(deletePassword)
      finance.actions.deleteUserData()
      notify('Cuenta eliminada.')
      navigate('/login', { replace: true })
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  const handleAiToggle = (enabled) => {
    aiService.setEnabled(enabled)
    setAiEnabled(enabled)
    notify(enabled ? 'IA activada.' : 'IA desactivada.')
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-[#1f7a4f]">Experiencia y seguridad</p>
        <h2 className="mt-1 text-3xl font-semibold text-[#17201c]">Perfil y Configuracion</h2>
        <p className="mt-2 text-sm text-[#66756e]">
          Administra tus datos, seguridad, notificaciones, privacidad e inteligencia.
        </p>
      </header>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <form
          className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm"
          onSubmit={handleProfileSubmit}
        >
          <SectionTitle icon={UserRound} title="Formulario Perfil" />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Nombre">
              <input
                className={inputClasses}
                onChange={(event) => updateProfileForm('fullName', event.target.value)}
                value={profileForm.fullName}
              />
            </Field>
            <Field label="Email">
              <input
                className={inputClasses}
                onChange={(event) => updateProfileForm('email', event.target.value)}
                type="email"
                value={profileForm.email}
              />
            </Field>
            <Field label="Celular">
              <input
                className={inputClasses}
                onChange={(event) => updateProfileForm('phone', event.target.value)}
                value={profileForm.phone}
              />
            </Field>
            <Field label="Moneda principal">
              <select
                className={inputClasses}
                onChange={(event) => updateProfileForm('currency', event.target.value)}
                value={profileForm.currency}
              >
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Idioma">
              <select
                className={inputClasses}
                onChange={(event) => updateProfileForm('language', event.target.value)}
                value={profileForm.language}
              >
                {languages.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </Field>
            <Toggle
              checked={profileForm.darkMode}
              label="Dark Mode"
              onChange={(checked) => updateProfileForm('darkMode', checked)}
            />
          </div>
          <div className="mt-5">
            <Button type="submit">
              <Save aria-hidden="true" size={18} />
              Guardar cambios
            </Button>
          </div>
        </form>

        <section className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm">
          <SectionTitle icon={Shield} title="Seguridad de la cuenta" />
          <div className="mt-5 space-y-4">
            <form
              className="rounded-lg border border-[#edf2ee] p-4"
              onSubmit={handlePasswordSubmit}
            >
              <h3 className="text-sm font-semibold text-[#25322d]">Cambiar contrasena</h3>
              <div className="mt-4 grid gap-3">
                <input
                  className={inputClasses}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }))
                  }
                  placeholder="Contrasena actual"
                  type="password"
                  value={passwordForm.currentPassword}
                />
                <input
                  className={inputClasses}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                  }
                  placeholder="Nueva contrasena"
                  type="password"
                  value={passwordForm.newPassword}
                />
                <input
                  className={inputClasses}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                  placeholder="Confirmar contrasena"
                  type="password"
                  value={passwordForm.confirmPassword}
                />
              </div>
              <div className="mt-4">
                <Button type="submit" variant="secondary">
                  <Lock aria-hidden="true" size={17} />
                  Cambiar contrasena
                </Button>
              </div>
            </form>

            <Toggle
              checked={Boolean(user.twoFactorEnabled)}
              label="Activar autenticacion en dos pasos (2FA)"
              onChange={handleTwoFactor}
            />

            <div className="rounded-lg border border-[#edf2ee] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#25322d]">Sesiones activas</h3>
                  <p className="mt-1 text-sm text-[#66756e]">
                    Revisa dispositivos antes de cerrar sesiones.
                  </p>
                </div>
                <Button onClick={() => setSessionsOpen((current) => !current)} variant="secondary">
                  Ver dispositivos
                </Button>
              </div>
              {sessionsOpen ? (
                <div className="mt-4 space-y-3">
                  {sessions.length ? (
                    sessions.map((session) => (
                      <div
                        className="rounded-lg border border-[#edf2ee] p-3 text-sm"
                        key={session.id}
                      >
                        <p className="font-semibold text-[#25322d]">{session.deviceInfo}</p>
                        <p className="mt-1 text-[#66756e]">
                          {session.ip} · {new Date(session.createdAt).toLocaleString('es-CO')}
                          {session.isCurrent ? ' · actual' : ''}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#66756e]">No hay sesiones registradas.</p>
                  )}
                  <Button onClick={handleCloseSessions} variant="danger">
                    Cerrar sesiones activas
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <section className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm">
          <SectionTitle icon={Mail} title="Preferencias de notificaciones" />
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#dfe7df] text-[#66756e]">
                  <th className="py-3 font-medium">Tipo</th>
                  <th className="py-3 text-center font-medium">In-app</th>
                  <th className="py-3 text-center font-medium">Email</th>
                </tr>
              </thead>
              <tbody>
                {notificationTypes.map((type) => (
                  <tr className="border-b border-[#edf2ee] last:border-0" key={type.key}>
                    <td className="py-4 font-semibold text-[#25322d]">{type.label}</td>
                    <td className="py-4 text-center">
                      <input
                        aria-label={`${type.label} in-app`}
                        checked={preferences[type.key]?.inApp ?? true}
                        className="size-4 rounded border-[#cfdacf] text-[#1f7a4f] focus:ring-[#3f7f58]"
                        onChange={(event) =>
                          handlePreferenceChange(type.key, 'inApp', event.target.checked)
                        }
                        type="checkbox"
                      />
                    </td>
                    <td className="py-4 text-center">
                      <input
                        aria-label={`${type.label} email`}
                        checked={preferences[type.key]?.email ?? false}
                        className="size-4 rounded border-[#cfdacf] text-[#1f7a4f] focus:ring-[#3f7f58]"
                        onChange={(event) =>
                          handlePreferenceChange(type.key, 'email', event.target.checked)
                        }
                        type="checkbox"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm">
          <SectionTitle icon={Download} title="Privacidad y datos" />
          <div className="mt-5 space-y-3">
            <Button fullWidth onClick={handleExportJson} variant="secondary">
              <Download aria-hidden="true" size={17} />
              Exportar mis datos JSON
            </Button>
            <Button fullWidth onClick={handleExportCsv} variant="secondary">
              <Download aria-hidden="true" size={17} />
              Exportar mis datos CSV
            </Button>
            <Toggle
              checked={aiEnabled}
              label="Activar modulo de recomendaciones IA"
              onChange={handleAiToggle}
            />
            <Button fullWidth onClick={() => setDeleteOpen((current) => !current)} variant="danger">
              <Trash2 aria-hidden="true" size={17} />
              Eliminar cuenta
            </Button>
          </div>
          {deleteOpen ? (
            <div className="mt-4 rounded-lg border border-[#f0d2c7] bg-[#fff5f2] p-4">
              <h3 className="text-sm font-semibold text-[#a24e30]">Confirmacion fuerte</h3>
              <p className="mt-2 text-sm leading-6 text-[#654234]">
                Se eliminara tu cuenta y la informacion financiera local asociada. Ingresa tu
                contrasena para confirmar.
              </p>
              <input
                className={inputClasses}
                onChange={(event) => setDeletePassword(event.target.value)}
                placeholder="Contrasena"
                type="password"
                value={deletePassword}
              />
              <div className="mt-4">
                <Button onClick={handleDeleteAccount} variant="danger">
                  Confirmar eliminacion
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </section>
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

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-lg bg-[#edf4ef] text-[#1f7a4f]">
        <Icon aria-hidden="true" size={20} />
      </span>
      <h3 className="text-lg font-semibold text-[#17201c]">{title}</h3>
    </div>
  )
}

function Toggle({ checked, label, onChange }) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-4 rounded-lg border border-[#dfe7df] p-4 text-sm font-semibold text-[#25322d]">
      <span>{label}</span>
      <input
        checked={checked}
        className="size-4 rounded border-[#cfdacf] text-[#1f7a4f] focus:ring-[#3f7f58]"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  )
}
