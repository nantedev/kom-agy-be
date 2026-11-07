import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { ValidationResult } from '@/services/auth/authValidation/authValidation.js'

export const validateBody =
  <T>(validator: (input: unknown) => ValidationResult<T>): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    const validation = validator(req.body)

    if (!validation.success) {
      res.status(400).json(validation.error)
      return
    }

    res.locals.body = validation.data
    next()
  }
