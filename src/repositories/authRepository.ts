import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { APIError } from 'better-auth/api'
import { customSession } from 'better-auth/plugins'
import { allowedOrigins } from '@/config/corsConfig.js'
import { config } from '@/config/index.js'
import { prisma } from '@/repositories/prisma.js'
import type { AuthRepository } from '@/services/auth/authService.js'
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from '@/services/auth/authValidation/authValidation.js'
import { isEmailUniqueConstraintError } from '@/services/toApiError/toApiError.js'
import type { Session } from '@/types/apiContract.js'

// Dans better-auth 1.7.18 (sign-up.mjs), createUser intercepte toute exception non-APIError
// et la remplace par 422 FAILED_TO_CREATE_USER avant onAPIError. Convertir P2002(email) en
// APIError ici laisse isAPIError(e) propager le doublon concurrent jusqu'à toApiError (RM9).
const authPrisma = prisma.$extends({
  query: {
    user: {
      async create({ args, query }) {
        try {
          return await query(args)
        } catch (error) {
          if (isEmailUniqueConstraintError(error)) {
            throw new APIError('UNPROCESSABLE_ENTITY', {
              code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
              message: 'User already exists. Use another email.',
            })
          }
          throw error
        }
      },
    },
  },
})

const auth = betterAuth({
  database: prismaAdapter(authPrisma, {
    provider: 'postgresql',
  }),
  baseURL: config.betterAuthUrl,
  secret: config.betterAuthSecret,
  trustedOrigins: allowedOrigins,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    maxPasswordLength: MAX_PASSWORD_LENGTH,
  },
  // Laisse remonter les exceptions non-APIError hors createUser (ex. timeout DB)
  // jusqu'à errorHandler au lieu que le routeur interne de Better Auth renvoie un 500 vide.
  onAPIError: {
    throw: true,
  },
  plugins: [
    // Façonne /get-session au contrat Session sans exposer session.token en clair.
    customSession(async ({ user }) => ({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })),
  ],
})

export class BetterAuthRepository implements AuthRepository {
  async getSession(headers: Headers): Promise<Session> {
    return auth.api.getSession({ headers })
  }

  async handleRequest(request: Request): Promise<Response> {
    return auth.handler(request)
  }
}

export const authRepository = new BetterAuthRepository()
