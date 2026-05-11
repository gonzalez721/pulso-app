import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import {
  getPartners,
  createPartner,
  updatePartner,
  deletePartner,
  acceptPacto,
  getDashboard,
  getAlertasForUser,
  getAlertaStatus,
  getInviteInfo,
  getPartnerPage,
  getPartnerAlertas,
  responderAlerta,
} from '../controllers/pactoController'

const router = Router()

// ── Authenticated routes ───────────────────────────────────────────────────────
router.get('/partners', requireAuth, getPartners)
router.post('/partner', requireAuth, createPartner)
router.patch('/partner/:partnerId', requireAuth, updatePartner)
router.delete('/partner/:partnerId', requireAuth, deletePartner)
router.post('/accept', requireAuth, acceptPacto)
router.get('/dashboard', requireAuth, getDashboard)
router.get('/alertas', requireAuth, getAlertasForUser)
router.get('/alerta/:alertaId/status', requireAuth, getAlertaStatus)

// ── Public ─────────────────────────────────────────────────────────────────────
router.get('/invite/:token', getInviteInfo)
router.get('/p/:token', getPartnerPage)
router.get('/p/:token/alertas', getPartnerAlertas)
router.post('/p/:token/alerta/:alertaId/responder', responderAlerta)

export default router
