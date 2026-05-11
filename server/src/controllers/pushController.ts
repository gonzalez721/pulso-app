import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { AsesorRequest } from '../middleware/asesorAuth'
import { prisma } from '../lib/prisma'

export async function subscribeUser(req: AuthRequest, res: Response): Promise<void> {
  const { endpoint, p256dh, auth } = req.body
  if (!endpoint || !p256dh || !auth) { res.status(400).json({ error: 'Datos incompletos' }); return }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh, auth, userId: req.userId, asesorId: null },
    create: { endpoint, p256dh, auth, userId: req.userId },
  })
  res.json({ ok: true })
}

export async function unsubscribeUser(req: AuthRequest, res: Response): Promise<void> {
  const { endpoint } = req.body
  if (endpoint) await prisma.pushSubscription.deleteMany({ where: { endpoint } })
  res.json({ ok: true })
}

export async function subscribeAsesor(req: AsesorRequest, res: Response): Promise<void> {
  const { endpoint, p256dh, auth } = req.body
  if (!endpoint || !p256dh || !auth) { res.status(400).json({ error: 'Datos incompletos' }); return }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh, auth, asesorId: req.asesorId, userId: null },
    create: { endpoint, p256dh, auth, asesorId: req.asesorId },
  })
  res.json({ ok: true })
}
