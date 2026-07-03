export function EmptyState({ action, description, title }) {
  return (
    <section className="rounded-lg border border-dashed border-[#cfdacf] bg-white p-8 text-center">
      <h2 className="text-xl font-semibold text-[#17201c]">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#66756e]">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  )
}
