import { Router } from 'express'
import {
  asesorRegister, asesorLogin, asesorRefresh,
  asesorVerifyEmail, asesorResendVerification,
  asesorForgotPassword, asesorResetPassword,
  getAsesorProfile, getAsesorSesiones,
  getEstudianteStats, saveObservacion,
  updateDisponibilidad,
} from '../controllers/asesorController'
import { requireAsesorAuth } from '../middleware/asesorAuth'

const router = Router()

// Public — auth
router.post('/register',             asesorRegister)
router.post('/login',                asesorLogin)
router.post('/refresh',              asesorRefresh)
router.get('/verify-email',          asesorVerifyEmail)
router.post('/resend-verification',  asesorResendVerification)
router.post('/forgot-password',      asesorForgotPassword)
router.post('/reset-password',       asesorResetPassword)

// Protected — asesor only
router.get('/me',                                    requireAsesorAuth, getAsesorProfile)
router.patch('/disponibilidad',                      requireAsesorAuth, updateDisponibilidad)
router.get('/sesiones',                              requireAsesorAuth, getAsesorSesiones)
router.get('/estudiante/:userId/stats',              requireAsesorAuth, getEstudianteStats)
router.post('/sesiones/:sesionId/observacion',       requireAsesorAuth, saveObservacion)

export default router
