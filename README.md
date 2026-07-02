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

## Investigación usada

- Vite: `npm create vite@latest`, templates React y scripts `dev`, `build`, `preview`.
- React 18: uso de `createRoot` desde `react-dom/client`.
- Tailwind CSS v4: plugin `@tailwindcss/vite` e importación `@import 'tailwindcss';`.
- ESLint: configuración local con Node compatible y flat config.
- Prettier: instalación local, `.prettierrc` y `.prettierignore`.
- Jest y React Testing Library: Jest con Babel/jsdom y tests orientados al DOM.
