import { z } from 'zod'

export const passwordSpecialCharacterRegex = /[@_\-!#()]/

const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener mínimo 8 caracteres.')
  .regex(
    passwordSpecialCharacterRegex,
    'La contraseña debe incluir al menos un caracter especial: @, _, -, !, #, ( o ).'
  )

export const loginSchema = z.object({
  email: z.string().min(1, 'Ingresa tu email.').email('Ingresa un email válido.'),
  password: z.string().min(1, 'Ingresa tu contraseña.'),
  rememberMe: z.boolean().default(false),
})

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, 'Ingresa nombres y apellidos.'),
    email: z.string().trim().min(1, 'Ingresa tu email.').email('Ingresa un email válido.'),
    birthDate: z
      .string()
      .min(1, 'Ingresa tu fecha de nacimiento.')
      .refine((value) => new Date(value) <= new Date(), 'La fecha no puede estar en el futuro.'),
    phone: z.string().trim().min(7, 'Ingresa un celular válido.'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirma tu contraseña.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Las contraseñas deben coincidir.',
    path: ['confirmPassword'],
  })

export const verifyAccountSchema = z.object({
  pin: z
    .string()
    .min(6, 'Ingresa el código de 6 dígitos.')
    .max(6, 'Ingresa solo 6 dígitos.')
    .regex(/^\d+$/, 'El código solo debe contener números.'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, 'Ingresa tu email.').email('Ingresa un email válido.'),
})

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirma tu contraseña.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Las contraseñas deben coincidir.',
    path: ['confirmPassword'],
  })
