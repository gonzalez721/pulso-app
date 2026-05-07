import { Router } from 'express'
import {
  getSesiones,
  getDisponibilidad,
  bookSesion,
  cancelSesion,
} from '../controllers/sesionController'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.use(requireAuth)
router.get('/', getSesiones)
router.get('/disponibilidad', getDisponibilidad)
router.post('/book', bookSesion)
router.patch('/:id/cancel', cancelSesion)

export default router
