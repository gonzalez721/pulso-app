import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { subscribeUser, unsubscribeUser } from '../controllers/pushController'

const router = Router()

router.post('/subscribe',   requireAuth, subscribeUser)
router.delete('/subscribe', requireAuth, unsubscribeUser)

export default router
