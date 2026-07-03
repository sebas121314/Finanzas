import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout.jsx'
import { PinInput } from '../components/PinInput.jsx'
import { authService } from '../authService.js'
import { verifyAccountSchema } from '../authSchemas.js'
import { useAuth } from '../AuthContext.jsx'
import { Alert } from '../../../shared/ui/Alert.jsx'
import { Button } from '../../../shared/ui/Button.jsx'
import { useToast } from '../../../shared/ui/Toast.jsx'

export function VerifyAccountPage() {
  const { token } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { notify } = useToast()
  const { refreshSession } = useAuth()
  const [submitError, setSubmitError] = useState('')
  const verification = useMemo(
    () => (token ? authService.getVerification(token) : { status: 'missing' }),
    [token]
  )
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm({
    defaultValues: {
      pin: '',
    },
    resolver: zodResolver(verifyAccountSchema),
  })

  const verificationEmail = verification.email ?? location.state?.email
  const verificationPin = verification.pin ?? location.state?.pin
  const canResend = token && verification.status !== 'invalid' && verification.status !== 'missing'

  const emailCorrectionPath = useMemo(() => {
    const query = verificationEmail ? `?email=${encodeURIComponent(verificationEmail)}` : ''
    return `/register${query}`
  }, [verificationEmail])

  const handleResend = async () => {
    if (!token) {
      return
    }

    try {
      const nextVerification = await authService.resendVerification(token)
      notify(`Nuevo código enviado. PIN local: ${nextVerification.pin}`)
      navigate(`/verify-account/${nextVerification.token}`, { replace: true })
    } catch {
      setSubmitError('No fue posible reenviar el código.')
    }
  }

  const onSubmit = async (values) => {
    setSubmitError('')

    try {
      await authService.verifyAccount({ pin: values.pin, token })
      refreshSession()
      navigate('/onboarding', { replace: true })
    } catch (error) {
      const messageByCode = {
        EXPIRED_TOKEN: 'El token expiró. Genera una nueva verificación.',
        INVALID_PIN: 'El código ingresado no es válido.',
        INVALID_TOKEN: 'No fue posible validar la cuenta.',
      }

      setSubmitError(messageByCode[error.code] ?? 'No fue posible validar la cuenta.')
    }
  }

  return (
    <AuthLayout
      eyebrow="Verificación"
      subtitle="Confirma el código enviado al correo para activar tu cuenta."
      title="Verificar cuenta"
    >
      <div className="space-y-5">
        {verification.status === 'valid' ? (
          <Alert variant="info" title="Código enviado">
            Revisa {verificationEmail}. En el entorno local usa el PIN {verificationPin}.
          </Alert>
        ) : null}

        {verification.status === 'expired' ? (
          <Alert variant="warning" title="Verificación expirada">
            El token expiró. Puedes generar una nueva verificación para continuar.
          </Alert>
        ) : null}

        {verification.status === 'invalid' || verification.status === 'missing' ? (
          <Alert variant="danger" title="No fue posible validar la cuenta">
            El enlace no existe o no corresponde a una verificación vigente.
          </Alert>
        ) : null}

        {submitError ? <Alert variant="danger">{submitError}</Alert> : null}

        {verification.status === 'valid' ? (
          <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
            <PinInput error={errors.pin} register={register} />

            <Button disabled={isSubmitting} fullWidth type="submit">
              <MailCheck aria-hidden="true" size={18} />
              {isSubmitting ? 'Confirmando...' : 'Confirmar correo'}
            </Button>
          </form>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Button disabled={!canResend} onClick={handleResend} type="button" variant="secondary">
            <RefreshCw aria-hidden="true" size={18} />
            Reenviar código
          </Button>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#cfdacf] bg-white px-4 text-sm font-semibold text-[#25322d] shadow-sm transition hover:border-[#8fb49d] hover:bg-[#f8fbf8] focus:outline-none focus:ring-2 focus:ring-[#3f7f58] focus:ring-offset-2"
            to={emailCorrectionPath}
          >
            Corregir email
          </Link>
        </div>

        <Link className="block text-center text-sm font-semibold text-[#1f7a4f]" to="/login">
          Ir al Login
        </Link>
      </div>
    </AuthLayout>
  )
}
