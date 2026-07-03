const variants = {
  danger: 'border-[#efc8bd] bg-[#fff5f2] text-[#7c2e1b]',
  info: 'border-[#c8dce7] bg-[#f2f8fb] text-[#244b61]',
  success: 'border-[#c9e5d5] bg-[#f3fbf6] text-[#185c3a]',
  warning: 'border-[#eadca8] bg-[#fff9e7] text-[#654d10]',
}

export function Alert({ children, title, variant = 'info' }) {
  return (
    <div className={`rounded-lg border p-4 text-sm ${variants[variant]}`} role="alert">
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? 'mt-1 leading-6' : 'leading-6'}>{children}</div>
    </div>
  )
}
