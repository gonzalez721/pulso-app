import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  saveRefreshToken,
  revokeRefreshToken,
  isRefreshTokenValid,
} from '../lib/jwt'
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
} from '../lib/resend'

const CLIENT_URL = process.env.FRONTEND_URL ?? 'https://client-silk-one.vercel.app'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function createVerificationToken(userId: string, type: 'email_verify' | 'password_reset') {
  // Remove any existing tokens of same type
  await prisma.verificationToken.deleteMany({ where: { userId, type } })

  const token = crypto.randomBytes(32).toString('hex')
  const hoursToExpiry = type === 'email_verify' ? 24 : 1
  const expiresAt = new Date(Date.now() + hoursToExpiry * 60 * 60 * 1000)

  await prisma.verificationToken.create({ data: { userId, token, type, expiresAt } })
  return token
}

// ─── Register ────────────────────────────────────────────────────────────────

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, nombre, universidad, semestre } = req.body

  if (!email || !password || !nombre) {
    res.status(400).json({ error: 'Email, contraseña y nombre son requeridos' })
    return
  }

  if (!email.toLowerCase().endsWith('.edu.co')) {
    res.status(400).json({ error: 'Debes usar tu correo institucional (.edu.co)' })
    return
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' })
    return
  }

  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (exists) {
    res.status(409).json({ error: 'El email ya está registrado' })
    return
  }

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashed,
      nombre,
      universidad,
      semestre: semestre ? Number(semestre) : undefined,
      emailVerified: false,
    },
    select: { id: true, email: true, nombre: true, onboardingComplete: true, emailVerified: true },
  })

  // Send verification email (non-blocking — does not block login)
  const token = await createVerificationToken(user.id, 'email_verify')
  const verifyUrl = `${CLIENT_URL}/verify-email?token=${token}`
  sendVerificationEmail({ to: user.email, nombre: user.nombre, verifyUrl, role: 'student' }).catch((e) => console.error('[Resend] verify student:', e.message))

  // Auto-login: issue tokens immediately
  const accessToken  = signAccessToken({ userId: user.id, email: user.email })
  const refreshToken = signRefreshToken({ userId: user.id, email: user.email })
  await saveRefreshToken(user.id, refreshToken)

  res.status(201).json({ user, accessToken, refreshToken })
}

// ─── Login ───────────────────────────────────────────────────────────────────

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña son requeridos' })
    return
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    res.status(401).json({ error: 'Credenciales incorrectas' })
    return
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    res.status(401).json({ error: 'Credenciales incorrectas' })
    return
  }


  const accessToken = signAccessToken({ userId: user.id, email: user.email })
  const refreshToken = signRefreshToken({ userId: user.id, email: user.email })
  await saveRefreshToken(user.id, refreshToken)

  res.json({
    user: {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      universidad: user.universidad,
      semestre: user.semestre,
      onboardingComplete: user.onboardingComplete,
    },
    accessToken,
    refreshToken,
  })
}

// ─── Verify Email ─────────────────────────────────────────────────────────────

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const { token } = req.query as { token?: string }

  if (!token) {
    res.status(400).json({ error: 'Token requerido' })
    return
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } })

  if (!record || record.type !== 'email_verify') {
    res.status(400).json({ error: 'Token inválido' })
    return
  }

  if (record.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { token } })
    res.status(400).json({ error: 'El enlace ha expirado. Solicita uno nuevo.' })
    return
  }

  const user = await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: true },
    select: { id: true, email: true, nombre: true, onboardingComplete: true },
  })

  await prisma.verificationToken.delete({ where: { token } })

  // Send welcome email
  sendWelcomeEmail({ to: user.email, nombre: user.nombre, role: 'student' }).catch(console.error)

  // Auto-login: issue tokens
  const accessToken = signAccessToken({ userId: user.id, email: user.email })
  const refreshToken = signRefreshToken({ userId: user.id, email: user.email })
  await saveRefreshToken(user.id, refreshToken)

  res.json({ message: '¡Correo verificado!', user, accessToken, refreshToken })
}

// ─── Resend verification email ────────────────────────────────────────────────

export async function resendVerification(req: Request, res: Response): Promise<void> {
  const { email } = req.body
  if (!email) { res.status(400).json({ error: 'Email requerido' }); return }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user) { res.json({ message: 'Si el correo existe, recibirás un nuevo enlace.' }); return }
  if (user.emailVerified) { res.json({ message: 'Tu correo ya está verificado.' }); return }

  const token = await createVerificationToken(user.id, 'email_verify')
  const verifyUrl = `${CLIENT_URL}/verify-email?token=${token}`
  sendVerificationEmail({ to: user.email, nombre: user.nombre, verifyUrl, role: 'student' }).catch(console.error)

  res.json({ message: 'Enlace de verificación enviado.' })
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body
  if (!email) { res.status(400).json({ error: 'Email requerido' }); return }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  // Always respond the same to avoid user enumeration
  if (user) {
    const token = await createVerificationToken(user.id, 'password_reset')
    const resetUrl = `${CLIENT_URL}/reset-password?token=${token}`
    sendPasswordResetEmail({ to: user.email, nombre: user.nombre, resetUrl }).catch(console.error)
  }

  res.json({ message: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña.' })
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body
  if (!token || !password) { res.status(400).json({ error: 'Token y contraseña requeridos' }); return }
  if (password.length < 8) { res.status(400).json({ error: 'Mínimo 8 caracteres' }); return }

  const record = await prisma.verificationToken.findUnique({ where: { token } })
  if (!record || record.type !== 'password_reset') {
    res.status(400).json({ error: 'Token inválido' }); return
  }
  if (record.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { token } })
    res.status(400).json({ error: 'El enlace ha expirado. Solicita uno nuevo.' }); return
  }

  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.update({ where: { id: record.userId }, data: { password: hashed } })
  await prisma.verificationToken.delete({ where: { token } })

  res.json({ message: 'Contraseña actualizada correctamente.' })
}

// ─── Refresh / Logout ────────────────────────────────────────────────────────

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token requerido' })
    return
  }

  try {
    const valid = await isRefreshTokenValid(refreshToken)
    if (!valid) {
      res.status(401).json({ error: 'Refresh token inválido' })
      return
    }

    const payload = verifyRefreshToken(refreshToken)
    await revokeRefreshToken(refreshToken)

    const newAccess = signAccessToken({ userId: payload.userId, email: payload.email })
    const newRefresh = signRefreshToken({ userId: payload.userId, email: payload.email })
    await saveRefreshToken(payload.userId, newRefresh)

    res.json({ accessToken: newAccess, refreshToken: newRefresh })
  } catch {
    res.status(401).json({ error: 'Refresh token inválido o expirado' })
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body
  if (refreshToken) {
    await revokeRefreshToken(refreshToken).catch(() => {})
  }
  res.json({ message: 'Sesión cerrada' })
}
