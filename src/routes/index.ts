import { Router } from 'express'
import { rootRoutes } from '@/routes/rootRoutes.js'
import { healthRoutes } from '@/routes/healthRoutes.js'

export const routes = Router()

routes.use('/', rootRoutes)
routes.use('/health', healthRoutes)
