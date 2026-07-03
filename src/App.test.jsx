import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App.jsx'

function renderRoute(path) {
  window.history.pushState({}, '', path)
  return render(<App />)
}

function setAuthenticatedSession() {
  const user = {
    birthDate: '1998-03-12',
    createdAt: new Date().toISOString(),
    currency: 'COP',
    email: 'demo@finance.app',
    fullName: 'Sebastia Macias',
    id: 'usr_demo',
    onboardingCompleted: true,
    phone: '3001234567',
    verified: true,
  }

  window.localStorage.setItem(
    'finance-app.auth',
    JSON.stringify({
      loginAttempts: {},
      onboarding: {},
      passwordResetRequests: [],
      session: {
        accessToken: 'test-token',
        rememberMe: false,
        user,
      },
      users: [{ ...user, passwordHash: 'test' }],
      verificationRequests: [],
    })
  )
}

function setFinanceState() {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const movementDate = `${currentMonth}-02`

  window.localStorage.setItem(
    'finance-app.finance',
    JSON.stringify({
      users: {
        usr_demo: {
          accounts: [
            {
              active: true,
              color: '#1f7a4f',
              createdAt: new Date().toISOString(),
              currency: 'COP',
              currentBalance: 1800000,
              icon: 'bank',
              id: 'acc_main',
              initialBalance: 500000,
              name: 'Cuenta principal',
              type: 'debit',
              userId: 'usr_demo',
            },
          ],
          budgetHistory: [],
          budgets: [
            {
              alertThreshold: 80,
              categoryId: 'cat_food',
              createdAt: new Date().toISOString(),
              id: 'bdg_food',
              limit: 500000,
              period: 'monthly',
              rollover: false,
              userId: 'usr_demo',
            },
          ],
          categories: [
            {
              color: '#1f7a4f',
              icon: 'tag',
              id: 'cat_food',
              name: 'Alimentacion',
              parentId: '',
              type: 'expense',
              userId: 'usr_demo',
            },
            {
              color: '#2d7c96',
              icon: 'cash',
              id: 'cat_salary',
              name: 'Salario',
              parentId: '',
              type: 'income',
              userId: 'usr_demo',
            },
          ],
          goalContributions: [
            {
              amount: 250000,
              date: movementDate,
              goalId: 'goal_trip',
              id: 'gct_trip',
              note: '',
            },
          ],
          notifications: [
            {
              createdAt: new Date().toISOString(),
              emailQueued: true,
              id: 'ntf_budget',
              message: 'El presupuesto Alimentacion fue excedido.',
              read: false,
              relatedTo: '/budgets',
              type: 'budget-exceeded',
            },
          ],
          recurringTransactions: [],
          savingsGoals: [
            {
              accountId: 'acc_main',
              createdAt: new Date().toISOString(),
              description: 'Viaje personal',
              id: 'goal_trip',
              name: 'Viaje',
              status: 'active',
              targetAmount: 1000000,
              targetDate: `${currentMonth}-28`,
              userId: 'usr_demo',
            },
          ],
          transactions: [
            {
              accountId: 'acc_main',
              amount: 1500000,
              attachment: null,
              categoryId: 'cat_salary',
              createdAt: new Date().toISOString(),
              currency: 'COP',
              date: movementDate,
              description: 'Pago de salario',
              id: 'txn_income',
              paymentMethod: 'transfer',
              recurrentId: '',
              status: 'posted',
              tags: ['nomina'],
              transferGroupId: '',
              type: 'income',
              userId: 'usr_demo',
            },
            {
              accountId: 'acc_main',
              amount: 200000,
              attachment: { name: 'recibo.pdf', size: 12000, type: 'application/pdf' },
              categoryId: 'cat_food',
              createdAt: new Date().toISOString(),
              currency: 'COP',
              date: movementDate,
              description: 'Compra mercado',
              id: 'txn_expense',
              paymentMethod: 'debit',
              recurrentId: '',
              status: 'posted',
              tags: ['mercado'],
              transferGroupId: '',
              type: 'expense',
              userId: 'usr_demo',
            },
          ],
        },
      },
    })
  )
}

describe('HU-01 Autenticacion y Onboarding', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.pushState({}, '', '/')
  })

  it('muestra el formulario de login en /login', async () => {
    renderRoute('/login')

    expect(await screen.findByRole('heading', { name: /iniciar sesi/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contrase/i)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /recordarme/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /crear cuenta/i })).toHaveAttribute('href', '/register')
    expect(screen.getByRole('link', { name: /olvidaste contrase/i })).toHaveAttribute(
      'href',
      '/forgot-password'
    )
  })

  it('bloquea temporalmente despues de cinco intentos fallidos de login', async () => {
    renderRoute('/login')

    fireEvent.change(await screen.findByLabelText(/email/i), {
      target: { value: 'demo@finance.app' },
    })
    fireEvent.change(screen.getByLabelText(/contrase/i), {
      target: { value: 'incorrecta' },
    })

    for (let attempt = 0; attempt < 5; attempt += 1) {
      fireEvent.click(screen.getByRole('button', { name: /ingresar|validando/i }))
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /ingresar/i })).not.toBeDisabled()
      )
    }

    expect(screen.getByRole('alert')).toHaveTextContent(/bloqueado temporalmente/i)
  })

  it('muestra el registro con indicador de fortaleza', async () => {
    renderRoute('/register')

    expect(await screen.findByRole('heading', { name: /crear cuenta/i })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/^contrase/i), {
      target: { value: 'Clave@123' },
    })

    expect(screen.getByText(/fuerte/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /iniciar sesi/i })).toHaveAttribute('href', '/login')
  })

  it('redirige dashboard protegido hacia login cuando no hay sesion', async () => {
    renderRoute('/dashboard')

    expect(await screen.findByRole('heading', { name: /iniciar sesi/i })).toBeInTheDocument()
  })
})

describe('HU-02 Gestion Financiera Core', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setAuthenticatedSession()
  })

  it('permite crear la primera cuenta desde /accounts', async () => {
    renderRoute('/accounts')

    expect(await screen.findByRole('heading', { name: /^cuentas$/i })).toBeInTheDocument()
    expect(screen.getByText(/no hay informaci/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /nueva cuenta/i }))
    fireEvent.change(screen.getByLabelText(/nombre de la cuenta/i), {
      target: { value: 'Cuenta nomina' },
    })
    fireEvent.change(screen.getByLabelText(/saldo inicial/i), {
      target: { value: '1500000' },
    })
    fireEvent.click(screen.getByRole('button', { name: /guardar cuenta/i }))

    expect(await screen.findByText(/cuenta nomina/i)).toBeInTheDocument()
    expect(screen.getByText(/\$ 1\.500\.000/i)).toBeInTheDocument()
  })
})

describe('HU-03 Planeacion Financiera', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setAuthenticatedSession()
  })

  it('permite crear un presupuesto general desde /budgets', async () => {
    renderRoute('/budgets')

    expect(await screen.findByRole('heading', { name: /presupuestos/i })).toBeInTheDocument()
    expect(screen.getByText(/no hay informaci/i)).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: /nuevo presupuesto/i })[0])
    fireEvent.change(screen.getByLabelText(/mite mensual/i), {
      target: { value: '500000' },
    })
    fireEvent.click(screen.getByRole('button', { name: /guardar presupuesto/i }))

    expect(await screen.findByText(/^general$/i)).toBeInTheDocument()
    expect(screen.getAllByText(/\$ 500\.000/i).length).toBeGreaterThan(0)
  })

  it('permite crear una meta de ahorro desde /savings-goals', async () => {
    renderRoute('/savings-goals')

    expect(await screen.findByRole('heading', { name: /metas de ahorro/i })).toBeInTheDocument()
    expect(screen.getByText(/no hay metas registradas/i)).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: /nueva meta/i })[0])
    fireEvent.change(screen.getByLabelText(/nombre de la meta/i), {
      target: { value: 'Viaje fin de ano' },
    })
    fireEvent.change(screen.getByLabelText(/monto objetivo/i), {
      target: { value: '2500000' },
    })
    fireEvent.change(screen.getByLabelText(/fecha objetivo/i), {
      target: { value: '2026-12-20' },
    })
    fireEvent.click(screen.getByRole('button', { name: /crear meta/i }))

    expect(await screen.findByText(/viaje fin de ano/i)).toBeInTheDocument()
    expect(screen.getByText(/\$ 2\.500\.000/i)).toBeInTheDocument()
  })
})

describe('HU-04 Visibilidad y Analisis', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setAuthenticatedSession()
    setFinanceState()
  })

  it('muestra dashboard con resumen, filtros y busqueda global', async () => {
    renderRoute('/dashboard')

    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByText(/balance total/i)).toBeInTheDocument()
    expect(screen.getByText(/ingresos del mes/i)).toBeInTheDocument()
    expect(screen.getByText(/gastos del mes/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/buscador global/i), {
      target: { value: 'mercado' },
    })

    expect((await screen.findAllByText(/compra mercado/i)).length).toBeGreaterThan(0)
  })

  it('muestra historial de movimientos con filtros', async () => {
    renderRoute('/transactions')

    expect(await screen.findByRole('heading', { name: /transacciones/i })).toBeInTheDocument()
    expect(await screen.findByText(/compra mercado/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/buscar por palabra clave/i), {
      target: { value: 'salario' },
    })

    expect(await screen.findByText(/pago de salario/i)).toBeInTheDocument()
    expect(screen.queryByText(/compra mercado/i)).not.toBeInTheDocument()
  })

  it('muestra dashboard de reportes', async () => {
    renderRoute('/reports')

    expect(
      await screen.findByRole('heading', { name: /dashboard de reportes/i })
    ).toBeInTheDocument()
    expect(screen.getAllByText(/gastos mensuales/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /exportar excel/i })).toBeInTheDocument()
  })
})

describe('HU-05 Experiencia Configuracion e Inteligencia', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setAuthenticatedSession()
    setFinanceState()
  })

  it('permite ver perfil y guardar cambios basicos', async () => {
    renderRoute('/profile')

    expect(
      await screen.findByRole('heading', { name: /perfil y configuracion/i })
    ).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/^nombre$/i), {
      target: { value: 'Sebastia Finanzas' },
    })
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }))

    expect(await screen.findByText(/perfil actualizado/i)).toBeInTheDocument()
  })

  it('muestra centro de notificaciones gestionable', async () => {
    renderRoute('/dashboard')

    fireEvent.click(await screen.findByRole('button', { name: /notificaciones/i }))

    expect(await screen.findByText(/centro de notificaciones/i)).toBeInTheDocument()
    expect(screen.getByText(/presupuesto excedido/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /marcar todas/i })).toBeInTheDocument()
  })

  it('sugiere categoria al crear un gasto por descripcion', async () => {
    renderRoute('/transactions/new')

    expect(await screen.findByRole('heading', { name: /nuevo movimiento/i })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/descripci/i), {
      target: { value: 'Compra mercado semanal' },
    })

    expect(await screen.findByText(/categoria sugerida: alimentacion/i)).toBeInTheDocument()
  })

  it('permite invitar usuarios desde el panel admin', async () => {
    renderRoute('/admin')

    expect(await screen.findByRole('heading', { name: /administracion/i })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'lector@finance.app' },
    })
    fireEvent.click(screen.getByRole('button', { name: /invitar usuario/i }))

    expect((await screen.findAllByText(/lector@finance.app/i)).length).toBeGreaterThan(0)
  })
})
