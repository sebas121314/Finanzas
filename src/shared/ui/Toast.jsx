import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const notify = useCallback((message, variant = 'info') => {
    const id = window.crypto?.randomUUID?.() ?? `${Date.now()}`
    setToasts((currentToasts) => [...currentToasts, { id, message, variant }])
    window.setTimeout(() => {
      setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id))
    }, 4500)
  }, [])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3"
      >
        {toasts.map((toast) => (
          <div
            className="rounded-lg border border-[#dfe7df] bg-white p-4 text-sm font-medium text-[#25322d] shadow-lg"
            key={toast.id}
            role="status"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const value = useContext(ToastContext)

  if (!value) {
    throw new Error('useToast debe usarse dentro de ToastProvider')
  }

  return value
}
