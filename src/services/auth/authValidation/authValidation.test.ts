import { describe, expect, it } from 'vitest'
import { validateSignUp } from '@/services/auth/authValidation/authValidation.js'

describe('2. Valeurs refusées', () => {
  describe('RM10 : Email mal formé ou mot de passe hors bornes (8 à 128 caractères)', () => {
    it.each(['marc', 'marc@', '@x.com', 'marc @x.com', ''])(
      'refuse un signup avec un email mal formé (%s)',
      (invalidEmail) => {
        const signUpPayload = {
          name: 'Marc',
          email: invalidEmail,
          password: 'password123',
        }

        const validationWithInvalidEmail = validateSignUp(signUpPayload)

        expect(validationWithInvalidEmail).toEqual({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: expect.any(String),
          },
        })
      }
    )

    it('refuse un signup avec un mot de passe de moins de 8 caractères (7 caractères)', () => {
      const signUpPayload = {
        name: 'Marc',
        email: 'marc@x.com',
        password: '1234567',
      }

      const validationWithShortPassword = validateSignUp(signUpPayload)

      expect(validationWithShortPassword).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
        },
      })
    })

    it('refuse un signup avec un mot de passe de plus de 128 caractères (129 caractères)', () => {
      const signUpPayload = {
        name: 'Marc',
        email: 'marc@x.com',
        password: 'a'.repeat(129),
      }

      const validationWithLongPassword = validateSignUp(signUpPayload)

      expect(validationWithLongPassword).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
        },
      })
    })

    it('accepte un mot de passe aux bornes exactes (8 et 128 caractères)', () => {
      const minPasswordPayload = {
        name: 'Marc',
        email: 'marc@x.com',
        password: 'a'.repeat(8),
      }
      const maxPasswordPayload = {
        name: 'Marc',
        email: 'marc@x.com',
        password: 'a'.repeat(128),
      }

      const validationAtMinBound = validateSignUp(minPasswordPayload)
      const validationAtMaxBound = validateSignUp(maxPasswordPayload)

      expect(validationAtMinBound).toEqual({
        success: true,
        data: minPasswordPayload,
      })
      expect(validationAtMaxBound).toEqual({
        success: true,
        data: maxPasswordPayload,
      })
    })
  })

  describe('RM11 : Signup sans prénom', () => {
    it('refuse un signup quand le champ name est absent', () => {
      const payloadWithoutName = {
        email: 'marc@x.com',
        password: 'password123',
      }

      const validationWithoutName = validateSignUp(payloadWithoutName)

      expect(validationWithoutName).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
        },
      })
    })

    it('refuse un signup quand le champ name est une chaîne vide', () => {
      const payloadWithEmptyName = {
        name: '',
        email: 'marc@x.com',
        password: 'password123',
      }

      const validationWithEmptyName = validateSignUp(payloadWithEmptyName)

      expect(validationWithEmptyName).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
        },
      })
    })
  })

  describe("RM20 : Prénom d'espaces seulement, refusé comme RM11", () => {
    it('refuse un prénom composé uniquement d’espaces exactement comme un prénom vide', () => {
      const payloadWithEmptyName = {
        name: '',
        email: 'marc@x.com',
        password: 'password123',
      }
      const payloadWithWhitespaceName = {
        name: '   \t\n  ',
        email: 'marc@x.com',
        password: 'password123',
      }

      const validationWithEmptyName = validateSignUp(payloadWithEmptyName)
      const validationWithWhitespaceName = validateSignUp(payloadWithWhitespaceName)

      expect(validationWithWhitespaceName).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
        },
      })
      expect(validationWithWhitespaceName).toEqual(validationWithEmptyName)
    })

    it('retire les espaces autour d’un prénom valide', () => {
      const payloadWithPaddedName = {
        name: '  Marc  ',
        email: 'marc@x.com',
        password: 'password123',
      }

      const validationWithTrimmedName = validateSignUp(payloadWithPaddedName)

      expect(validationWithTrimmedName).toEqual({
        success: true,
        data: {
          name: 'Marc',
          email: 'marc@x.com',
          password: 'password123',
        },
      })
    })
  })
})

describe("3. Unicité de l'email", () => {
  describe("RM21 : Unicité insensible à la casse et aux espaces (normalisation de l'email)", () => {
    it('normalise " MARC@x.com " en "marc@x.com" (trim + minuscules) avant validation', () => {
      const payloadWithUnnormalizedEmail = {
        name: 'Marc',
        email: ' MARC@x.com ',
        password: 'password123',
      }

      const validationWithNormalizedEmail = validateSignUp(payloadWithUnnormalizedEmail)

      expect(validationWithNormalizedEmail).toEqual({
        success: true,
        data: {
          name: 'Marc',
          email: 'marc@x.com',
          password: 'password123',
        },
      })
    })
  })
})
