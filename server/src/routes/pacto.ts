import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import {
  getPartner,
  upsertPartner,
  deletePartner,
  getAlertasForUser,
  getAlertaStatus,
  getPartnerPage,
  getPartnerAlertas,
  responderAlerta,
} from '../controllers/pactoController'

const router = Router()

// ── Authenticated user routes ─────────────────────────────────────────────────
router.get('/partner', requireAuth, getPartner)
router.post('/partner', requireAuth, upsertPartner)
router.delete('/partner', requireAuth, deletePartner)
router.get('/alertas', requireAuth, getAlertasForUser)
router.get('/alerta/:alertaId/status', requireAuth, getAlertaStatus)

// ── Public partner-token routes (no auth) ─────────────────────────────────────
router.get('/p/:token', getPartnerPage)
router.get('/p/:token/alertas', getPartnerAlertas)
router.post('/p/:token/alerta/:alertaId/responder', responderAlerta)

export default router
