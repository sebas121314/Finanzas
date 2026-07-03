export function PinInput({ error, register }) {
  return (
    <div>
      <label className="text-sm font-medium text-[#25322d]" htmlFor="pin">
        Código PIN
      </label>
      <input
        autoComplete="one-time-code"
        className="mt-2 min-h-12 w-full rounded-lg border border-[#cfdacf] bg-white px-4 text-center text-xl font-semibold tracking-[0.35em] text-[#17201c] shadow-sm outline-none transition placeholder:tracking-normal focus:border-[#1f7a4f] focus:ring-2 focus:ring-[#b8d8c6]"
        id="pin"
        inputMode="numeric"
        maxLength={6}
        placeholder="000000"
        type="text"
        {...register('pin')}
      />
      {error ? <p className="mt-2 text-sm text-[#a24e30]">{error.message}</p> : null}
    </div>
  )
}
