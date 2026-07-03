export function BarChart({ emptyLabel = 'Sin datos para graficar', formatter, items, valueKey }) {
  const maxValue = Math.max(...items.map((item) => Number(item[valueKey] || 0)), 0)

  if (!maxValue) {
    return <ChartEmptyState label={emptyLabel} />
  }

  return (
    <div className="flex h-64 items-end gap-3" role="img" aria-label="Grafica de barras">
      {items.map((item) => {
        const value = Number(item[valueKey] || 0)
        const height = Math.max(8, Math.round((value / maxValue) * 100))

        return (
          <div
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
            key={item.key ?? item.label}
          >
            <div className="flex h-48 w-full items-end rounded-lg bg-[#eef2f0]">
              <div
                className="w-full rounded-lg bg-[#2d7c96]"
                style={{ height: `${height}%` }}
                title={`${item.label}: ${formatter ? formatter(value) : value}`}
              />
            </div>
            <span className="w-full truncate text-center text-xs font-medium text-[#66756e]">
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function ComparisonBars({ formatter, items }) {
  const maxValue = Math.max(
    ...items.flatMap((item) => [Number(item.income || 0), Number(item.expenses || 0)]),
    0
  )

  if (!maxValue) {
    return <ChartEmptyState label="Sin ingresos o gastos en el rango seleccionado" />
  }

  return (
    <div className="space-y-4" role="img" aria-label="Grafica ingresos contra gastos">
      {items.map((item) => {
        const incomeWidth = Math.round((Number(item.income || 0) / maxValue) * 100)
        const expenseWidth = Math.round((Number(item.expenses || 0) / maxValue) * 100)

        return (
          <div className="grid gap-2 text-sm sm:grid-cols-[5rem_1fr]" key={item.key ?? item.label}>
            <span className="font-medium text-[#66756e]">{item.label}</span>
            <div className="space-y-2">
              <div>
                <div className="h-3 rounded-lg bg-[#eef2f0]">
                  <div
                    className="h-3 rounded-lg bg-[#1f7a4f]"
                    style={{ width: `${Math.max(2, incomeWidth)}%` }}
                    title={`Ingresos: ${formatter ? formatter(item.income) : item.income}`}
                  />
                </div>
              </div>
              <div>
                <div className="h-3 rounded-lg bg-[#eef2f0]">
                  <div
                    className="h-3 rounded-lg bg-[#a24e30]"
                    style={{ width: `${Math.max(2, expenseWidth)}%` }}
                    title={`Gastos: ${formatter ? formatter(item.expenses) : item.expenses}`}
                  />
                </div>
              </div>
            </div>
          </div>
        )
      })}
      <div className="flex gap-4 text-xs font-semibold text-[#66756e]">
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-sm bg-[#1f7a4f]" />
          Ingresos
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-sm bg-[#a24e30]" />
          Gastos
        </span>
      </div>
    </div>
  )
}

export function LineChart({ emptyLabel = 'Sin datos para graficar', formatter, items }) {
  const values = items.map((item) => Number(item.value || 0))
  const maxValue = Math.max(...values, 0)
  const minValue = Math.min(...values, 0)
  const range = maxValue - minValue || 1

  if (!values.some((value) => value !== 0)) {
    return <ChartEmptyState label={emptyLabel} />
  }

  return (
    <div className="space-y-4" role="img" aria-label="Grafica lineal">
      <div className="flex h-56 items-end gap-2 rounded-lg border border-[#edf2ee] bg-[#fbfcfb] p-4">
        {items.map((item) => {
          const value = Number(item.value || 0)
          const height = Math.max(8, Math.round(((value - minValue) / range) * 100))

          return (
            <div
              className="flex min-w-0 flex-1 flex-col items-center gap-2"
              key={item.key ?? item.label}
            >
              <span
                className="w-full rounded-lg bg-[#315b78]"
                style={{ height: `${height}%` }}
                title={`${item.label}: ${formatter ? formatter(value) : value}`}
              />
              <span className="w-full truncate text-center text-xs font-medium text-[#66756e]">
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ChartEmptyState({ label }) {
  return (
    <div className="flex min-h-56 items-center justify-center rounded-lg border border-dashed border-[#cfdacf] bg-[#fbfcfb] p-6 text-center text-sm font-medium text-[#66756e]">
      {label}
    </div>
  )
}
