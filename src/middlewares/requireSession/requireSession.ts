import type { NextFunction, Request, Response } from 'express'
import { authRepository } from '@/repositories/authRepository.js'
import { getSession } from '@/services/auth/authService.js'
import type { ApiError } from '@/types/apiContract.js'

const UNAUTHORIZED_ERROR: ApiError = {
  code: 'INVALID_CREDENTIALS',
  message: 'Authentification requise',
}

export const requireSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const session = await getSession(req.headers, authRepository)

    if (!session) {
      res.status(401).json(UNAUTHORIZED_ERROR)
      return
    }

    res.locals.session = session
    next()
  } catch (error) {
    next(error)
  }
}
