import * as z from 'zod'
import type { ApiError } from '@/types/apiContract.js'

export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 128

export type SignUpInput = {
  name: string
  email: string
  password: string
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError }

const signUpSchema = z.object({
  name: z
    .string({ error: 'Le prénom est requis' })
    .trim()
    .min(1, 'Le prénom est requis'),
  email: z
    .string({ error: "Le format de l'email est invalide" })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Le format de l'email est invalide" })),
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
