import { Router } from 'express'
import {
  asesorRegister, asesorLogin, asesorRefresh,
  getAsesorProfile, getAsesorSesiones,
  getEstudianteStats, saveObservacion,
} from '../controllers/asesorController'
import { requireAsesorAuth } from '../middleware/asesorAuth'

const router = Router()

// Public
router.post('/register', asesorRegister)
router.post('/login',    asesorLogin)
router.post('/refresh',  asesorRefresh)

// Protected — asesor only
router.get('/me',                                    requireAsesorAuth, getAsesorProfile)
router.get('/sesiones',                              requireAsesorAuth, getAsesorSesiones)
router.get('/estudiante/:userId/stats',              requireAsesorAuth, getEstudianteStats)
router.post('/sesiones/:sesionId/observacion',       requireAsesorAuth, saveObservacion)

export default router
