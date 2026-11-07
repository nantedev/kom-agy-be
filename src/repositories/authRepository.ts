import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { customSession } from 'better-auth/plugins'
import { allowedOrigins } from '@/config/corsConfig.js'
import { config } from '@/config/index.js'
import { prisma } from '@/repositories/prisma.js'
import type { AuthRepository } from '@/services/auth/authService.js'
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from '@/services/auth/authValidation/authValidation.js'
import type { Session } from '@/types/apiContract.js'

const auth = betterAuth({
  database: prismaAdapter(prisma, {
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
  // Laisse remonter les exceptions non-APIError (ex. P2002 Prisma en concurrence ou timeout DB)
  // jusqu'à toApiError au lieu que le routeur interne de Better Auth les écrase en 500 vide.
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
