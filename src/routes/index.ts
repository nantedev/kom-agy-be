import { Router } from 'express'
import { rootRoutes } from '@/routes/rootRoutes.js'
import { healthRoutes } from '@/routes/healthRoutes.js'
import { dbHealthRoutes } from '@/routes/dbHealthRoutes.js'

export const routes = Router()

routes.use('/', rootRoutes)
routes.use('/health', healthRoutes)
routes.use('/db-health', dbHealthRoutes)
