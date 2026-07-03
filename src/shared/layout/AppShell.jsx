import {
  ShieldCheck,
  BarChart3,
  Bell,
  Download,
  FolderTree,
  Goal,
  LayoutDashboard,
  LogOut,
  Moon,
  PiggyBank,
  Plus,
  ReceiptText,
  Search,
  Settings,
  Sun,
  UserRound,
  WalletCards,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  downloadCsv,
  financeRows,
  hasSearchResults,
  searchFinanceData,
} from '../../features/analytics/analytics.js'
import { useAuth } from '../../features/auth/AuthContext.jsx'
import { useFinance } from '../../features/finance/useFinance.js'
import { NotificationCenter } from '../../features/notifications/NotificationCenter.jsx'
import { Button } from '../ui/Button.jsx'
import { useToast } from '../ui/Toast.jsx'

const navigation = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: Plus, label: 'Gastos/Ingresos', to: '/transactions/new' },
  { icon: ReceiptText, label: 'Movimientos', to: '/transactions' },
  { icon: FolderTree, label: 'Categorias', to: '/categories' },
  { icon: WalletCards, label: 'Cuentas', to: '/accounts' },
  { icon: Goal, label: 'Presupuestos', to: '/budgets' },
  { icon: PiggyBank, label: 'Metas', to: '/savings-goals' },
  { icon: BarChart3, label: 'Reportes', to: '/reports' },
  { icon: UserRound, label: 'Perfil', to: '/profile' },
  { icon: Settings, label: 'Configuracion', to: '/settings' },
  { icon: ShieldCheck, label: 'Admin', to: '/admin' },
]

const searchGroups = [
  { key: 'transactions', label: 'Movimientos' },
  { key: 'accounts', label: 'Cuentas' },
  { key: 'categories', label: 'Categorias' },
  { key: 'budgets', label: 'Presupuestos' },
  { key: 'goals', label: 'Metas' },
]

export function AppShell({ children }) {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const finance = useFinance(user.id)
  const { notify } = useToast()
  const [darkMode, setDarkMode] = useState(
    () => window.localStorage.getItem('finance-app.dark') === 'true'
  )
  const [search, setSearch] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [online, setOnline] = useState(() => window.navigator.onLine)

  useEffect(() => {
    window.localStorage.setItem('finance-app.dark', String(darkMode))
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    const handleThemeUpdate = (event) => {
      setDarkMode(Boolean(event.detail))
    }

    window.addEventListener('finance-app:theme-updated', handleThemeUpdate)

    return () => {
      window.removeEventListener('finance-app:theme-updated', handleThemeUpdate)
    }
  }, [])

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const searchResults = useMemo(() => searchFinanceData(finance, search), [finance, search])
  const unreadNotifications = finance.notifications.filter((notification) => !notification.read)
  const initials = (user?.fullName ?? 'Usuario')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleExport = () => {
    downloadCsv(
      'reporte-financiero.csv',
      financeRows(finance.transactions, finance.accounts, finance.categories)
    )
    notify('Reporte exportado.')
  }

  return (
    <main
      className={`min-h-screen ${
        darkMode ? 'bg-[#111815] text-[#eef6f0]' : 'bg-[#f4f7f5] text-[#202522]'
      }`}
    >
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[17rem_1fr]">
        <aside
          className={`border-b lg:border-b-0 lg:border-r ${
            darkMode ? 'border-[#26342d] bg-[#17201c]' : 'border-[#dfe7df] bg-white'
          }`}
        >
          <div className="flex h-full flex-col gap-5 p-4 lg:sticky lg:top-0 lg:min-h-screen">
            <div>
              <p
                className={`text-sm font-semibold ${darkMode ? 'text-[#9bd0af]' : 'text-[#1f7a4f]'}`}
              >
                Finance App
              </p>
              <h1 className="mt-1 text-xl font-semibold">Finanzas personales</h1>
            </div>

            <nav
              aria-label="Navegacion principal"
              className="flex gap-2 overflow-x-auto pb-1 lg:flex-col"
            >
              {navigation.map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    className={({ isActive }) =>
                      `inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
                        isActive
                          ? 'bg-[#1f7a4f] text-white'
                          : darkMode
                            ? 'text-[#c5d4cc] hover:bg-[#223028] hover:text-white'
                            : 'text-[#4e625a] hover:bg-[#edf4ef] hover:text-[#17201c]'
                      }`
                    }
                    key={item.to}
                    to={item.to}
                  >
                    <Icon aria-hidden="true" size={17} />
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>

            <button
              className={`mt-auto inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
                darkMode
                  ? 'text-[#c5d4cc] hover:bg-[#223028] hover:text-white'
                  : 'text-[#4e625a] hover:bg-[#edf4ef] hover:text-[#17201c]'
              }`}
              onClick={handleLogout}
              type="button"
            >
              <LogOut aria-hidden="true" size={17} />
              Cerrar sesion
            </button>
          </div>
        </aside>

        <div className="min-w-0">
          <header
            className={`sticky top-0 z-30 border-b ${
              darkMode ? 'border-[#26342d] bg-[#111815]/95' : 'border-[#dfe7df] bg-white/95'
            } backdrop-blur`}
          >
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
              {!online ? (
                <div className="rounded-lg border border-[#f1e1a7] bg-[#fff9e7] p-3 text-sm font-medium text-[#654d10]">
                  Modo offline activo. Algunas sincronizaciones con el servidor no estan
                  disponibles.
                </div>
              ) : null}

              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#1f7a4f] text-sm font-bold text-white">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`truncate text-sm font-semibold ${darkMode ? 'text-[#eef6f0]' : 'text-[#17201c]'}`}
                    >
                      {user?.fullName ?? 'Usuario'}
                    </p>
                    <p
                      className={`truncate text-xs ${darkMode ? 'text-[#9fafaa]' : 'text-[#66756e]'}`}
                    >
                      {user?.email}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="relative min-w-0 lg:w-80">
                    <Search
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#66756e]"
                      size={17}
                    />
                    <input
                      aria-label="Buscador global"
                      className={`min-h-11 w-full rounded-lg border px-10 text-sm outline-none transition focus:border-[#1f7a4f] focus:ring-2 focus:ring-[#b8d8c6] ${
                        darkMode
                          ? 'border-[#33443a] bg-[#17201c] text-white placeholder:text-[#84958b]'
                          : 'border-[#cfdacf] bg-white text-[#17201c] placeholder:text-[#8a9a93]'
                      }`}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Buscar movimientos, metas, cuentas..."
                      value={search}
                    />
                    {search ? (
                      <SearchResults
                        darkMode={darkMode}
                        onSelect={() => setSearch('')}
                        results={searchResults}
                      />
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => navigate('/transactions/new')}>
                      <Plus aria-hidden="true" size={18} />
                      Nuevo movimiento
                    </Button>
                    <Button onClick={handleExport} variant="secondary">
                      <Download aria-hidden="true" size={18} />
                      Exportar reporte
                    </Button>
                    <button
                      aria-label="Notificaciones"
                      className={`relative inline-flex min-h-11 items-center justify-center rounded-lg border px-3 text-sm font-semibold shadow-sm transition ${
                        darkMode
                          ? 'border-[#33443a] bg-[#17201c] text-[#eef6f0] hover:bg-[#223028]'
                          : 'border-[#cfdacf] bg-white text-[#25322d] hover:bg-[#f8fbf8]'
                      }`}
                      onClick={() => setNotificationsOpen((current) => !current)}
                      type="button"
                    >
                      <Bell aria-hidden="true" size={18} />
                      {unreadNotifications.length ? (
                        <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#a24e30] px-1 text-xs font-bold text-white">
                          {unreadNotifications.length}
                        </span>
                      ) : null}
                    </button>
                    <button
                      aria-label="Cambiar modo oscuro"
                      className={`inline-flex min-h-11 items-center justify-center rounded-lg border px-3 text-sm font-semibold shadow-sm transition ${
                        darkMode
                          ? 'border-[#33443a] bg-[#17201c] text-[#eef6f0] hover:bg-[#223028]'
                          : 'border-[#cfdacf] bg-white text-[#25322d] hover:bg-[#f8fbf8]'
                      }`}
                      onClick={() => setDarkMode((current) => !current)}
                      type="button"
                    >
                      {darkMode ? (
                        <Sun aria-hidden="true" size={18} />
                      ) : (
                        <Moon aria-hidden="true" size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {notificationsOpen ? (
                <NotificationCenter
                  darkMode={darkMode}
                  finance={finance}
                  onClose={() => setNotificationsOpen(false)}
                />
              ) : null}
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </div>
      </div>
    </main>
  )
}

function SearchResults({ darkMode, onSelect, results }) {
  const hasResults = hasSearchResults(results)

  return (
    <div
      className={`absolute left-0 right-0 top-12 z-40 max-h-[28rem] overflow-y-auto rounded-lg border p-3 shadow-xl ${
        darkMode ? 'border-[#33443a] bg-[#17201c]' : 'border-[#dde7de] bg-white'
      }`}
    >
      {hasResults ? (
        <div className="space-y-4">
          {searchGroups.map((group) =>
            results[group.key].length ? (
              <section key={group.key}>
                <h2
                  className={`text-xs font-bold uppercase ${darkMode ? 'text-[#9fafaa]' : 'text-[#66756e]'}`}
                >
                  {group.label}
                </h2>
                <div className="mt-2 space-y-1">
                  {results[group.key].map((item) => (
                    <Link
                      className={`block rounded-lg px-3 py-2 text-sm transition ${
                        darkMode
                          ? 'hover:bg-[#223028] hover:text-white'
                          : 'hover:bg-[#edf4ef] hover:text-[#17201c]'
                      }`}
                      key={item.id}
                      onClick={onSelect}
                      to={item.to}
                    >
                      <span className="block font-semibold">{item.label}</span>
                      <span
                        className={`block text-xs ${darkMode ? 'text-[#9fafaa]' : 'text-[#66756e]'}`}
                      >
                        {item.meta}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null
          )}
        </div>
      ) : (
        <p
          className={`rounded-lg border border-dashed p-4 text-sm ${darkMode ? 'text-[#9fafaa]' : 'text-[#66756e]'}`}
        >
          No se encontro informacion.
        </p>
      )}
    </div>
  )
}
