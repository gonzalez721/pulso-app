import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import {
  getPartner,
  upsertPartner,
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

// ── Authenticated user routes ─────────────────────────────────────────────────
router.get('/partner', requireAuth, getPartner)
router.post('/partner', requireAuth, upsertPartner)
router.delete('/partner', requireAuth, deletePartner)
router.post('/accept', requireAuth, acceptPacto)
router.get('/dashboard', requireAuth, getDashboard)
router.get('/alertas', requireAuth, getAlertasForUser)
router.get('/alerta/:alertaId/status', requireAuth, getAlertaStatus)

// ── Public invite info (no auth) ──────────────────────────────────────────────
router.get('/invite/:token', getInviteInfo)

// ── Legacy public partner-alerta page ─────────────────────────────────────────
router.get('/p/:token', getPartnerPage)
router.get('/p/:token/alertas', getPartnerAlertas)
router.post('/p/:token/alerta/:alertaId/responder', responderAlerta)

export default router
