import { Router } from 'express'
import { saveMood, getMoods } from '../controllers/moodController'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.use(requireAuth)
router.post('/', saveMood)
router.get('/', getMoods)

export default router
