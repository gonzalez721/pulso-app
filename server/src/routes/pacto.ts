import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import {
  setupPacto, getPactoStatus, getInviteInfo, acceptInvite,
  getAlertaStatus, responderAlerta, getHistorialAlertas, updatePushSubscription,
} from '../controllers/pactoController'

const router = Router()

// Protected — authenticated user
router.post('/setup',   requireAuth, setupPacto)
router.get('/status',   requireAuth, getPactoStatus)
router.get('/alertas',  requireAuth, getHistorialAlertas)

// Public — partner flows (no auth)
router.get('/invitacion/:token',        getInviteInfo)
router.post('/invitacion/:token/accept', acceptInvite)
router.post('/push-subscription',        updatePushSubscription)
router.get('/alerta/:id/status',         getAlertaStatus)
router.post('/alerta/:id/responder',     responderAlerta)

export default router
