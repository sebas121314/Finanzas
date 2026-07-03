import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, KeyRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout.jsx'
import { PasswordStrength } from '../components/PasswordStrength.jsx'
import { authService } from '../authService.js'
import { resetPasswordSchema } from '../authSchemas.js'
import { Alert } from '../../../shared/ui/Alert.jsx'
import { Button } from '../../../shared/ui/Button.jsx'
import { FormField } from '../../../shared/ui/FormField.jsx'

export function ResetPasswordPage() {
  const { token } = useParams()
  const tokenStatus = useMemo(() => authService.getPasswordReset(token), [token])
  const [submitError, setSubmitError] = useState('')
  const [completed, setCompleted] = useState(false)
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm({
    defaultValues: {
      confirmPassword: '',
      password: '',
    },
    resolver: zodResolver(resetPasswordSchema),
  })
  const password = useWatch({ control, name: 'password' })

  const onSubmit = async (values) => {
    setSubmitError('')

    try {
      await authService.resetPassword({ password: values.password, token })
      setCompleted(true)
    } catch (error) {
      const messageByCode = {
        EXPIRED_TOKEN: 'El enlace de recuperación expiró. Genera una nueva recuperación.',
        INVALID_TOKEN: 'El enlace de recuperación no es válido.',
      }

      setSubmitError(messageByCode[error.code] ?? 'No fue posible restablecer la contraseña.')
    }
  }

  return (
    <AuthLayout
      eyebrow="Nueva contraseña"
      subtitle="Actualiza tu contraseña y cerraremos las sesiones activas asociadas a la cuenta."
      title="Restablecer contraseña"
    >
      <div className="space-y-5">
        {completed ? (
          <Alert variant="success" title="Contraseña actualizada">
            La contraseña fue restablecida y las sesiones activas quedaron cerradas.
          </Alert>
        ) : null}

        {tokenStatus.status === 'expired' ? (
          <Alert variant="warning" title="Enlace expirado">
            Genera una nueva recuperación para continuar.
          </Alert>
        ) : null}

        {tokenStatus.status === 'invalid' ? (
          <Alert variant="danger" title="Enlace inválido">
            No fue posible validar este enlace de recuperación.
          </Alert>
        ) : null}

        {submitError ? <Alert variant="danger">{submitError}</Alert> : null}

        {tokenStatus.status === 'valid' && !completed ? (
          <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
            <FormField
              autoComplete="new-password"
              error={errors.password}
              id="password"
              label="Nueva contraseña"
              placeholder="Mínimo 8 caracteres"
              register={register('password')}
              type="password"
            >
              <PasswordStrength password={password} />
            </FormField>

            <FormField
              autoComplete="new-password"
              error={errors.confirmPassword}
              id="confirmPassword"
              label="Confirmar contraseña"
              placeholder="Repite tu contraseña"
              register={register('confirmPassword')}
              type="password"
            />

            <Button disabled={isSubmitting} fullWidth type="submit">
              <KeyRound aria-hidden="true" size={18} />
              {isSubmitting ? 'Restableciendo...' : 'Restablecer contraseña'}
            </Button>
          </form>
        ) : null}

        {tokenStatus.status !== 'valid' ? (
          <Link
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#cfdacf] bg-white px-4 text-sm font-semibold text-[#25322d] shadow-sm transition hover:border-[#8fb49d] hover:bg-[#f8fbf8] focus:outline-none focus:ring-2 focus:ring-[#3f7f58] focus:ring-offset-2"
            to="/forgot-password"
          >
            Generar nueva recuperación
          </Link>
        ) : null}

        <Link
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1f7a4f] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#17633f] focus:outline-none focus:ring-2 focus:ring-[#3f7f58] focus:ring-offset-2"
          to="/login"
        >
          <CheckCircle2 aria-hidden="true" size={18} />
          Ir al Login
        </Link>
      </div>
    </AuthLayout>
  )
}
