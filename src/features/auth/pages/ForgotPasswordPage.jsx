import { zodResolver } from '@hookform/resolvers/zod'
import { Send } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout.jsx'
import { authService } from '../authService.js'
import { forgotPasswordSchema } from '../authSchemas.js'
import { Alert } from '../../../shared/ui/Alert.jsx'
import { Button } from '../../../shared/ui/Button.jsx'
import { FormField } from '../../../shared/ui/FormField.jsx'

function isLocalhost() {
  return ['localhost', '127.0.0.1'].includes(window.location.hostname)
}

export function ForgotPasswordPage() {
  const [resetToken, setResetToken] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm({
    defaultValues: {
      email: '',
    },
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (values) => {
    const result = await authService.requestPasswordReset(values.email)
    setResetToken(result.token ?? '')
    setSuccessMessage('Si la cuenta existe, recibirás un enlace de recuperación. Revisa tu correo.')
  }

  return (
    <AuthLayout
      eyebrow="Recuperación"
      subtitle="Enviaremos un enlace de recuperación sin revelar públicamente si el correo está registrado."
      title="Recuperar contraseña"
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
        {successMessage ? <Alert variant="success">{successMessage}</Alert> : null}

        <FormField
          autoComplete="email"
          error={errors.email}
          id="email"
          label="Email"
          placeholder="tu@email.com"
          register={register('email')}
          type="email"
        />

        <Button disabled={isSubmitting} fullWidth type="submit">
          <Send aria-hidden="true" size={18} />
          {isSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
        </Button>

        {resetToken && isLocalhost() ? (
          <Link
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#cfdacf] bg-white px-4 text-sm font-semibold text-[#25322d] shadow-sm transition hover:border-[#8fb49d] hover:bg-[#f8fbf8] focus:outline-none focus:ring-2 focus:ring-[#3f7f58] focus:ring-offset-2"
            to={`/reset-password/${resetToken}`}
          >
            Abrir recuperación local
          </Link>
        ) : null}

        <Link className="block text-center text-sm font-semibold text-[#1f7a4f]" to="/login">
          Ir al Login
        </Link>
      </form>
    </AuthLayout>
  )
}
