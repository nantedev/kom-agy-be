import { Router } from 'express'
import { getDbHealth } from '@/controllers/dbHealthController.js'

export const dbHealthRoutes = Router()

dbHealthRoutes.get('/', getDbHealth)
