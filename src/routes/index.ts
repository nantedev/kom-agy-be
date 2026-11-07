import { Router } from 'express'
import { authRoutes } from '@/routes/authRoutes.js'
import { dbHealthRoutes } from '@/routes/dbHealthRoutes.js'
import { healthRoutes } from '@/routes/healthRoutes.js'
import { rootRoutes } from '@/routes/rootRoutes.js'

export const routes = Router()

routes.use('/', rootRoutes)
routes.use('/health', healthRoutes)
routes.use('/db-health', dbHealthRoutes)
routes.use('/api/auth', authRoutes)
