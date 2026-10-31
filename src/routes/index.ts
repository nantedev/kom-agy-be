import { Router } from 'express'
import { rootRoutes } from '@/routes/rootRoutes.js'

export const routes = Router()

routes.use('/', rootRoutes)
