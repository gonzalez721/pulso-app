import { Router } from 'express'
import {
  createTransaccion,
  deleteTransaccion,
  getTransacciones,
  getWeeklySummary,
} from '../controllers/transaccionController'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.use(requireAuth)
router.post('/', createTransaccion)
router.delete('/:id', deleteTransaccion)
router.get('/', getTransacciones)
router.get('/weekly-summary', getWeeklySummary)

export default router
