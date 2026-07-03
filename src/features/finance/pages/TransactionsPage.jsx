import { Copy, Download, Edit3, Eye, FileText, Plus, RefreshCcw, Tags, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  downloadCsv,
  downloadTextFile,
  filterTransactions,
  financeRows,
  sortTransactions,
} from '../../analytics/analytics.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { financeService, paymentMethods } from '../financeService.js'
import { useFinance } from '../useFinance.js'
import { Alert } from '../../../shared/ui/Alert.jsx'
import { Button } from '../../../shared/ui/Button.jsx'
import { EmptyState } from '../../../shared/ui/EmptyState.jsx'
import { useToast } from '../../../shared/ui/Toast.jsx'

const initialFilters = {
  accountId: '',
  categoryId: '',
  endDate: '',
  maxAmount: '',
  minAmount: '',
  paymentMethod: '',
  search: '',
  startDate: '',
  tag: '',
  type: '',
}

const pageSize = 8

export function TransactionsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { accounts, actions, categories, transactions } = useFinance(user.id)
  const { notify } = useToast()
  const [filters, setFilters] = useState(initialFilters)
  const [sort, setSort] = useState({ direction: 'desc', key: 'date' })
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState([])
  const [batchCategoryId, setBatchCategoryId] = useState('')
  const [selectedDetailId, setSelectedDetailId] = useState('')
  const [loading, setLoading] = useState(true)
  const routeDetailId = searchParams.get('focus') ?? ''
  const detailId = selectedDetailId || routeDetailId

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 180)
    return () => window.clearTimeout(timer)
  }, [])

  const accountById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts]
  )
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  )
  const transactionIds = useMemo(
    () => new Set(transactions.map((transaction) => transaction.id)),
    [transactions]
  )
  const currentSelectedIds = selectedIds.filter((id) => transactionIds.has(id))

  const filteredTransactions = useMemo(
    () => sortTransactions(filterTransactions(transactions, filters), sort),
    [filters, sort, transactions]
  )

  const pageCount = Math.max(1, Math.ceil(filteredTransactions.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageItems = filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const selectedTransactions = transactions.filter((transaction) =>
    currentSelectedIds.includes(transaction.id)
  )
  const detailTransaction = transactions.find((transaction) => transaction.id === detailId)

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  const resetFilters = () => {
    setFilters(initialFilters)
    setBatchCategoryId('')
    setPage(1)
  }

  const toggleSort = (key) => {
    setSort((current) => ({
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
      key,
    }))
  }

  const toggleSelected = (transactionId) => {
    setSelectedIds((current) =>
      current.includes(transactionId)
        ? current.filter((id) => id !== transactionId)
        : [...current, transactionId]
    )
  }

  const togglePageSelected = () => {
    const pageIds = pageItems.map((transaction) => transaction.id)
    const allSelected = pageIds.every((id) => currentSelectedIds.includes(id))

    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !pageIds.includes(id))
        : [...new Set([...current, ...pageIds])]
    )
  }

  const handleDelete = (transaction) => {
    const message =
      transaction.type === 'transfer'
        ? 'Eliminar esta transferencia vinculada? Se revertiran ambos movimientos.'
        : 'Eliminar este movimiento? Se revertira el saldo de la cuenta.'

    if (!window.confirm(message)) {
      return
    }

    try {
      actions.deleteTransaction(transaction.id)
      setSelectedDetailId('')
      notify('Movimiento eliminado.')
    } catch (error) {
      notify(error.message, 'danger')
    }
  }

  const handleBatchDelete = () => {
    if (
      !selectedTransactions.length ||
      !window.confirm('Eliminar los movimientos seleccionados?')
    ) {
      return
    }

    const processedTransferGroups = new Set()

    try {
      selectedTransactions.forEach((transaction) => {
        if (transaction.type === 'transfer') {
          if (processedTransferGroups.has(transaction.transferGroupId)) {
            return
          }
          processedTransferGroups.add(transaction.transferGroupId)
        }

        actions.deleteTransaction(transaction.id)
      })
      setSelectedIds([])
      setSelectedDetailId('')
      notify('Movimientos eliminados.')
    } catch (error) {
      notify(error.message, 'danger')
    }
  }

  const handleBatchRecategorize = () => {
    const category = categories.find((item) => item.id === batchCategoryId)

    if (!category || !selectedTransactions.length) {
      notify('Selecciona una categoria para recategorizar.', 'danger')
      return
    }

    let updated = 0

    try {
      selectedTransactions.forEach((transaction) => {
        if (transaction.type === 'transfer' || transaction.type !== category.type) {
          return
        }

        actions.updateTransaction(transaction.id, {
          accountId: transaction.accountId,
          amount: transaction.amount,
          categoryId: category.id,
          date: transaction.date,
          description: transaction.description,
          paymentMethod: transaction.paymentMethod,
          tags: transaction.tags,
          type: transaction.type,
        })
        updated += 1
      })
      setSelectedIds([])
      setBatchCategoryId('')
      notify(`${updated} movimientos recategorizados.`)
    } catch (error) {
      notify(error.message, 'danger')
    }
  }

  const handleCsvExport = () => {
    downloadCsv('movimientos.csv', financeRows(filteredTransactions, accounts, categories))
    notify('CSV exportado.')
  }

  const handlePdfExport = () => {
    const rows = financeRows(filteredTransactions, accounts, categories)
    const content = [
      'Reporte de movimientos',
      `Generado: ${new Date().toLocaleString('es-CO')}`,
      '',
      ...rows.map(
        (row) =>
          `${row.fecha} | ${row.tipo} | ${row.categoria} | ${row.cuenta} | ${row.descripcion} | ${row.monto}`
      ),
    ].join('\n')

    downloadTextFile('movimientos.pdf', content, 'application/pdf')
    notify('PDF exportado.')
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1f7a4f]">Movimientos / Historial</p>
          <h2 className="mt-1 text-3xl font-semibold text-[#17201c]">Transacciones</h2>
          <p className="mt-2 text-sm text-[#66756e]">
            Consulta historial, filtra, exporta, recategoriza y revisa comprobantes.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleCsvExport} variant="secondary">
            <Download aria-hidden="true" size={18} />
            Exportar CSV
          </Button>
          <Button onClick={handlePdfExport} variant="secondary">
            <FileText aria-hidden="true" size={18} />
            Exportar PDF
          </Button>
          <Button onClick={() => navigate('/transactions/new')}>
            <Plus aria-hidden="true" size={18} />
            Nuevo movimiento
          </Button>
        </div>
      </header>

      <Filters
        accounts={accounts}
        categories={categories}
        filters={filters}
        onReset={resetFilters}
        onUpdate={updateFilter}
      />

      {currentSelectedIds.length ? (
        <section className="rounded-lg border border-[#dde7de] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#17201c]">
                {currentSelectedIds.length} seleccionados
              </p>
              <p className="mt-1 text-sm text-[#66756e]">
                Acciones en lote para eliminar o recategorizar movimientos.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(12rem,18rem)_auto_auto]">
              <select
                aria-label="Categoria para recategorizar"
                className={inputClasses}
                onChange={(event) => setBatchCategoryId(event.target.value)}
                value={batchCategoryId}
              >
                <option value="">Categoria destino</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.type === 'expense' ? 'gasto' : 'ingreso'})
                  </option>
                ))}
              </select>
              <Button onClick={handleBatchRecategorize} variant="secondary">
                <Tags aria-hidden="true" size={17} />
                Recategorizar
              </Button>
              <Button onClick={handleBatchDelete} variant="danger">
                <Trash2 aria-hidden="true" size={17} />
                Eliminar
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {!transactions.length ? (
        <EmptyState
          action={
            <Button onClick={() => navigate('/transactions/new')}>
              <Plus aria-hidden="true" size={18} />
              Registrar movimiento
            </Button>
          }
          description="No hay informacion disponible. Registra gastos o ingresos para consultar el historial."
          title="No hay movimientos registrados"
        />
      ) : (
        <section className={`grid gap-4 ${detailTransaction ? 'xl:grid-cols-[1fr_24rem]' : ''}`}>
          <div className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm">
            {loading ? (
              <SkeletonTable />
            ) : filteredTransactions.length ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#dfe7df] text-[#66756e]">
                        <th className="py-3 pr-3">
                          <input
                            aria-label="Seleccionar pagina"
                            checked={pageItems.every((transaction) =>
                              currentSelectedIds.includes(transaction.id)
                            )}
                            className="size-4 rounded border-[#cfdacf] text-[#1f7a4f] focus:ring-[#3f7f58]"
                            onChange={togglePageSelected}
                            type="checkbox"
                          />
                        </th>
                        <SortableHeader
                          label="Fecha"
                          onClick={() => toggleSort('date')}
                          sort={sort}
                          sortKey="date"
                        />
                        <SortableHeader
                          label="Tipo"
                          onClick={() => toggleSort('type')}
                          sort={sort}
                          sortKey="type"
                        />
                        <th className="py-3 font-medium">Categoria</th>
                        <th className="py-3 font-medium">Cuenta</th>
                        <SortableHeader
                          label="Descripcion"
                          onClick={() => toggleSort('description')}
                          sort={sort}
                          sortKey="description"
                        />
                        <th className="py-3 font-medium">Metodo</th>
                        <SortableHeader
                          align="right"
                          label="Monto"
                          onClick={() => toggleSort('amount')}
                          sort={sort}
                          sortKey="amount"
                        />
                        <th className="py-3 font-medium">Tags</th>
                        <th className="py-3 font-medium">Estado</th>
                        <th className="py-3 text-right font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((transaction) => (
                        <TransactionRow
                          accountName={
                            accountById.get(transaction.accountId)?.name ?? 'Cuenta archivada'
                          }
                          categoryName={
                            transaction.type === 'transfer'
                              ? 'Transferencia'
                              : (categoryById.get(transaction.categoryId)?.name ?? 'Sin categoria')
                          }
                          key={transaction.id}
                          onDelete={handleDelete}
                          onDetail={setSelectedDetailId}
                          onToggleSelected={toggleSelected}
                          selected={currentSelectedIds.includes(transaction.id)}
                          transaction={transaction}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={currentPage}
                  onPageChange={setPage}
                  pageCount={pageCount}
                />
              </>
            ) : (
              <p className="rounded-lg border border-dashed border-[#cfdacf] bg-[#fbfcfb] p-6 text-center text-sm text-[#66756e]">
                No se encontro informacion con los filtros seleccionados.
              </p>
            )}
          </div>

          {detailTransaction ? (
            <TransactionDetail
              accountName={accountById.get(detailTransaction.accountId)?.name ?? 'Cuenta archivada'}
              categoryName={
                detailTransaction.type === 'transfer'
                  ? 'Transferencia'
                  : (categoryById.get(detailTransaction.categoryId)?.name ?? 'Sin categoria')
              }
              onClose={() => {
                setSelectedDetailId('')
                navigate('/transactions', { replace: true })
              }}
              transaction={detailTransaction}
            />
          ) : null}
        </section>
      )}

      <Alert variant="info">
        Al guardar, editar o eliminar un movimiento se recalcula el saldo de la cuenta y el
        dashboard lee el estado actualizado automaticamente.
      </Alert>
    </div>
  )
}

const inputClasses =
  'min-h-11 w-full rounded-lg border border-[#cfdacf] bg-white px-3 text-sm text-[#17201c] outline-none transition focus:border-[#1f7a4f] focus:ring-2 focus:ring-[#b8d8c6]'

function Filters({ accounts, categories, filters, onReset, onUpdate }) {
  return (
    <section className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Buscar por palabra clave">
          <input
            className={inputClasses}
            onChange={(event) => onUpdate('search', event.target.value)}
            placeholder="Descripcion, tags, estado..."
            value={filters.search}
          />
        </Field>
        <Field label="Fecha inicio">
          <input
            className={inputClasses}
            onChange={(event) => onUpdate('startDate', event.target.value)}
            type="date"
            value={filters.startDate}
          />
        </Field>
        <Field label="Fecha fin">
          <input
            className={inputClasses}
            onChange={(event) => onUpdate('endDate', event.target.value)}
            type="date"
            value={filters.endDate}
          />
        </Field>
        <Field label="Cuenta">
          <select
            className={inputClasses}
            onChange={(event) => onUpdate('accountId', event.target.value)}
            value={filters.accountId}
          >
            <option value="">Todas</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Categoria">
          <select
            className={inputClasses}
            onChange={(event) => onUpdate('categoryId', event.target.value)}
            value={filters.categoryId}
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tipo">
          <select
            className={inputClasses}
            onChange={(event) => onUpdate('type', event.target.value)}
            value={filters.type}
          >
            <option value="">Todos</option>
            <option value="expense">Gasto</option>
            <option value="income">Ingreso</option>
            <option value="transfer">Transferencia</option>
          </select>
        </Field>
        <Field label="Metodo de pago">
          <select
            className={inputClasses}
            onChange={(event) => onUpdate('paymentMethod', event.target.value)}
            value={filters.paymentMethod}
          >
            <option value="">Todos</option>
            {paymentMethods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tag">
          <input
            className={inputClasses}
            onChange={(event) => onUpdate('tag', event.target.value)}
            placeholder="ej. mercado"
            value={filters.tag}
          />
        </Field>
        <Field label="Monto minimo">
          <input
            className={inputClasses}
            min="0"
            onChange={(event) => onUpdate('minAmount', event.target.value)}
            type="number"
            value={filters.minAmount}
          />
        </Field>
        <Field label="Monto maximo">
          <input
            className={inputClasses}
            min="0"
            onChange={(event) => onUpdate('maxAmount', event.target.value)}
            type="number"
            value={filters.maxAmount}
          />
        </Field>
        <div className="flex items-end">
          <Button fullWidth onClick={onReset} variant="secondary">
            <RefreshCcw aria-hidden="true" size={17} />
            Limpiar filtros
          </Button>
        </div>
      </div>
    </section>
  )
}

function TransactionRow({
  accountName,
  categoryName,
  onDelete,
  onDetail,
  onToggleSelected,
  selected,
  transaction,
}) {
  const isTransfer = transaction.type === 'transfer'
  const amountIsPositive = transaction.type === 'income' || transaction.amount > 0

  return (
    <tr className="border-b border-[#edf2ee] last:border-0">
      <td className="py-4 pr-3">
        <input
          aria-label={`Seleccionar ${transaction.description || transaction.id}`}
          checked={selected}
          className="size-4 rounded border-[#cfdacf] text-[#1f7a4f] focus:ring-[#3f7f58]"
          onChange={() => onToggleSelected(transaction.id)}
          type="checkbox"
        />
      </td>
      <td className="py-4 text-[#66756e]">{transaction.date}</td>
      <td className="py-4 text-[#66756e]">{typeLabel(transaction.type)}</td>
      <td className="py-4 text-[#66756e]">{categoryName}</td>
      <td className="py-4 text-[#66756e]">{accountName}</td>
      <td className="py-4">
        <p className="font-semibold text-[#25322d]">
          {transaction.description || 'Sin descripcion'}
        </p>
      </td>
      <td className="py-4 text-[#66756e]">
        {financeService.labelFor(paymentMethods, transaction.paymentMethod)}
      </td>
      <td
        className={`py-4 text-right font-semibold ${amountIsPositive ? 'text-[#1f7a4f]' : 'text-[#a24e30]'}`}
      >
        {financeService.formatMoney(transaction.amount, transaction.currency)}
      </td>
      <td className="py-4 text-[#66756e]">
        {transaction.tags.length ? transaction.tags.join(', ') : '-'}
      </td>
      <td className="py-4 text-[#66756e]">{transaction.status}</td>
      <td className="py-4">
        <div className="flex justify-end gap-2">
          <Button onClick={() => onDetail(transaction.id)} variant="secondary">
            <Eye aria-hidden="true" size={15} />
            Detalle
          </Button>
          {!isTransfer ? (
            <>
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#cfdacf] bg-white px-4 text-sm font-semibold text-[#25322d] shadow-sm transition hover:border-[#8fb49d] hover:bg-[#f8fbf8]"
                to={`/transactions/${transaction.id}/edit`}
              >
                <Edit3 aria-hidden="true" size={15} />
                Editar
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#cfdacf] bg-white px-4 text-sm font-semibold text-[#25322d] shadow-sm transition hover:border-[#8fb49d] hover:bg-[#f8fbf8]"
                to={`/transactions/${transaction.id}/duplicate`}
              >
                <Copy aria-hidden="true" size={15} />
                Duplicar
              </Link>
            </>
          ) : null}
          <Button onClick={() => onDelete(transaction)} variant="ghost">
            <Trash2 aria-hidden="true" size={15} />
            Eliminar
          </Button>
        </div>
      </td>
    </tr>
  )
}

function TransactionDetail({ accountName, categoryName, onClose, transaction }) {
  return (
    <aside className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm xl:sticky xl:top-28 xl:self-start">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#1f7a4f]">Detalle</p>
          <h3 className="mt-1 text-xl font-semibold text-[#17201c]">
            {transaction.description || typeLabel(transaction.type)}
          </h3>
        </div>
        <Button onClick={onClose} variant="ghost">
          Cerrar
        </Button>
      </div>
      <dl className="mt-5 space-y-3 text-sm">
        <Detail label="Fecha" value={transaction.date} />
        <Detail label="Tipo" value={typeLabel(transaction.type)} />
        <Detail label="Categoria" value={categoryName} />
        <Detail label="Cuenta" value={accountName} />
        <Detail
          label="Metodo"
          value={financeService.labelFor(paymentMethods, transaction.paymentMethod)}
        />
        <Detail label="Estado" value={transaction.status} />
        <Detail
          label="Monto"
          value={financeService.formatMoney(transaction.amount, transaction.currency)}
        />
        <Detail
          label="Tags"
          value={transaction.tags.length ? transaction.tags.join(', ') : 'Sin tags'}
        />
      </dl>
      <section className="mt-5 rounded-lg border border-[#edf2ee] p-4">
        <h4 className="text-sm font-semibold text-[#25322d]">Comprobante adjunto</h4>
        {transaction.attachment ? (
          <div className="mt-3 text-sm text-[#66756e]">
            <p className="font-semibold text-[#25322d]">{transaction.attachment.name}</p>
            <p>{transaction.attachment.type}</p>
            <p>{Math.round(transaction.attachment.size / 1024)} KB</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#66756e]">Sin comprobante adjunto.</p>
        )}
      </section>
    </aside>
  )
}

function SortableHeader({ align = 'left', label, onClick, sort, sortKey }) {
  const active = sort.key === sortKey

  return (
    <th className={`py-3 font-medium ${align === 'right' ? 'text-right' : ''}`}>
      <button
        className={`font-medium ${active ? 'text-[#1f7a4f]' : 'text-[#66756e]'}`}
        onClick={onClick}
        type="button"
      >
        {label} {active ? (sort.direction === 'asc' ? '↑' : '↓') : ''}
      </button>
    </th>
  )
}

function Pagination({ currentPage, onPageChange, pageCount }) {
  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[#66756e]">
        Pagina {currentPage} de {pageCount}
      </p>
      <div className="flex gap-2">
        <Button
          disabled={currentPage === 1}
          onClick={() => onPageChange((page) => Math.max(1, page - 1))}
          variant="secondary"
        >
          Anterior
        </Button>
        <Button
          disabled={currentPage === pageCount}
          onClick={() => onPageChange((page) => Math.min(pageCount, page + 1))}
          variant="secondary"
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}

function SkeletonTable() {
  return (
    <div aria-label="Cargando movimientos" className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="h-12 animate-pulse rounded-lg bg-[#eef2f0]" key={index} />
      ))}
    </div>
  )
}

function Field({ children, label }) {
  return (
    <label className="block text-sm font-medium text-[#25322d]">
      {label}
      <span className="mt-2 block">{children}</span>
    </label>
  )
}

function Detail({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#edf2ee] pb-3 last:border-0 last:pb-0">
      <dt className="text-[#66756e]">{label}</dt>
      <dd className="text-right font-semibold text-[#25322d]">{value}</dd>
    </div>
  )
}

function typeLabel(type) {
  if (type === 'expense') {
    return 'Gasto'
  }

  if (type === 'income') {
    return 'Ingreso'
  }

  return 'Transferencia'
}
