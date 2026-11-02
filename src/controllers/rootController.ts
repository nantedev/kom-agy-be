import type { Request, Response } from 'express'
import { getApiInfo } from '@/services/rootService.js'

export const getRoot = (_req: Request, res: Response): void => {
  const apiInfo = getApiInfo()
  res.status(200).json(apiInfo)
}
