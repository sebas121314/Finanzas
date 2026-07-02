import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  Plus,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from 'lucide-react'

const summary = [
  {
    label: 'Balance actual',
    value: '$ 8.420.000',
    change: '+12,4%',
    trend: 'up',
    icon: WalletCards,
  },
  {
    label: 'Ingresos del mes',
    value: '$ 3.180.000',
    change: '+8,1%',
    trend: 'up',
    icon: ArrowUpRight,
  },
  {
    label: 'Gastos del mes',
    value: '$ 1.950.000',
    change: '-4,6%',
    trend: 'down',
    icon: ArrowDownRight,
  },
]

const transactions = [
  { name: 'Pago nómina', category: 'Ingresos', amount: '+$ 2.800.000', date: '01 Jul' },
  { name: 'Arriendo apartamento', category: 'Vivienda', amount: '-$ 1.150.000', date: '30 Jun' },
  { name: 'Supermercado', category: 'Mercado', amount: '-$ 284.000', date: '29 Jun' },
]

const goals = [
  { label: 'Fondo emergencia', current: 72 },
  { label: 'Viaje fin de año', current: 48 },
  { label: 'Inversión mensual', current: 64 },
]

function App() {
  return (
    <main className="min-h-screen bg-[#f4f7f5] text-[#202522]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-[#dfe7df] pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-[#587067]">Sebastia Macias</p>
            <h1 className="mt-1 text-3xl font-semibold text-[#17201c] sm:text-4xl">Finance App</h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#cfdacf] bg-white px-4 text-sm font-semibold text-[#25322d] shadow-sm transition hover:border-[#8fb49d] hover:bg-[#f8fbf8] focus:outline-none focus:ring-2 focus:ring-[#3f7f58] focus:ring-offset-2"
            >
              <CalendarDays aria-hidden="true" size={18} />
              Julio 2026
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#1f7a4f] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#17633f] focus:outline-none focus:ring-2 focus:ring-[#3f7f58] focus:ring-offset-2"
            >
              <Plus aria-hidden="true" size={18} />
              Registrar movimiento
            </button>
          </div>
        </header>

        <section aria-label="Resumen financiero" className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {summary.map((item) => {
            const Icon = item.icon
            const isPositive = item.trend === 'up'

            return (
              <article
                className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm"
                key={item.label}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-[#66756e]">{item.label}</p>
                    <p className="mt-3 text-2xl font-semibold text-[#17201c]">{item.value}</p>
                  </div>
                  <span className="flex size-10 items-center justify-center rounded-lg bg-[#edf4ef] text-[#1f7a4f]">
                    <Icon aria-hidden="true" size={20} />
                  </span>
                </div>
                <p
                  className={`mt-4 text-sm font-medium ${
                    isPositive ? 'text-[#1f7a4f]' : 'text-[#a24e30]'
                  }`}
                >
                  {item.change} frente al mes anterior
                </p>
              </article>
            )
          })}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#17201c]">Flujo de caja</h2>
                <p className="mt-1 text-sm text-[#66756e]">Ingresos y egresos proyectados</p>
              </div>
              <ChartNoAxesCombined aria-hidden="true" className="text-[#315b78]" size={24} />
            </div>

            <div className="mt-6 flex h-56 items-end gap-3 sm:gap-5">
              {[64, 42, 78, 56, 86, 68].map((height, index) => (
                <div className="flex flex-1 flex-col items-center gap-2" key={height}>
                  <div className="flex h-44 w-full items-end rounded-lg bg-[#eef2f0]">
                    <div
                      className="w-full rounded-lg bg-[#2d7c96]"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-[#66756e]">S{index + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#17201c]">Metas</h2>
                <p className="mt-1 text-sm text-[#66756e]">Seguimiento de ahorro</p>
              </div>
              <ShieldCheck aria-hidden="true" className="text-[#1f7a4f]" size={24} />
            </div>

            <div className="mt-6 space-y-5">
              {goals.map((goal) => (
                <div key={goal.label}>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-[#25322d]">{goal.label}</span>
                    <span className="text-[#66756e]">{goal.current}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-lg bg-[#e6ece7]">
                    <div
                      className="h-2 rounded-lg bg-[#d6a93a]"
                      style={{ width: `${goal.current}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#17201c]">Movimientos recientes</h2>
              <p className="mt-1 text-sm text-[#66756e]">Últimas transacciones registradas</p>
            </div>
            <ReceiptText aria-hidden="true" className="text-[#315b78]" size={24} />
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#dfe7df] text-[#66756e]">
                  <th className="py-3 font-medium">Movimiento</th>
                  <th className="py-3 font-medium">Categoría</th>
                  <th className="py-3 font-medium">Fecha</th>
                  <th className="py-3 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr className="border-b border-[#edf2ee] last:border-0" key={transaction.name}>
                    <td className="py-4 font-medium text-[#25322d]">{transaction.name}</td>
                    <td className="py-4 text-[#66756e]">{transaction.category}</td>
                    <td className="py-4 text-[#66756e]">{transaction.date}</td>
                    <td
                      className={`py-4 text-right font-semibold ${
                        transaction.amount.startsWith('+') ? 'text-[#1f7a4f]' : 'text-[#a24e30]'
                      }`}
                    >
                      {transaction.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  )
}

export default App
