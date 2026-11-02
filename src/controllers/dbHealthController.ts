import type { Request, Response } from 'express'
import { checkDbHealth } from '@/services/dbHealthService.js'
import { dbHealthRepository } from '@/repositories/dbHealthRepository.js'

export const getDbHealth = async (_req: Request, res: Response): Promise<void> => {
  const result = await checkDbHealth(dbHealthRepository)

  if (result.status === 'ok') {
    res.status(200).json(result)
    return
  }

  res.status(503).json(result)
}
