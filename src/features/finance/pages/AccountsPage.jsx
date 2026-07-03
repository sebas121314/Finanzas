import { Archive, ArrowLeftRight, Edit3, Plus, Save, WalletCards } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext.jsx'
import {
  accountTypes,
  colorOptions,
  currencies,
  financeService,
  iconOptions,
} from '../financeService.js'
import { useFinance } from '../useFinance.js'
import { Alert } from '../../../shared/ui/Alert.jsx'
import { Button } from '../../../shared/ui/Button.jsx'
import { EmptyState } from '../../../shared/ui/EmptyState.jsx'
import { useToast } from '../../../shared/ui/Toast.jsx'

const accountDefaults = {
  color: '#1f7a4f',
  currency: 'COP',
  icon: 'wallet',
  id: '',
  initialBalance: '',
  name: '',
  type: 'cash',
}

const transferDefaults = {
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  destinationAccountId: '',
  sourceAccountId: '',
}

export function AccountsPage() {
  const { user } = useAuth()
  const { accounts, actions, activeAccounts } = useFinance(user.id)
  const { notify } = useToast()
  const [accountFormOpen, setAccountFormOpen] = useState(false)
  const [transferFormOpen, setTransferFormOpen] = useState(false)
  const [accountForm, setAccountForm] = useState(accountDefaults)
  const [transferForm, setTransferForm] = useState(transferDefaults)
  const [error, setError] = useState('')

  const hasAccounts = accounts.length > 0
  const archivedAccounts = accounts.filter((account) => !account.active)
  const activeAccountOptions = useMemo(
    () => activeAccounts.map((account) => ({ label: account.name, value: account.id })),
    [activeAccounts]
  )

  const resetAccountForm = () => {
    setAccountForm(accountDefaults)
    setAccountFormOpen(false)
  }

  const handleEdit = (account) => {
    setError('')
    setAccountForm({
      color: account.color,
      currency: account.currency,
      icon: account.icon,
      id: account.id,
      initialBalance: account.initialBalance,
      name: account.name,
      type: account.type,
    })
    setAccountFormOpen(true)
  }

  const handleAccountSubmit = (event) => {
    event.preventDefault()
    setError('')

    try {
      actions.saveAccount(accountForm)
      notify(accountForm.id ? 'Cuenta actualizada.' : 'Cuenta creada.')
      resetAccountForm()
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  const handleArchive = (account) => {
    const hasMovements = accountsHaveMovements(account.id)
    const message = hasMovements
      ? 'La cuenta tiene movimientos asociados. Se archivará para conservar el historial.'
      : 'La cuenta se archivará y dejará de aparecer como opción activa.'

    if (!window.confirm(message)) {
      return
    }

    actions.archiveAccount(account.id)
    notify('Cuenta archivada.')
  }

  const accountsHaveMovements = (accountId) => {
    const snapshot = financeService.getSnapshot(user.id)
    return snapshot.transactions.some((transaction) => transaction.accountId === accountId)
  }

  const handleTransferSubmit = (event) => {
    event.preventDefault()
    setError('')

    try {
      actions.transfer(transferForm)
      notify('Transferencia registrada.')
      setTransferForm(transferDefaults)
      setTransferFormOpen(false)
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1f7a4f]">Gestión financiera</p>
          <h2 className="mt-1 text-3xl font-semibold text-[#17201c]">Cuentas</h2>
          <p className="mt-2 text-sm text-[#66756e]">
            Administra cuentas activas, saldos y transferencias internas.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => setTransferFormOpen((current) => !current)} variant="secondary">
            <ArrowLeftRight aria-hidden="true" size={18} />
            Nueva Transferencia
          </Button>
          <Button
            onClick={() => {
              setError('')
              setAccountForm(accountDefaults)
              setAccountFormOpen(true)
            }}
          >
            <Plus aria-hidden="true" size={18} />
            Nueva Cuenta
          </Button>
        </div>
      </header>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      {accountFormOpen ? (
        <form
          className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm"
          onSubmit={handleAccountSubmit}
        >
          <h3 className="text-lg font-semibold text-[#17201c]">
            {accountForm.id ? 'Editar Cuenta' : 'Nueva Cuenta'}
          </h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Nombre de la cuenta">
              <input
                className={inputClasses}
                onChange={(event) => setAccountForm({ ...accountForm, name: event.target.value })}
                placeholder="Cuenta principal"
                value={accountForm.name}
              />
            </Field>
            <Field label="Tipo">
              <select
                className={inputClasses}
                onChange={(event) => setAccountForm({ ...accountForm, type: event.target.value })}
                value={accountForm.type}
              >
                {accountTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Moneda">
              <select
                className={inputClasses}
                onChange={(event) =>
                  setAccountForm({ ...accountForm, currency: event.target.value })
                }
                value={accountForm.currency}
              >
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Saldo inicial">
              <input
                className={inputClasses}
                disabled={Boolean(accountForm.id)}
                min="0"
                onChange={(event) =>
                  setAccountForm({ ...accountForm, initialBalance: event.target.value })
                }
                type="number"
                value={accountForm.initialBalance}
              />
            </Field>
          </div>

          <SelectorGroup
            label="Color"
            onChange={(color) => setAccountForm({ ...accountForm, color })}
            options={colorOptions}
            selected={accountForm.color}
            type="color"
          />
          <SelectorGroup
            label="Ícono"
            onChange={(icon) => setAccountForm({ ...accountForm, icon })}
            options={iconOptions}
            selected={accountForm.icon}
            type="icon"
          />

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button type="submit">
              <Save aria-hidden="true" size={18} />
              Guardar Cuenta
            </Button>
            <Button onClick={resetAccountForm} type="button" variant="secondary">
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {transferFormOpen ? (
        <form
          className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm"
          onSubmit={handleTransferSubmit}
        >
          <h3 className="text-lg font-semibold text-[#17201c]">Nueva Transferencia</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Cuenta origen">
              <select
                className={inputClasses}
                onChange={(event) =>
                  setTransferForm({ ...transferForm, sourceAccountId: event.target.value })
                }
                value={transferForm.sourceAccountId}
              >
                <option value="">Selecciona cuenta</option>
                {activeAccountOptions.map((account) => (
                  <option key={account.value} value={account.value}>
                    {account.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cuenta destino">
              <select
                className={inputClasses}
                onChange={(event) =>
                  setTransferForm({ ...transferForm, destinationAccountId: event.target.value })
                }
                value={transferForm.destinationAccountId}
              >
                <option value="">Selecciona cuenta</option>
                {activeAccountOptions.map((account) => (
                  <option key={account.value} value={account.value}>
                    {account.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Monto">
              <input
                className={inputClasses}
                min="0"
                onChange={(event) =>
                  setTransferForm({ ...transferForm, amount: event.target.value })
                }
                type="number"
                value={transferForm.amount}
              />
            </Field>
            <Field label="Fecha">
              <input
                className={inputClasses}
                onChange={(event) => setTransferForm({ ...transferForm, date: event.target.value })}
                type="date"
                value={transferForm.date}
              />
            </Field>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button type="submit">Confirmar Transferencia</Button>
            <Button onClick={() => setTransferFormOpen(false)} type="button" variant="secondary">
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {!hasAccounts ? (
        <EmptyState
          action={
            <Button onClick={() => setAccountFormOpen(true)}>
              <Plus aria-hidden="true" size={18} />
              Crear primera cuenta
            </Button>
          }
          description="Cuando registres tu primera cuenta podrás usarla en gastos, ingresos y transferencias."
          title="No hay información disponible"
        />
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <article
              className={`rounded-lg border bg-white p-5 shadow-sm ${
                account.active ? 'border-[#dde7de]' : 'border-[#eadca8] opacity-75'
              }`}
              key={account.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#66756e]">
                    {financeService.labelFor(accountTypes, account.type)}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-[#17201c]">{account.name}</h3>
                </div>
                <span
                  className="flex size-11 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: account.color }}
                >
                  <WalletCards aria-hidden="true" size={22} />
                </span>
              </div>
              <p className="mt-5 text-2xl font-semibold text-[#17201c]">
                {financeService.formatMoney(account.currentBalance, account.currency)}
              </p>
              <p className="mt-1 text-sm text-[#66756e]">
                {account.active ? 'Cuenta activa' : 'Cuenta archivada'}
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => handleEdit(account)} variant="secondary">
                  <Edit3 aria-hidden="true" size={16} />
                  Editar Cuenta
                </Button>
                {account.active ? (
                  <Button onClick={() => handleArchive(account)} variant="ghost">
                    <Archive aria-hidden="true" size={16} />
                    Archivar Cuenta
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      )}

      {archivedAccounts.length ? (
        <Alert variant="info">
          Las cuentas archivadas conservan su historial, pero no aparecen como opción activa en
          nuevos movimientos.
        </Alert>
      ) : null}
    </div>
  )
}

const inputClasses =
  'mt-2 min-h-12 w-full rounded-lg border border-[#cfdacf] bg-white px-4 text-sm text-[#17201c] outline-none transition focus:border-[#1f7a4f] focus:ring-2 focus:ring-[#b8d8c6] disabled:bg-[#edf2ee]'

function Field({ children, label }) {
  return (
    <label className="block text-sm font-medium text-[#25322d]">
      {label}
      {children}
    </label>
  )
}

function SelectorGroup({ label, onChange, options, selected, type }) {
  return (
    <fieldset className="mt-5">
      <legend className="text-sm font-medium text-[#25322d]">{label}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            aria-pressed={selected === option}
            className={`min-h-10 rounded-lg border px-3 text-sm font-semibold ${
              selected === option ? 'border-[#1f7a4f] bg-[#edf4ef]' : 'border-[#cfdacf] bg-white'
            }`}
            key={option}
            onClick={() => onChange(option)}
            type="button"
          >
            {type === 'color' ? (
              <span
                className="inline-flex size-5 rounded-full align-middle"
                style={{ backgroundColor: option }}
              />
            ) : (
              option
            )}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
