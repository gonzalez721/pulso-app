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
    origin: (origin, callback) => {
      const allowed = [
        'http://localhost:5173',
        'http://localhost:4173',
        process.env.FRONTEND_URL ?? '',
        'https://client-silk-one.vercel.app',
        'https://pulsopacto.online',
        'https://www.pulsopacto.online',
        'https://pulso-app-gonzalez.vercel.app',
      ].filter(Boolean)

      // Allow requests with no origin (curl, Render health checks, etc.)
      if (!origin || allowed.includes(origin)) {
        callback(null, true)
      } else {
        console.warn(`CORS blocked: ${origin}`)
        callback(new Error(`CORS: origin not allowed — ${origin}`))
      }
    },
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

// Temporary email diagnostic
app.get('/debug-email', async (_req, res) => {
  try {
    const { Resend } = await import('resend')
    const key = process.env.RESEND_API_KEY
    if (!key) { res.json({ error: 'RESEND_API_KEY not set' }); return }
    const resend = new Resend(key)
    const result = await resend.emails.send({
      from: 'PULSO <no-reply@pulsopacto.online>',
      to: ['A2gtr721@gmail.com'],
      subject: 'Debug test',
      html: '<p>Debug desde Render</p>',
    })
    res.json({ key_prefix: key.substring(0, 12) + '...', result })
  } catch (err: any) {
    res.json({ error: err.message, stack: err.stack?.substring(0, 200) })
  }
})

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
