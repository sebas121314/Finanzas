import { zodResolver } from '@hookform/resolvers/zod'
import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout.jsx'
import { PasswordStrength } from '../components/PasswordStrength.jsx'
import { authService } from '../authService.js'
import { registerSchema } from '../authSchemas.js'
import { Alert } from '../../../shared/ui/Alert.jsx'
import { Button } from '../../../shared/ui/Button.jsx'
import { FormField } from '../../../shared/ui/FormField.jsx'
import { useToast } from '../../../shared/ui/Toast.jsx'

export function RegisterPage() {
  const [submitError, setSubmitError] = useState('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { notify } = useToast()
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm({
    defaultValues: {
      birthDate: '',
      confirmPassword: '',
      email: searchParams.get('email') ?? '',
      fullName: '',
      password: '',
      phone: '',
    },
    resolver: zodResolver(registerSchema),
  })
  const password = useWatch({ control, name: 'password' })

  const onSubmit = async (values) => {
    setSubmitError('')

    try {
      const result = await authService.register(values)
      notify(`Correo de verificación enviado a ${result.email}. PIN local: ${result.pin}`)
      navigate(`/verify-account/${result.token}`, {
        state: { email: result.email, pin: result.pin },
      })
    } catch {
      setSubmitError('No fue posible crear la cuenta con esos datos.')
    }
  }

  return (
    <AuthLayout
      eyebrow="Registro"
      subtitle="Crea tu acceso personal y verifica tu correo antes de entrar al onboarding."
      title="Crear cuenta"
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
        {submitError ? <Alert variant="danger">{submitError}</Alert> : null}

        <FormField
          autoComplete="name"
          error={errors.fullName}
          id="fullName"
          label="Nombres y Apellidos"
          placeholder="Sebastia Macias"
          register={register('fullName')}
        />

        <FormField
          autoComplete="email"
          error={errors.email}
          id="email"
          label="Email"
          placeholder="tu@email.com"
          register={register('email')}
          type="email"
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            autoComplete="bday"
            error={errors.birthDate}
            id="birthDate"
            label="Fecha de nacimiento"
            register={register('birthDate')}
            type="date"
          />

          <FormField
            autoComplete="tel"
            error={errors.phone}
            id="phone"
            label="Celular"
            placeholder="3001234567"
            register={register('phone')}
            type="tel"
          />
        </div>

        <FormField
          autoComplete="new-password"
          error={errors.password}
          id="password"
          label="Contraseña"
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
          label="Verificar Contraseña"
          placeholder="Repite tu contraseña"
          register={register('confirmPassword')}
          type="password"
        />

        <Button disabled={isSubmitting} fullWidth type="submit">
          <UserPlus aria-hidden="true" size={18} />
          {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
        </Button>

        <p className="text-center text-sm text-[#66756e]">
          ¿Ya tienes cuenta?{' '}
          <Link className="font-semibold text-[#1f7a4f] hover:text-[#17633f]" to="/login">
            Iniciar sesión
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
