import { Router } from 'express'
import {
  asesorRegister, asesorLogin, asesorRefresh,
  asesorVerifyCode, asesorResendVerification,
  asesorForgotPassword, asesorResetPassword,
  getAsesorProfile, getAsesorSesiones,
  getEstudianteStats, saveObservacion,
  updateDisponibilidad, updateSesionStatus,
} from '../controllers/asesorController'
import { requireAsesorAuth } from '../middleware/asesorAuth'

const router = Router()

// Public — auth
router.post('/register',             asesorRegister)
router.post('/login',                asesorLogin)
router.post('/refresh',              asesorRefresh)
router.post('/verify-code',          asesorVerifyCode)
router.post('/resend-verification',  asesorResendVerification)
router.post('/forgot-password',      asesorForgotPassword)
router.post('/reset-password',       asesorResetPassword)

// Protected — asesor only
router.get('/me',                                    requireAsesorAuth, getAsesorProfile)
router.patch('/disponibilidad',                      requireAsesorAuth, updateDisponibilidad)
router.get('/sesiones',                              requireAsesorAuth, getAsesorSesiones)
router.get('/estudiante/:userId/stats',              requireAsesorAuth, getEstudianteStats)
router.post('/sesiones/:sesionId/observacion',       requireAsesorAuth, saveObservacion)
router.patch('/sesiones/:sesionId/status',           requireAsesorAuth, updateSesionStatus)

export default router
