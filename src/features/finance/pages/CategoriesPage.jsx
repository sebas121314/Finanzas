import { Edit3, Plus, Save, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext.jsx'
import { categoryTypes, colorOptions, iconOptions } from '../financeService.js'
import { useFinance } from '../useFinance.js'
import { Alert } from '../../../shared/ui/Alert.jsx'
import { Button } from '../../../shared/ui/Button.jsx'
import { EmptyState } from '../../../shared/ui/EmptyState.jsx'
import { useToast } from '../../../shared/ui/Toast.jsx'

const categoryDefaults = {
  color: '#1f7a4f',
  icon: 'tag',
  id: '',
  name: '',
  parentId: '',
  type: 'expense',
}

export function CategoriesPage() {
  const { user } = useAuth()
  const { actions, categories, transactions } = useFinance(user.id)
  const { notify } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(categoryDefaults)
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [reassignCategoryId, setReassignCategoryId] = useState('')

  const expenseCategories = categories.filter((category) => category.type === 'expense')
  const incomeCategories = categories.filter((category) => category.type === 'income')
  const parentOptions = useMemo(
    () => categories.filter((category) => category.type === form.type && category.id !== form.id),
    [categories, form.id, form.type]
  )
  const reassignOptions = categories.filter(
    (category) => category.type === pendingDelete?.type && category.id !== pendingDelete?.id
  )

  const resetForm = () => {
    setForm(categoryDefaults)
    setFormOpen(false)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    try {
      actions.saveCategory(form)
      notify(form.id ? 'Categoría actualizada.' : 'Categoría creada.')
      resetForm()
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  const handleEdit = (category) => {
    setError('')
    setForm(category)
    setFormOpen(true)
  }

  const requestDelete = (category) => {
    const hasTransactions = transactions.some(
      (transaction) => transaction.categoryId === category.id
    )

    if (hasTransactions) {
      setPendingDelete(category)
      setReassignCategoryId('__uncategorized__')
      return
    }

    if (!window.confirm('¿Eliminar esta categoría?')) {
      return
    }

    actions.deleteCategory(category.id, null)
    notify('Categoría eliminada.')
  }

  const confirmDelete = () => {
    if (!pendingDelete) {
      return
    }

    try {
      actions.deleteCategory(
        pendingDelete.id,
        reassignCategoryId === '__uncategorized__' ? null : reassignCategoryId
      )
      notify('Categoría eliminada y movimientos reasignados.')
      setPendingDelete(null)
      setReassignCategoryId('')
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1f7a4f]">Clasificación</p>
          <h2 className="mt-1 text-3xl font-semibold text-[#17201c]">Categorías</h2>
          <p className="mt-2 text-sm text-[#66756e]">
            Separa tus movimientos entre gasto e ingreso y crea subcategorías.
          </p>
        </div>
        <Button
          onClick={() => {
            setError('')
            setForm(categoryDefaults)
            setFormOpen(true)
          }}
        >
          <Plus aria-hidden="true" size={18} />
          Nueva Categoría
        </Button>
      </header>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      {formOpen ? (
        <form
          className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm"
          onSubmit={handleSubmit}
        >
          <h3 className="text-lg font-semibold text-[#17201c]">
            {form.id ? 'Editar Categoría' : 'Nueva Categoría'}
          </h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Nombre Categoría">
              <input
                className={inputClasses}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Alimentación"
                value={form.name}
              />
            </Field>
            <Field label="Tipo">
              <select
                className={inputClasses}
                onChange={(event) => setForm({ ...form, parentId: '', type: event.target.value })}
                value={form.type}
              >
                {categoryTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Categoría padre opcional">
              <select
                className={inputClasses}
                onChange={(event) => setForm({ ...form, parentId: event.target.value })}
                value={form.parentId}
              >
                <option value="">Sin categoría padre</option>
                {parentOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Ícono">
              <select
                className={inputClasses}
                onChange={(event) => setForm({ ...form, icon: event.target.value })}
                value={form.icon}
              >
                {iconOptions.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <fieldset className="mt-5">
            <legend className="text-sm font-medium text-[#25322d]">Color</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  aria-label={`Color ${color}`}
                  aria-pressed={form.color === color}
                  className={`size-10 rounded-lg border ${
                    form.color === color ? 'border-[#17201c]' : 'border-[#cfdacf]'
                  }`}
                  key={color}
                  onClick={() => setForm({ ...form, color })}
                  style={{ backgroundColor: color }}
                  type="button"
                />
              ))}
            </div>
          </fieldset>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button type="submit">
              <Save aria-hidden="true" size={18} />
              {form.id ? 'Guardar Cambios' : 'Guardar Categoría'}
            </Button>
            <Button onClick={resetForm} type="button" variant="secondary">
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {pendingDelete ? (
        <section className="rounded-lg border border-[#eadca8] bg-[#fff9e7] p-5">
          <h3 className="text-lg font-semibold text-[#654d10]">Reasignar movimientos</h3>
          <p className="mt-2 text-sm leading-6 text-[#654d10]">
            La categoría {pendingDelete.name} tiene movimientos asociados. Reasígnalos a otra
            categoría o a "Sin categoría" antes de eliminar.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <select
              className={inputClasses}
              onChange={(event) => setReassignCategoryId(event.target.value)}
              value={reassignCategoryId}
            >
              <option value="__uncategorized__">Sin categoría</option>
              {reassignOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <Button onClick={confirmDelete} type="button" variant="danger">
              Confirmar eliminación
            </Button>
            <Button onClick={() => setPendingDelete(null)} type="button" variant="secondary">
              Cancelar
            </Button>
          </div>
        </section>
      ) : null}

      {!categories.length ? (
        <EmptyState
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus aria-hidden="true" size={18} />
              Crear primera categoría
            </Button>
          }
          description="Las categorías estarán disponibles inmediatamente en el formulario de movimientos."
          title="No hay categorías registradas"
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <CategoryColumn
            items={expenseCategories}
            onDelete={requestDelete}
            onEdit={handleEdit}
            title="Gastos"
          />
          <CategoryColumn
            items={incomeCategories}
            onDelete={requestDelete}
            onEdit={handleEdit}
            title="Ingresos"
          />
        </div>
      )}
    </div>
  )
}

const inputClasses =
  'min-h-12 w-full rounded-lg border border-[#cfdacf] bg-white px-4 text-sm text-[#17201c] outline-none transition focus:border-[#1f7a4f] focus:ring-2 focus:ring-[#b8d8c6]'

function Field({ children, label }) {
  return (
    <label className="block text-sm font-medium text-[#25322d]">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  )
}

function CategoryColumn({ items, onDelete, onEdit, title }) {
  return (
    <section className="rounded-lg border border-[#dde7de] bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-[#17201c]">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((category) => (
            <article
              className="flex flex-col gap-3 rounded-lg border border-[#edf2ee] p-4 sm:flex-row sm:items-center sm:justify-between"
              key={category.id}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex size-10 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: category.color }}
                >
                  {category.icon.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="font-semibold text-[#25322d]">{category.name}</p>
                  <p className="text-xs text-[#66756e]">
                    {category.parentId ? 'Subcategoría' : 'Categoría principal'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => onEdit(category)} variant="secondary">
                  <Edit3 aria-hidden="true" size={16} />
                  Editar
                </Button>
                <Button onClick={() => onDelete(category)} variant="ghost">
                  <Trash2 aria-hidden="true" size={16} />
                  Eliminar
                </Button>
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-[#cfdacf] p-4 text-sm text-[#66756e]">
            Sin categorías de este tipo.
          </p>
        )}
      </div>
    </section>
  )
}
