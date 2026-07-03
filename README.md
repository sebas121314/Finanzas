# Finance App

Skeleton UI responsive creado para el proyecto de finanzas de Sebastia Macias.

## Stack

- Vite como build tool y dev server.
- React 18 con `createRoot`.
- Tailwind CSS v4 integrado mediante `@tailwindcss/vite`.
- ESLint con flat config.
- Prettier para formato.
- Jest, jsdom y React Testing Library para pruebas de componentes.

## Comandos

```bash
npm install
npm run dev
npm run lint
npm run format:check
npm test
npm run build
```

## HU-01 Autenticación y Onboarding

Rutas implementadas:

- `/login`
- `/register`
- `/verify-account`
- `/verify-account/:token`
- `/forgot-password`
- `/reset-password/:token`
- `/onboarding`
- `/dashboard`

El flujo usa un servicio mock con `localStorage` para simular requests mientras se construye el backend.

Cuenta local de prueba:

- Email: `demo@finance.app`
- Contraseña: `Demo@123`

PIN local de verificación: `123456`.

## HU-02 Gestión Financiera Core

Rutas implementadas:

- `/accounts`
- `/categories`
- `/transactions`
- `/transactions/new`
- `/transactions/:transactionId/edit`
- `/transactions/:transactionId/duplicate`
- `/recurring`

El flujo usa `financeService` con `localStorage` para simular persistencia por usuario:

- Cuentas activas y archivadas.
- Transferencias entre cuentas con dos movimientos vinculados.
- Categorías de gasto/ingreso con subcategoría opcional.
- Reasignación a otra categoría o a "Sin categoría" antes de eliminar categorías con movimientos.
- Movimientos de gasto/ingreso con tags, método de pago, comprobante y recurrencia opcional.
- Edición, duplicado y eliminación de movimientos con actualización/reversión de saldos.
- Gestión de recurrencias con pausar, reanudar y eliminar futuras generaciones.

## HU-03 Planeación Financiera

Rutas implementadas:

- `/budgets`
- `/savings-goals`

El flujo usa el mismo `financeService` local:

- Presupuestos generales o por categoría de gasto.
- Límite, período, rollover y umbral de alerta configurable.
- Seguimiento automático del uso con transacciones de tipo gasto.
- Alertas in-app y notificaciones locales al alcanzar umbral o exceder límite.
- Historial de períodos anteriores desde "Ver historial".
- Metas de ahorro con objetivo, fecha, descripción y cuenta vinculada opcional.
- Aportes manuales con historial por meta.
- Aporte automático recurrente vinculado a la meta.
- Estado automático de meta: activa, cumplida o cancelada.

## Investigación usada

- Vite: `npm create vite@latest`, templates React y scripts `dev`, `build`, `preview`.
- React 18: uso de `createRoot` desde `react-dom/client`.
- Tailwind CSS v4: plugin `@tailwindcss/vite` e importación `@import 'tailwindcss';`.
- ESLint: configuración local con Node compatible y flat config.
- Prettier: instalación local, `.prettierrc` y `.prettierignore`.
- Jest y React Testing Library: Jest con Babel/jsdom y tests orientados al DOM.
