import { ShieldCheck } from 'lucide-react'

export function AuthLayout({ children, eyebrow, title, subtitle }) {
  return (
    <main className="min-h-screen bg-[#f4f7f5] px-4 py-6 text-[#202522] sm:px-6">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="hidden h-full min-h-[680px] flex-col justify-between rounded-lg bg-[#17201c] p-8 text-white lg:flex">
          <div>
            <div className="flex size-12 items-center justify-center rounded-lg bg-[#2f8f63]">
              <ShieldCheck aria-hidden="true" size={24} />
            </div>
            <h1 className="mt-8 text-4xl font-semibold">Finance App</h1>
            <p className="mt-4 max-w-sm text-base leading-7 text-[#c6d7cf]">
              Controla tus movimientos, presupuestos y metas desde una cuenta protegida.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg border border-white/10 p-4">
              <dt className="text-[#a9beb5]">Sesiones</dt>
              <dd className="mt-1 text-2xl font-semibold">JWT</dd>
            </div>
            <div className="rounded-lg border border-white/10 p-4">
              <dt className="text-[#a9beb5]">Validación</dt>
              <dd className="mt-1 text-2xl font-semibold">Zod</dd>
            </div>
          </dl>
        </aside>

        <div className="mx-auto w-full max-w-xl">
          <div className="mb-6 lg:hidden">
            <p className="text-sm font-medium text-[#587067]">Finance App</p>
          </div>
          <section className="rounded-lg border border-[#dfe7df] bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <p className="text-sm font-semibold text-[#1f7a4f]">{eyebrow}</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#17201c] sm:text-3xl">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#66756e]">{subtitle}</p>
            </div>
            {children}
          </section>
        </div>
      </section>
    </main>
  )
}
