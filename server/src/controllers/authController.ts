import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
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

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function createVerificationToken(userId: string, type: 'email_verify' | 'password_reset') {
  // One token per user per type (upsert pattern via deleteMany + create)
  await prisma.verificationToken.deleteMany({ where: { userId, type } })

  const code = generateOTP()
  const hoursToExpiry = type === 'email_verify' ? 24 : 1
  const expiresAt = new Date(Date.now() + hoursToExpiry * 60 * 60 * 1000)

  await prisma.verificationToken.create({ data: { userId, token: code, type, expiresAt } })
  return code
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

  // Send 6-digit verification code
  const code = await createVerificationToken(user.id, 'email_verify')
  sendVerificationEmail({ to: user.email, nombre: user.nombre, code, role: 'student' })
    .catch((e) => console.error('[Resend] verify student:', e.message))

  // Auto-login immediately
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

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user) {
    res.status(401).json({ error: 'No existe una cuenta con ese correo. ¿Quieres registrarte?' })
    return
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    res.status(401).json({ error: 'Contraseña incorrecta. Intenta de nuevo.' })
    return
  }

  const accessToken  = signAccessToken({ userId: user.id, email: user.email })
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
      emailVerified: user.emailVerified,
      fotoUrl: user.fotoUrl,
      ingresoMensual: user.ingresoMensual,
      horasTrabajoSemanal: user.horasTrabajoSemanal,
    },
    accessToken,
    refreshToken,
  })
}

// ─── Verify Code (OTP) ────────────────────────────────────────────────────────

export async function verifyCode(req: Request, res: Response): Promise<void> {
  const { email, code } = req.body
  if (!email || !code) {
    res.status(400).json({ error: 'Email y código son requeridos' })
    return
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user) {
    res.status(400).json({ error: 'Código inválido' })
    return
  }

  if (user.emailVerified) {
    res.json({ message: 'Tu correo ya está verificado.', user: { ...user, password: undefined } })
    return
  }

  const record = await prisma.verificationToken.findFirst({
    where: { userId: user.id, type: 'email_verify' },
  })

  if (!record || record.token !== code.toString().trim()) {
    res.status(400).json({ error: 'Código incorrecto. Revisa tu correo e intenta de nuevo.' })
    return
  }

  if (record.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { id: record.id } })
    res.status(400).json({ error: 'El código ha expirado. Solicita uno nuevo.' })
    return
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
    select: { id: true, email: true, nombre: true, onboardingComplete: true, emailVerified: true },
  })
  await prisma.verificationToken.delete({ where: { id: record.id } })

  sendWelcomeEmail({ to: updated.email, nombre: updated.nombre, role: 'student' }).catch(console.error)

  res.json({ message: '¡Correo verificado!', user: updated })
}

// ─── Resend verification code ─────────────────────────────────────────────────

export async function resendVerification(req: Request, res: Response): Promise<void> {
  const { email } = req.body
  if (!email) { res.status(400).json({ error: 'Email requerido' }); return }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user) { res.json({ message: 'Si el correo existe, recibirás un nuevo código.' }); return }
  if (user.emailVerified) { res.json({ message: 'Tu correo ya está verificado.' }); return }

  const code = await createVerificationToken(user.id, 'email_verify')
  sendVerificationEmail({ to: user.email, nombre: user.nombre, code, role: 'student' }).catch(console.error)

  res.json({ message: 'Código de verificación enviado.' })
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body
  if (!email) { res.status(400).json({ error: 'Email requerido' }); return }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (user) {
    const code = await createVerificationToken(user.id, 'password_reset')
    sendPasswordResetEmail({ to: user.email, nombre: user.nombre, code }).catch(console.error)
  }

  res.json({ message: 'Si el correo está registrado, recibirás un código para restablecer tu contraseña.' })
}

// ─── Reset Password (code-based) ──────────────────────────────────────────────

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { email, code, password } = req.body
  if (!email || !code || !password) {
    res.status(400).json({ error: 'Email, código y contraseña son requeridos' }); return
  }
  if (password.length < 8) { res.status(400).json({ error: 'Mínimo 8 caracteres' }); return }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user) { res.status(400).json({ error: 'Código inválido' }); return }

  const record = await prisma.verificationToken.findFirst({
    where: { userId: user.id, type: 'password_reset' },
  })
  if (!record || record.token !== code.toString().trim()) {
    res.status(400).json({ error: 'Código incorrecto' }); return
  }
  if (record.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { id: record.id } })
    res.status(400).json({ error: 'El código ha expirado. Solicita uno nuevo.' }); return
  }

  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
  await prisma.verificationToken.delete({ where: { id: record.id } })

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

    const newAccess  = signAccessToken({ userId: payload.userId, email: payload.email })
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
