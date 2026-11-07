import { Router } from 'express'
import { handleAuth } from '@/controllers/authController.js'
import { validateBody } from '@/middlewares/validateBody.js'
import {
  validateSignIn,
  validateSignUp,
} from '@/services/auth/authValidation/authValidation.js'

export const authRoutes = Router()

authRoutes.post('/sign-up/email', validateBody(validateSignUp), handleAuth)
authRoutes.post('/sign-in/email', validateBody(validateSignIn), handleAuth)
authRoutes.post('/sign-out', handleAuth)
authRoutes.get('/get-session', handleAuth)
