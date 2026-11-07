import type { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '@/types/apiContract.js'

const { getSessionMock } = vi.hoisted(() => ({ getSessionMock: vi.fn() }))

vi.mock('@/repositories/authRepository.js', () => ({
  authRepository: {},
}))

vi.mock('@/services/auth/authService.js', () => ({
  getSession: getSessionMock,
}))

import { requireSession } from '@/middlewares/requireSession/requireSession.js'

const createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    locals: {},
  }
  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>
    json: ReturnType<typeof vi.fn>
    locals: Record<string, unknown>
  }
}

beforeEach(() => {
  getSessionMock.mockReset()
})

describe('4. Gestion des erreurs et pannes', () => {
  describe('RM2 : Route protégée sans session, 401', () => {
    it('répond 401 et n’appelle pas next() quand getSession renvoie null', async () => {
      getSessionMock.mockResolvedValue(null)
      const reqWithoutSession = { headers: {} } as Request
      const resForUnauthenticated = createMockResponse()
      const nextHandler: NextFunction = vi.fn()

      await requireSession(reqWithoutSession, resForUnauthenticated, nextHandler)

      expect(resForUnauthenticated.status).toHaveBeenCalledWith(401)
      expect(resForUnauthenticated.json).toHaveBeenCalledOnce()
      expect(nextHandler).not.toHaveBeenCalled()
    })

    it('appelle next() sans répondre 401 quand getSession renvoie une session active', async () => {
      const activeSession: Session = {
        user: {
          id: 'user-1',
          name: 'Marc',
          email: 'marc@x.com',
        },
      }
      getSessionMock.mockResolvedValue(activeSession)
      const reqWithSession = {
        headers: { cookie: 'better-auth.session_token=valid-token' },
      } as Request
      const resForAuthenticated = createMockResponse()
      const nextHandler: NextFunction = vi.fn()

      await requireSession(reqWithSession, resForAuthenticated, nextHandler)

      expect(nextHandler).toHaveBeenCalledOnce()
      expect(resForAuthenticated.status).not.toHaveBeenCalled()
      expect(resForAuthenticated.locals.session).toEqual(activeSession)
    })
  })
})
