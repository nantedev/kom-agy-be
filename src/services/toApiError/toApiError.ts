import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from '@/services/auth/authValidation/authValidation.js'
import type { ApiError } from '@/types/apiContract.js'

export type HttpApiError = {
  status: number
  body: ApiError
}

const BUSINESS_ERROR_CODES = new Set<ApiError['code']>([
  'EMAIL_ALREADY_EXISTS',
  'INVALID_CREDENTIALS',
  'STANDUP_NOT_FOUND',
  'LLM_QUOTA_EXCEEDED',
  'LLM_UNAVAILABLE',
  'SUMMARY_MALFORMED',
  'VALIDATION_ERROR',
])

const INTERNAL_API_ERROR: HttpApiError = {
  status: 500,
  body: {
    code: 'INTERNAL_ERROR',
    message: 'Une erreur interne est survenue',
  },
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const resolve4xxStatus = (status: number | undefined, fallback: number): number =>
  status !== undefined && status >= 400 && status < 500 ? status : fallback

export const isEmailUniqueConstraintError = (error: unknown): boolean => {
  if (!isRecord(error) || error.code !== 'P2002') {
    return false
  }

  const meta = isRecord(error.meta) ? error.meta : undefined
  const target = meta?.target

  if (Array.isArray(target)) {
    return target.includes('email')
  }

  if (typeof target === 'string') {
    return target.includes('email')
  }

  return false
}

const isRawExternalValidationMessage = (message: string): boolean =>
  message === 'Validation Error' ||
  /^\[(body|query|params|headers)\b/i.test(message) ||
  /^Invalid (input|type|string|email|password|value|url|enum)/i.test(message) ||
  /^Required$/i.test(message)

export const toApiError = (error: unknown, defaultStatus?: number): HttpApiError => {
  if (error instanceof SyntaxError && isRecord(error) && error.status === 400) {
    return {
      status: 400,
      body: {
        code: 'VALIDATION_ERROR',
        message: 'Corps JSON invalide',
      },
    }
  }

  if (!isRecord(error)) {
    return INTERNAL_API_ERROR
  }

  const nestedBody = isRecord(error.body) ? error.body : undefined
  const isExternalError =
    nestedBody !== undefined || error.name === 'APIError' || Array.isArray(error.issues)
  const rawStatus =
    typeof error.status === 'number'
      ? error.status
      : typeof error.statusCode === 'number'
        ? error.statusCode
        : defaultStatus
  const code =
    typeof error.code === 'string'
      ? error.code
      : typeof nestedBody?.code === 'string'
        ? nestedBody.code
        : undefined
  const message =
    typeof error.message === 'string'
      ? error.message
      : typeof nestedBody?.message === 'string'
        ? nestedBody.message
        : undefined

  // Vérifié dans better-auth 1.7 : au doublon d'email, le code émis est USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL (422).
  // isEmailUniqueConstraintError limite P2002 à la contrainte UNIQUE sur email (RM9 : jamais 500).
  if (
    code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' ||
    code === 'USER_ALREADY_EXISTS' ||
    isEmailUniqueConstraintError(error)
  ) {
    return {
      status: resolve4xxStatus(rawStatus, 409),
      body: {
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Un compte avec cet email existe déjà',
      },
    }
  }

  if (code === 'INVALID_EMAIL_OR_PASSWORD') {
    return {
      status: resolve4xxStatus(rawStatus, 401),
      body: {
        code: 'INVALID_CREDENTIALS',
        message: 'Email ou mot de passe incorrect',
      },
    }
  }

  if (code === 'INVALID_EMAIL') {
    return {
      status: resolve4xxStatus(rawStatus, 400),
      body: {
        code: 'VALIDATION_ERROR',
        message: "Le format de l'email est invalide",
      },
    }
  }

  if (
    code === 'INVALID_PASSWORD' ||
    code === 'PASSWORD_TOO_SHORT' ||
    code === 'PASSWORD_TOO_LONG'
  ) {
    return {
      status: resolve4xxStatus(rawStatus, 400),
      body: {
        code: 'VALIDATION_ERROR',
        message: `Le mot de passe doit contenir entre ${MIN_PASSWORD_LENGTH} et ${MAX_PASSWORD_LENGTH} caractères`,
      },
    }
  }

  if (
    code === 'MISSING_FIELD' ||
    code === 'BODY_MUST_BE_AN_OBJECT' ||
    code === 'BAD_REQUEST'
  ) {
    return {
      status: resolve4xxStatus(rawStatus, 400),
      body: {
        code: 'VALIDATION_ERROR',
        message: 'Les données envoyées sont invalides',
      },
    }
  }

  // better-call émet aussi le code VALIDATION_ERROR, mais avec un message brut en anglais.
  if (
    code === 'VALIDATION_ERROR' &&
    (isExternalError || (message !== undefined && isRawExternalValidationMessage(message)))
  ) {
    return {
      status: resolve4xxStatus(rawStatus, 400),
      body: {
        code: 'VALIDATION_ERROR',
        message: 'Les données envoyées sont invalides',
      },
    }
  }

  if (
    !isExternalError &&
    code !== undefined &&
    BUSINESS_ERROR_CODES.has(code as ApiError['code']) &&
    message
  ) {
    return {
      status: resolve4xxStatus(rawStatus, 400),
      body: {
        code: code as ApiError['code'],
        message,
      },
    }
  }

  return INTERNAL_API_ERROR
}
