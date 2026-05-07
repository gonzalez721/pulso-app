import { Router } from 'express'
import { generateInsights } from '../controllers/insightController'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.use(requireAuth)
router.post('/generate', generateInsights)

export default router
