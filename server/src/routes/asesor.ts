import { Router } from 'express'
import {
  asesorRegister, asesorLogin, asesorRefresh,
  asesorVerifyCode, asesorResendVerification,
  asesorForgotPassword, asesorResetPassword,
  getAsesorProfile, updateAsesorProfile, getAsesorSesiones,
  getEstudianteStats, getEstudianteHistoria, saveObservacion,
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
router.patch('/me',                                  requireAsesorAuth, updateAsesorProfile)
router.patch('/disponibilidad',                      requireAsesorAuth, updateDisponibilidad)
router.get('/sesiones',                              requireAsesorAuth, getAsesorSesiones)
router.get('/estudiante/:userId/stats',              requireAsesorAuth, getEstudianteStats)
router.get('/estudiante/:userId/historia',          requireAsesorAuth, getEstudianteHistoria)
router.post('/sesiones/:sesionId/observacion',       requireAsesorAuth, saveObservacion)
router.patch('/sesiones/:sesionId/status',           requireAsesorAuth, updateSesionStatus)

export default router
