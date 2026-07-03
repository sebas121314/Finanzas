import { FileText, Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { aiService } from '../../ai/aiService.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { financeService, paymentMethods, recurringFrequencies } from '../financeService.js'
import { useFinance } from '../useFinance.js'
import { Alert } from '../../../shared/ui/Alert.jsx'
import { Button } from '../../../shared/ui/Button.jsx'
import { useToast } from '../../../shared/ui/Toast.jsx'

const today = () => new Date().toISOString().slice(0, 10)

const defaults = {
  accountId: '',
  amount: '',
  attachment: null,
  categoryId: '',
  date: today(),
  description: '',
  frequency: 'monthly',
  isRecurring: false,
  paymentMethod: 'cash',
  recurringEndDate: '',
  tags: '',
  type: 'expense',
}

export function TransactionFormPage({ mode = 'create' }) {
  const { transactionId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { actions, activeAccounts, categories, transactions } = useFinance(user.id)
  const { notify } = useToast()
  const [error, setError] = useState('')

  const currentTransaction = useMemo(
    () => transactions.find((transaction) => transaction.id === transactionId),
    [transactionId, transactions]
  )
  const initialForm = useMemo(
    () =>
      currentTransaction && currentTransaction.type !== 'transfer'
        ? mapTransactionToForm(currentTransaction, mode)
        : defaults,
    [currentTransaction, mode]
  )
  const [form, setForm] = useState(initialForm)
  const filteredCategories = categories.filter((category) => category.type === form.type)
  const categorySuggestion = useMemo(
    () =>
      !form.categoryId && aiService.isEnabled()
        ? aiService.suggestCategory({
            categories,
            description: form.description,
            transactions,
            type: form.type,
          })
        : null,
    [categories, form.categoryId, form.description, form.type, transactions]
  )
  const isEditing = mode === 'edit'

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleTypeChange = (type) => {
    setForm((current) => ({ ...current, categoryId: '', type }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      updateForm('attachment', null)
      return
    }

    try {
      const attachment = validateAttachment(file)
      updateForm('attachment', attachment)
    } catch (fileError) {
      setError(fileError.message)
      event.target.value = ''
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    try {
      if (isEditing) {
        actions.updateTransaction(transactionId, form)
        notify('Movimiento actualizado.')
      } else {
        actions.createTransaction(form)
        notify(
          form.isRecurring ? 'Movimiento y recurrencia registrados.' : 'Movimiento registrado.'
        )
      }

      navigate('/transactions')
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  if ((mode === 'edit' || mode === 'duplicate') && !currentTransaction) {
    return (
      <Alert variant="danger" title="Movimiento no encontrado">
        No fue posible cargar la información del movimiento.
      </Alert>
    )
  }

  if (currentTransaction?.type === 'transfer') {
    return (
      <Alert variant="warning" title="Transferencia vinculada">
        Las transferencias se gestionan desde el módulo de cuentas.
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-[#1f7a4f]">Movimientos</p>
        <h2 className="mt-1 text-3xl font-semibold text-[#17201c]">
          {isEditing ? 'Editar Transacción' : 'Nuevo movimiento'}
        </h2>
        <p className="mt-2 text-sm text-[#66756e]">
          Registra gastos o ingresos, adjunta comprobantes y marca recurrencias cuando aplique.
        </p>
      </header>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      {!activeAccounts.length || !filteredCategories.length ? (
        <Alert variant="warning" title="Información pendiente">
          Necesitas al menos una cuenta activa y una categoría del tipo seleccionado para guardar
          movimientos. Puedes crearlas en{' '}
          <Link className="font-semibold" to="/accounts">
            cuentas
          </Link>{' '}
          y{' '}
          <Link className="font-semibold" to="/categories">
            categorías
          </Link>
          .
        </Alert>
      ) : null}

      <form
        className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-5">
          <fieldset>
            <legend className="text-sm font-medium text-[#25322d]">Tipo</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-[#edf2ee] p-1">
              {[
                { label: 'Gasto', value: 'expense' },
                { label: 'Ingreso', value: 'income' },
              ].map((option) => (
                <button
                  aria-pressed={form.type === option.value}
                  className={`min-h-10 rounded-lg text-sm font-semibold ${
                    form.type === option.value
                      ? 'bg-white text-[#17201c] shadow-sm'
                      : 'text-[#66756e]'
                  }`}
                  key={option.value}
                  onClick={() => handleTypeChange(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Monto">
              <input
                className={inputClasses}
                min="0"
                onChange={(event) => updateForm('amount', event.target.value)}
                type="number"
                value={form.amount}
              />
            </Field>
            <Field label="Fecha">
              <input
                className={inputClasses}
                onChange={(event) => updateForm('date', event.target.value)}
                type="date"
                value={form.date}
              />
            </Field>
            <Field label="Categoría">
              <select
                className={inputClasses}
                onChange={(event) => updateForm('categoryId', event.target.value)}
                value={form.categoryId}
              >
                <option value="">Selecciona categoría</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cuenta">
              <select
                className={inputClasses}
                onChange={(event) => updateForm('accountId', event.target.value)}
                value={form.accountId}
              >
                <option value="">Selecciona cuenta</option>
                {activeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Método de Pago">
              <select
                className={inputClasses}
                onChange={(event) => updateForm('paymentMethod', event.target.value)}
                value={form.paymentMethod}
              >
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tags">
              <input
                className={inputClasses}
                onChange={(event) => updateForm('tags', event.target.value)}
                placeholder="hogar, fijo, mensual"
                value={form.tags}
              />
            </Field>
          </div>

          <Field label="Descripción opcional">
            <textarea
              className={`${inputClasses} min-h-24 py-3`}
              onChange={(event) => updateForm('description', event.target.value)}
              placeholder="Detalle del movimiento"
              value={form.description}
            />
          </Field>

          {categorySuggestion ? (
            <div className="rounded-lg border border-[#dfe7df] bg-[#f8fbf8] p-4 text-sm">
              <p className="font-semibold text-[#25322d]">
                Categoria sugerida: {categorySuggestion.category.name} (
                {categorySuggestion.confidence}%)
              </p>
              <p className="mt-1 text-[#66756e]">{categorySuggestion.reason}</p>
              <div className="mt-3">
                <Button
                  onClick={() => updateForm('categoryId', categorySuggestion.category.id)}
                  type="button"
                  variant="secondary"
                >
                  Aceptar sugerencia
                </Button>
              </div>
            </div>
          ) : null}

          <Field label="Comprobante/recibo">
            <input
              accept="image/png,image/jpeg,image/webp,application/pdf"
              className={inputClasses}
              onChange={handleFileChange}
              type="file"
            />
            {form.attachment ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-[#66756e]">
                <FileText aria-hidden="true" size={16} />
                {form.attachment.name}
              </p>
            ) : null}
          </Field>

          {!isEditing ? (
            <label className="flex items-center gap-3 rounded-lg border border-[#dfe7df] p-4 text-sm font-semibold text-[#25322d]">
              <input
                checked={form.isRecurring}
                className="size-4 rounded border-[#cfdacf] text-[#1f7a4f] focus:ring-[#3f7f58]"
                onChange={(event) => updateForm('isRecurring', event.target.checked)}
                type="checkbox"
              />
              ¿Es recurrente?
            </label>
          ) : null}

          {form.isRecurring ? (
            <div className="grid gap-4 rounded-lg border border-[#dfe7df] bg-[#f8fbf8] p-4 md:grid-cols-2">
              <Field label="Frecuencia">
                <select
                  className={inputClasses}
                  onChange={(event) => updateForm('frequency', event.target.value)}
                  value={form.frequency}
                >
                  {recurringFrequencies.map((frequency) => (
                    <option key={frequency.value} value={frequency.value}>
                      {frequency.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fecha de fin opcional">
                <input
                  className={inputClasses}
                  onChange={(event) => updateForm('recurringEndDate', event.target.value)}
                  type="date"
                  value={form.recurringEndDate}
                />
              </Field>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button type="submit">
            <Save aria-hidden="true" size={18} />
            {isEditing ? 'Guardar Cambios' : 'Guardar'}
          </Button>
          <Button onClick={() => navigate('/transactions')} type="button" variant="secondary">
            Cancelar
          </Button>
        </div>
      </form>
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

function validateAttachment(file) {
  const { ALLOWED_ATTACHMENT_TYPES, MAX_ATTACHMENT_SIZE } = financeService.constants

  if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
    throw new Error('Adjunta una imagen o PDF válido.')
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new Error('El comprobante no puede superar 5 MB.')
  }

  return {
    name: file.name,
    size: file.size,
    type: file.type,
  }
}

function mapTransactionToForm(transaction, mode) {
  return {
    accountId: transaction.accountId,
    amount: transaction.amount,
    attachment: transaction.attachment,
    categoryId: transaction.categoryId,
    date: mode === 'duplicate' ? today() : transaction.date,
    description: transaction.description,
    frequency: 'monthly',
    isRecurring: false,
    paymentMethod: transaction.paymentMethod,
    recurringEndDate: '',
    tags: transaction.tags.join(', '),
    type: transaction.type,
  }
}
