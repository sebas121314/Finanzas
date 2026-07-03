const variants = {
  primary: 'bg-[#1f7a4f] text-white hover:bg-[#17633f] focus:ring-[#3f7f58]',
  secondary:
    'border border-[#cfdacf] bg-white text-[#25322d] hover:border-[#8fb49d] hover:bg-[#f8fbf8] focus:ring-[#3f7f58]',
  danger: 'bg-[#a24e30] text-white hover:bg-[#843d25] focus:ring-[#b66a4f]',
  ghost: 'text-[#25322d] hover:bg-[#edf4ef] focus:ring-[#3f7f58]',
}

export function Button({
  children,
  className = '',
  disabled = false,
  fullWidth = false,
  type = 'button',
  variant = 'primary',
  ...props
}) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
        variants[variant]
      } ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}
