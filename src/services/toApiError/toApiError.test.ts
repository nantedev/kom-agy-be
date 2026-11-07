import { describe, expect, it } from 'vitest'
import { toApiError } from '@/services/toApiError/toApiError.js'

describe("3. Unicité de l'email", () => {
  describe('RM9 : Email déjà utilisé, EMAIL_ALREADY_EXISTS sans 500', () => {
    it('convertit le code Better Auth USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL en EMAIL_ALREADY_EXISTS en conservant le statut 422', () => {
      // Vérifié dans better-auth 1.7.2 : le code émis au doublon est USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL (statut 422).
      const betterAuthDuplicateError = {
        status: 422,
        code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
        message: 'User already exists. Use another email.',
      }

      const mappedDuplicateError = toApiError(betterAuthDuplicateError)

      expect(mappedDuplicateError).toEqual({
        status: 422,
        body: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'Un compte avec cet email existe déjà',
        },
      })
    })

    it('convertit le code Better Auth USER_ALREADY_EXISTS en EMAIL_ALREADY_EXISTS avec un statut 4xx', () => {
      const betterAuthDuplicateError = {
        status: 422,
        code: 'USER_ALREADY_EXISTS',
        message: 'User already exists',
      }

      const mappedDuplicateError = toApiError(betterAuthDuplicateError)

      expect(mappedDuplicateError.status).toBeGreaterThanOrEqual(400)
      expect(mappedDuplicateError.status).toBeLessThan(500)
      expect(mappedDuplicateError.body).toEqual({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Un compte avec cet email existe déjà',
      })
    })

    it('convertit une violation de contrainte UNIQUE Prisma (P2002) en EMAIL_ALREADY_EXISTS avec un statut 4xx (jamais 500)', () => {
      // Forme vérifiée dans @prisma/client/runtime/library.d.ts (PrismaClientKnownRequestError).
      const prismaUniqueError = Object.assign(
        new Error('Unique constraint failed on the fields: (`email`)'),
        {
          name: 'PrismaClientKnownRequestError',
          code: 'P2002',
          clientVersion: '6.19.3',
          meta: { target: ['email'] },
        }
      )

      const mappedUniqueError = toApiError(prismaUniqueError)

      expect(mappedUniqueError.status).toBeGreaterThanOrEqual(400)
      expect(mappedUniqueError.status).toBeLessThan(500)
      expect(mappedUniqueError.body).toEqual({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Un compte avec cet email existe déjà',
      })
    })

    it('convertit en INTERNAL_ERROR (500) une violation UNIQUE Prisma (P2002) qui ne porte pas sur email', () => {
      const prismaSessionTokenUniqueError = Object.assign(
        new Error('Unique constraint failed on the fields: (`token`)'),
        {
          name: 'PrismaClientKnownRequestError',
          code: 'P2002',
          clientVersion: '6.19.3',
          meta: { target: ['token'] },
        }
      )

      const mappedTokenUniqueError = toApiError(prismaSessionTokenUniqueError)

      expect(mappedTokenUniqueError).toEqual({
        status: 500,
        body: {
          code: 'INTERNAL_ERROR',
          message: 'Une erreur interne est survenue',
        },
      })
    })
  })
})

describe('4. Gestion des erreurs et pannes', () => {
  describe('RM13 : Identifiants incorrects, INVALID_CREDENTIALS', () => {
    it('convertit une erreur Better Auth INVALID_EMAIL_OR_PASSWORD en INVALID_CREDENTIALS avec un message en français', () => {
      const betterAuthInvalidCredentialsError = {
        status: 401,
        code: 'INVALID_EMAIL_OR_PASSWORD',
        message: 'Invalid email or password',
      }

      const mappedCredentialsError = toApiError(betterAuthInvalidCredentialsError)

      expect(mappedCredentialsError.status).toBe(401)
      expect(mappedCredentialsError.body.code).toBe('INVALID_CREDENTIALS')
      expect(mappedCredentialsError.body.message.length).toBeGreaterThan(0)
      expect(mappedCredentialsError.body.message).not.toBe('Invalid email or password')
    })
  })

  describe('RM18, RM19 : Panne convertie en INTERNAL_ERROR distincte des erreurs métier', () => {
    it('convertit une exception technique ou un timeout en INTERNAL_ERROR (500) sans exposer le message brut', () => {
      const databaseTimeoutError = new Error('connect ETIMEDOUT 10.0.0.1:5432')

      const mappedInternalError = toApiError(databaseTimeoutError)

      expect(mappedInternalError.status).toBe(500)
      expect(mappedInternalError.body.code).toBe('INTERNAL_ERROR')
      expect(mappedInternalError.body.message.length).toBeGreaterThan(0)
      expect(mappedInternalError.body.message).not.toContain('ETIMEDOUT')
    })

    it('convertit un code externe non reconnu en INTERNAL_ERROR (500)', () => {
      const unknownExternalError = {
        status: 503,
        code: 'SOME_UNKNOWN_PROVIDER_CODE',
        message: 'Raw upstream failure details',
      }

      const mappedUnknownError = toApiError(unknownExternalError)

      expect(mappedUnknownError.status).toBe(500)
      expect(mappedUnknownError.body.code).toBe('INTERNAL_ERROR')
      expect(mappedUnknownError.body.message.length).toBeGreaterThan(0)
      expect(mappedUnknownError.body.message).not.toContain('Raw upstream failure details')
    })

    it('traduit en français une erreur VALIDATION_ERROR brute émise par Better Auth sans exposer le message en anglais', () => {
      const betterAuthValidationError = {
        status: 400,
        body: {
          code: 'VALIDATION_ERROR',
          message: '[body.password] Invalid input: expected string, received undefined',
        },
      }

      const mappedValidationError = toApiError(betterAuthValidationError)

      expect(mappedValidationError).toEqual({
        status: 400,
        body: {
          code: 'VALIDATION_ERROR',
          message: 'Les données envoyées sont invalides',
        },
      })
    })

    it('préserve le code, le message et le statut 4xx d’une ApiError métier déjà formée', () => {
      const existingValidationError = {
        status: 400,
        code: 'VALIDATION_ERROR' as const,
        message: 'Le format de l’email est invalide',
      }

      const preservedBusinessError = toApiError(existingValidationError)

      expect(preservedBusinessError).toEqual({
        status: 400,
        body: {
          code: 'VALIDATION_ERROR',
          message: 'Le format de l’email est invalide',
        },
      })
    })
  })
})
