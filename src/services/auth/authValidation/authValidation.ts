import type { ApiError } from '@/types/apiContract.js'

export type SignUpInput = {
  name: string
  email: string
  password: string
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError }

export const validateSignUp = (_input: unknown): ValidationResult<SignUpInput> => {
  return {
    success: true,
    data: {
      name: '',
      email: '',
      password: '',
    },
  }
}
