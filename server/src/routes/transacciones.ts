import { Router } from 'express'
import {
  createTransaccion,
  getTransacciones,
  getWeeklySummary,
} from '../controllers/transaccionController'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.use(requireAuth)
router.post('/', createTransaccion)
router.get('/', getTransacciones)
router.get('/weekly-summary', getWeeklySummary)

export default router
