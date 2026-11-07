import type { NextFunction, Request, Response } from 'express'
import { toApiError } from '@/services/toApiError/toApiError.js'

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (res.headersSent) {
    next(err)
    return
  }

  const { status, body } = toApiError(err)

  if (status >= 500) {
    console.error(err instanceof Error ? err.message : 'Internal Server Error')
  }

  res.status(status).json(body)
}
