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

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, nombre, universidad, semestre } = req.body

  if (!email || !password || !nombre) {
    res.status(400).json({ error: 'Email, contraseña y nombre son requeridos' })
    return
  }

  // Solo correos institucionales colombianos
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
    data: { email: email.toLowerCase(), password: hashed, nombre, universidad, semestre: semestre ? Number(semestre) : undefined },
    select: { id: true, email: true, nombre: true, onboardingComplete: true },
  })

  const accessToken = signAccessToken({ userId: user.id, email: user.email })
  const refreshToken = signRefreshToken({ userId: user.id, email: user.email })
  await saveRefreshToken(user.id, refreshToken)

  res.status(201).json({ user, accessToken, refreshToken })
}

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
