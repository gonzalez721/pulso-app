import { Router } from 'express'
import { getProfile, updateProfile, updateFoto } from '../controllers/userController'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/profile', requireAuth, getProfile)
router.patch('/profile', requireAuth, updateProfile)
router.patch('/foto', requireAuth, updateFoto)

export default router
