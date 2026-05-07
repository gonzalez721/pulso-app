import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import authRoutes from './routes/auth'
import userRoutes from './routes/user'
import transaccionRoutes from './routes/transacciones'
import metaRoutes from './routes/metas'
import sesionRoutes from './routes/sesiones'
import insightRoutes from './routes/insights'
import moodRoutes from './routes/mood'
import asesorRoutes from './routes/asesor'
import { errorHandler, notFound } from './middleware/errorHandler'

const app = express()
const PORT = process.env.PORT ?? 3001

// Security
app.use(helmet())
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL ?? 'http://localhost:5173',
      'https://pulso-app-gonzalez.vercel.app',
      'http://localhost:5173',
    ],
    credentials: true,
  })
)

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 })
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 })
app.use(limiter)

// Logging & parsing
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }))

// Routes
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/transacciones', transaccionRoutes)
app.use('/api/metas', metaRoutes)
app.use('/api/sesiones', sesionRoutes)
app.use('/api/insights', insightRoutes)
app.use('/api/mood', moodRoutes)
app.use('/api/asesor', asesorRoutes)

// Error handling
app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 PULSO API running on http://localhost:${PORT}`)
})

export default app
