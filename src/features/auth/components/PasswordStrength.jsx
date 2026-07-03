import { getPasswordStrength } from '../passwordStrength.js'

const toneClasses = {
  danger: 'bg-[#b84a35]',
  neutral: 'bg-[#dfe7df]',
  success: 'bg-[#1f7a4f]',
  warning: 'bg-[#d6a93a]',
}

export function PasswordStrength({ password }) {
  const strength = getPasswordStrength(password)

  return (
    <div aria-live="polite" className="mt-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-[#66756e]">Fortaleza</span>
        <span className="font-semibold text-[#25322d]">{strength.label}</span>
      </div>
      <div className="mt-2 h-2 rounded-lg bg-[#e6ece7]">
        <div
          className={`h-2 rounded-lg transition-all ${toneClasses[strength.tone]}`}
          style={{ width: `${strength.percent}%` }}
        />
      </div>
    </div>
  )
}
