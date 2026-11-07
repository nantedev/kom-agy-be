import type { ApiError } from '@/types/apiContract.js'

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError }
