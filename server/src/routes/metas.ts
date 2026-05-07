import { Router } from 'express'
import { createMeta, getActiveMetas, updateMeta } from '../controllers/metaController'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.use(requireAuth)
router.post('/', createMeta)
router.get('/active', getActiveMetas)
router.patch('/:id', updateMeta)

export default router
