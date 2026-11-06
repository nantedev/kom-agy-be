import type { NextFunction, Request, Response } from 'express'

export const requireSession = async (
  _req: Request,
  _res: Response,
  _next: NextFunction
): Promise<void> => {}
