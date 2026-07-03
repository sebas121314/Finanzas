export function FormField({
  autoComplete,
  children,
  error,
  id,
  label,
  placeholder,
  register,
  type = 'text',
}) {
  return (
    <div>
      <label className="text-sm font-medium text-[#25322d]" htmlFor={id}>
        {label}
      </label>
      <input
        autoComplete={autoComplete}
        className="mt-2 min-h-12 w-full rounded-lg border border-[#cfdacf] bg-white px-4 text-sm text-[#17201c] shadow-sm outline-none transition placeholder:text-[#8a9a93] focus:border-[#1f7a4f] focus:ring-2 focus:ring-[#b8d8c6]"
        id={id}
        placeholder={placeholder}
        type={type}
        {...register}
      />
      {children}
      {error ? <p className="mt-2 text-sm text-[#a24e30]">{error.message}</p> : null}
    </div>
  )
}
