import { Banknote, CheckCircle2, ChevronRight, CircleDollarSign, Tags } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'
import { Button } from '../../../shared/ui/Button.jsx'

const currencies = [
  { code: 'COP', label: 'Peso colombiano' },
  { code: 'USD', label: 'Dólar estadounidense' },
  { code: 'EUR', label: 'Euro' },
  { code: 'MXN', label: 'Peso mexicano' },
]

const categoryOptions = [
  'Alimentación',
  'Transporte',
  'Vivienda',
  'Salud',
  'Entretenimiento',
  'Salario',
  'Otros',
]

const accountTypes = ['Efectivo', 'Cuenta bancaria', 'Tarjeta']

export function OnboardingPage() {
  const navigate = useNavigate()
  const { completeOnboarding, user } = useAuth()
  const [step, setStep] = useState(0)
  const [currency, setCurrency] = useState(user?.currency ?? 'COP')
  const [account, setAccount] = useState({
    balance: '',
    name: '',
    type: 'Cuenta bancaria',
  })
  const [categories, setCategories] = useState(categoryOptions)

  useEffect(() => {
    if (user?.onboardingCompleted) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate, user?.onboardingCompleted])

  const steps = useMemo(
    () => [
      { icon: CircleDollarSign, label: 'Moneda principal' },
      { icon: Banknote, label: 'Primera cuenta' },
      { icon: Tags, label: 'Categorías iniciales' },
      { icon: CheckCircle2, label: 'Cierre' },
    ],
    []
  )

  const goNext = () => setStep((currentStep) => Math.min(currentStep + 1, steps.length - 1))

  const handleCategoryToggle = (category) => {
    setCategories((currentCategories) =>
      currentCategories.includes(category)
        ? currentCategories.filter((item) => item !== category)
        : [...currentCategories, category]
    )
  }

  const handleFinish = () => {
    completeOnboarding({
      account: account.name
        ? {
            ...account,
            balance: Number(account.balance || 0),
          }
        : null,
      categories,
      currency,
    })
    navigate('/dashboard', { replace: true })
  }

  return (
    <main className="min-h-screen bg-[#f4f7f5] px-4 py-6 text-[#202522] sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <aside className="rounded-lg border border-[#dfe7df] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#1f7a4f]">Primer ingreso</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#17201c]">Configura tu cuenta</h1>
          <div className="mt-6 grid gap-3">
            {steps.map((item, index) => {
              const Icon = item.icon
              const isActive = index === step
              const isDone = index < step

              return (
                <div
                  className={`flex items-center gap-3 rounded-lg border p-3 ${
                    isActive || isDone
                      ? 'border-[#b8d8c6] bg-[#f3fbf6]'
                      : 'border-[#edf2ee] bg-white'
                  }`}
                  key={item.label}
                >
                  <span
                    className={`flex size-9 items-center justify-center rounded-lg ${
                      isActive || isDone ? 'bg-[#1f7a4f] text-white' : 'bg-[#eef2f0] text-[#66756e]'
                    }`}
                  >
                    <Icon aria-hidden="true" size={18} />
                  </span>
                  <span className="text-sm font-semibold text-[#25322d]">{item.label}</span>
                </div>
              )
            })}
          </div>
        </aside>

        <section className="rounded-lg border border-[#dfe7df] bg-white p-5 shadow-sm sm:p-7">
          {step === 0 ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-[#17201c]">Moneda principal</h2>
                <p className="mt-2 text-sm text-[#66756e]">
                  Se usará para saldos, presupuestos y reportes.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-[#25322d]" htmlFor="currency">
                  Moneda
                </label>
                <select
                  className="mt-2 min-h-12 w-full rounded-lg border border-[#cfdacf] bg-white px-4 text-sm text-[#17201c] shadow-sm outline-none focus:border-[#1f7a4f] focus:ring-2 focus:ring-[#b8d8c6]"
                  id="currency"
                  onChange={(event) => setCurrency(event.target.value)}
                  value={currency}
                >
                  {currencies.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.code} - {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button onClick={goNext} type="button">
                  Continuar
                  <ChevronRight aria-hidden="true" size={18} />
                </Button>
                <Button onClick={goNext} type="button" variant="secondary">
                  Omitir
                </Button>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-[#17201c]">Primera cuenta</h2>
                <p className="mt-2 text-sm text-[#66756e]">
                  Registra una cuenta inicial para empezar a clasificar movimientos.
                </p>
              </div>

              <div className="grid gap-5">
                <div>
                  <label className="text-sm font-medium text-[#25322d]" htmlFor="accountName">
                    Nombre
                  </label>
                  <input
                    className="mt-2 min-h-12 w-full rounded-lg border border-[#cfdacf] bg-white px-4 text-sm outline-none focus:border-[#1f7a4f] focus:ring-2 focus:ring-[#b8d8c6]"
                    id="accountName"
                    onChange={(event) => setAccount({ ...account, name: event.target.value })}
                    placeholder="Cuenta principal"
                    type="text"
                    value={account.name}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-[#25322d]" htmlFor="accountType">
                      Tipo
                    </label>
                    <select
                      className="mt-2 min-h-12 w-full rounded-lg border border-[#cfdacf] bg-white px-4 text-sm outline-none focus:border-[#1f7a4f] focus:ring-2 focus:ring-[#b8d8c6]"
                      id="accountType"
                      onChange={(event) => setAccount({ ...account, type: event.target.value })}
                      value={account.type}
                    >
                      {accountTypes.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#25322d]" htmlFor="balance">
                      Saldo inicial
                    </label>
                    <input
                      className="mt-2 min-h-12 w-full rounded-lg border border-[#cfdacf] bg-white px-4 text-sm outline-none focus:border-[#1f7a4f] focus:ring-2 focus:ring-[#b8d8c6]"
                      id="balance"
                      min="0"
                      onChange={(event) => setAccount({ ...account, balance: event.target.value })}
                      placeholder="0"
                      type="number"
                      value={account.balance}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button onClick={goNext} type="button">
                  Crear cuenta
                  <ChevronRight aria-hidden="true" size={18} />
                </Button>
                <Button
                  onClick={() => {
                    setAccount({ balance: '', name: '', type: 'Cuenta bancaria' })
                    goNext()
                  }}
                  type="button"
                  variant="secondary"
                >
                  Omitir
                </Button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-[#17201c]">Categorías iniciales</h2>
                <p className="mt-2 text-sm text-[#66756e]">
                  Puedes editar estas categorías después desde el módulo financiero.
                </p>
              </div>

              <fieldset>
                <legend className="text-sm font-medium text-[#25322d]">Categorías</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {categoryOptions.map((category) => (
                    <label
                      className="flex min-h-12 items-center gap-3 rounded-lg border border-[#dfe7df] px-4 text-sm font-medium text-[#25322d]"
                      key={category}
                    >
                      <input
                        checked={categories.includes(category)}
                        className="size-4 rounded border-[#cfdacf] text-[#1f7a4f] focus:ring-[#3f7f58]"
                        onChange={() => handleCategoryToggle(category)}
                        type="checkbox"
                      />
                      {category}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button onClick={goNext} type="button">
                  Continuar
                  <ChevronRight aria-hidden="true" size={18} />
                </Button>
                <Button
                  onClick={() => {
                    setCategories([])
                    goNext()
                  }}
                  type="button"
                  variant="secondary"
                >
                  Omitir
                </Button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="flex min-h-[28rem] flex-col items-center justify-center text-center">
              <span className="flex size-16 items-center justify-center rounded-lg bg-[#f3fbf6] text-[#1f7a4f]">
                <CheckCircle2 aria-hidden="true" size={34} />
              </span>
              <h2 className="mt-5 text-3xl font-semibold text-[#17201c]">Tu cuenta está lista</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-[#66756e]">
                El onboarding quedará marcado como completado para que vuelvas directo al dashboard.
              </p>
              <Button className="mt-6" onClick={handleFinish} type="button">
                Ir al Dashboard
              </Button>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  )
}
