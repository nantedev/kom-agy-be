import type { NextFunction, Request, Response } from 'express'
import { config } from '@/config/index.js'
import { authRepository } from '@/repositories/authRepository.js'
import { forwardAuthRequest } from '@/services/auth/authService.js'

export const handleAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const url = new URL(req.originalUrl, config.betterAuthUrl).toString()
    const payload = res.locals.body ?? req.body

    const authResult = await forwardAuthRequest(
      {
        url,
        method: req.method,
        headers: req.headers,
        body: payload,
      },
      authRepository
    )

    if (authResult.setCookies.length > 0) {
      res.setHeader('set-cookie', authResult.setCookies)
    }

    res.status(authResult.status).type(authResult.contentType).send(authResult.body)
  } catch (error) {
    next(error)
  }
}
