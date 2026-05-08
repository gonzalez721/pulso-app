import { Router } from 'express'
import {
  register, login, refresh, logout,
  verifyEmail, resendVerification,
  forgotPassword, resetPassword,
} from '../controllers/authController'

const router = Router()

router.post('/register',            register)
router.post('/login',               login)
router.post('/refresh',             refresh)
router.post('/logout',              logout)
router.get('/verify-email',         verifyEmail)
router.post('/resend-verification', resendVerification)
router.post('/forgot-password',     forgotPassword)
router.post('/reset-password',      resetPassword)

export default router
