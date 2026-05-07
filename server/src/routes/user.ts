import { Router } from 'express'
import { getProfile, updateProfile } from '../controllers/userController'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/profile', requireAuth, getProfile)
router.patch('/profile', requireAuth, updateProfile)

export default router
