import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout.jsx'
import { authService } from '../authService.js'
import { loginSchema } from '../authSchemas.js'
import { useAuth } from '../AuthContext.jsx'
import { Alert } from '../../../shared/ui/Alert.jsx'
import { Button } from '../../../shared/ui/Button.jsx'
import { FormField } from '../../../shared/ui/FormField.jsx'

export function LoginPage() {
  const [submitError, setSubmitError] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values) => {
    setSubmitError('')

    try {
      const session = await login(values)
      const fallbackPath = session.user.onboardingCompleted ? '/dashboard' : '/onboarding'
      const redirectPath = location.state?.from?.pathname ?? fallbackPath

      navigate(redirectPath, { replace: true })
    } catch (error) {
      const blockedMessage =
        error.code === 'LOGIN_LOCKED' || error.details?.locked
          ? `Has superado ${authService.constants.LOGIN_ATTEMPT_LIMIT} intentos. El acceso queda bloqueado temporalmente.`
          : 'Credenciales inválidas. Por seguridad no confirmamos si el email existe.'

      setSubmitError(blockedMessage)
    }
  }

  return (
    <AuthLayout
      eyebrow="Acceso seguro"
      subtitle="Ingresa con tu correo y contraseña para continuar a tu dashboard financiero."
      title="Iniciar sesión"
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
        {submitError ? <Alert variant="danger">{submitError}</Alert> : null}

        <FormField
          autoComplete="email"
          error={errors.email}
          id="email"
          label="Email"
          placeholder="tu@email.com"
          register={register('email')}
          type="email"
        />

        <FormField
          autoComplete="current-password"
          error={errors.password}
          id="password"
          label="Contraseña"
          placeholder="Tu contraseña"
          register={register('password')}
          type="password"
        />

        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-2 font-medium text-[#25322d]">
            <input
              className="size-4 rounded border-[#cfdacf] text-[#1f7a4f] focus:ring-[#3f7f58]"
              type="checkbox"
              {...register('rememberMe')}
            />
            Recordarme
          </label>
          <Link className="font-semibold text-[#1f7a4f] hover:text-[#17633f]" to="/forgot-password">
            ¿Olvidaste contraseña?
          </Link>
        </div>

        <Button disabled={isSubmitting} fullWidth type="submit">
          <LockKeyhole aria-hidden="true" size={18} />
          {isSubmitting ? 'Validando...' : 'Ingresar'}
        </Button>

        <div className="grid gap-3 rounded-lg border border-[#dfe7df] bg-[#f8fbf8] p-4 text-sm text-[#66756e]">
          <p className="font-medium text-[#25322d]">Cuenta local de prueba</p>
          <p className="flex items-center gap-2">
            <Mail aria-hidden="true" size={16} />
            demo@finance.app
          </p>
          <p className="flex items-center gap-2">
            <Eye aria-hidden="true" size={16} />
            Demo@123
          </p>
        </div>

        <p className="text-center text-sm text-[#66756e]">
          ¿No tienes cuenta?{' '}
          <Link className="font-semibold text-[#1f7a4f] hover:text-[#17633f]" to="/register">
            Crear cuenta
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
