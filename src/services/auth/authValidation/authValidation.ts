import * as z from 'zod'
import type { ValidationResult } from '@/types/validation.js'

export type { ValidationResult }

export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 128

export type SignUpInput = {
  name: string
  email: string
  password: string
}

export type SignInInput = {
  email: string
  password: string
  rememberMe?: boolean
  callbackURL?: string
}

const normalizedEmailSchema = z
  .string({ error: "Le format de l'email est invalide" })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Le format de l'email est invalide" }))

const signUpSchema = z.object({
  name: z
    .string({ error: 'Le prénom est requis' })
    .trim()
    .min(1, 'Le prénom est requis'),
  email: normalizedEmailSchema,
  password: z
    .string({
      error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`,
    })
    .min(
      MIN_PASSWORD_LENGTH,
      `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`
    )
    .max(
      MAX_PASSWORD_LENGTH,
      `Le mot de passe ne doit pas dépasser ${MAX_PASSWORD_LENGTH} caractères`
    ),
})

const signInSchema = z.object({
  email: normalizedEmailSchema,
  password: z
    .string({ error: 'Le mot de passe est requis' })
    .min(1, 'Le mot de passe est requis')
    .max(
      MAX_PASSWORD_LENGTH,
      `Le mot de passe ne doit pas dépasser ${MAX_PASSWORD_LENGTH} caractères`
    ),
  rememberMe: z.boolean().optional(),
  callbackURL: z.string().optional(),
})

export const validateSignUp = (input: unknown): ValidationResult<SignUpInput> => {
  const parsed = signUpSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: parsed.error.issues[0]?.message ?? 'Les données envoyées sont invalides',
      },
    }
  }

  return {
    success: true,
    data: parsed.data,
  }
}

export const validateSignIn = (input: unknown): ValidationResult<SignInInput> => {
  const parsed = signInSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: parsed.error.issues[0]?.message ?? 'Les données envoyées sont invalides',
      },
    }
  }

  return {
    success: true,
    data: parsed.data,
  }
}
