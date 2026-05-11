import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { sendPushToUser } from '../services/pushService'

// ─── User-auth routes ─────────────────────────────────────────────────────────

/** GET /api/pacto/partner — get current user's partner */
export async function getPartner(req: AuthRequest, res: Response): Promise<void> {
  const partner = await prisma.pactoPartner.findUnique({
    where: { userId: req.userId! },
    select: {
      id: true, nombre: true, telefono: true, token: true, activo: true, createdAt: true,
    },
  })
  res.json({ partner })
}

/** POST /api/pacto/partner — create or replace partner */
export async function upsertPartner(req: AuthRequest, res: Response): Promise<void> {
  const { nombre, telefono } = req.body
  if (!nombre?.trim()) {
    res.status(400).json({ error: 'El nombre del partner es requerido' })
    return
  }

  // Upsert — if exists, preserve token so existing WhatsApp link stays valid
  const existing = await prisma.pactoPartner.findUnique({ where: { userId: req.userId! } })

  const partner = existing
    ? await prisma.pactoPartner.update({
        where: { userId: req.userId! },
        data: { nombre: nombre.trim(), telefono: telefono?.trim() || null, activo: true },
      })
    : await prisma.pactoPartner.create({
        data: { userId: req.userId!, nombre: nombre.trim(), telefono: telefono?.trim() || null },
      })

  res.json({ partner })
}

/** DELETE /api/pacto/partner — remove partner */
export async function deletePartner(req: AuthRequest, res: Response): Promise<void> {
  await prisma.pactoPartner.deleteMany({ where: { userId: req.userId! } })
  res.json({ ok: true })
}

/** GET /api/pacto/alertas — list recent alertas for current user */
export async function getAlertasForUser(req: AuthRequest, res: Response): Promise<void> {
  const partner = await prisma.pactoPartner.findUnique({ where: { userId: req.userId! } })
  if (!partner) { res.json({ alertas: [] }); return }

  const alertas = await prisma.pactoAlerta.findMany({
    where: { partnerId: partner.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  res.json({ alertas })
}

/** GET /api/pacto/alerta/:alertaId/status — poll alerta state */
export async function getAlertaStatus(req: AuthRequest, res: Response): Promise<void> {
  const { alertaId } = req.params
  const alerta = await prisma.pactoAlerta.findFirst({
    where: { id: alertaId, userId: req.userId! },
    select: { id: true, estado: true, respuestaMensaje: true, respondedAt: true },
  })
  if (!alerta) { res.status(404).json({ error: 'Alerta no encontrada' }); return }
  res.json({ alerta })
}

// ─── Public partner-token routes ──────────────────────────────────────────────

/** GET /api/pacto/p/:token — public partner info page */
export async function getPartnerPage(req: Request, res: Response): Promise<void> {
  const { token } = req.params
  const partner = await prisma.pactoPartner.findUnique({
    where: { token },
    include: { user: { select: { nombre: true, fotoUrl: true } } },
  })
  if (!partner || !partner.activo) {
    res.status(404).json({ error: 'Link de PACTO inválido o desactivado' })
    return
  }
  res.json({
    partner: {
      nombre: partner.nombre,
      userNombre: partner.user.nombre,
      userFotoUrl: partner.user.fotoUrl,
    },
  })
}

/** GET /api/pacto/p/:token/alertas — list pending alertas for this partner page */
export async function getPartnerAlertas(req: Request, res: Response): Promise<void> {
  const { token } = req.params
  const partner = await prisma.pactoPartner.findUnique({
    where: { token },
    include: { user: { select: { nombre: true } } },
  })
  if (!partner || !partner.activo) {
    res.status(404).json({ error: 'Link de PACTO inválido' })
    return
  }

  const alertas = await prisma.pactoAlerta.findMany({
    where: {
      partnerId: partner.id,
      estado: { in: ['pendiente', 'aprobado', 'rechazado'] },
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  res.json({ alertas, userNombre: partner.user.nombre })
}

/** POST /api/pacto/p/:token/alerta/:alertaId/responder — partner responds */
export async function responderAlerta(req: Request, res: Response): Promise<void> {
  const { token, alertaId } = req.params
  const { decision, mensaje } = req.body // decision: 'aprobado' | 'rechazado'

  if (!['aprobado', 'rechazado'].includes(decision)) {
    res.status(400).json({ error: 'Decisión inválida' })
    return
  }

  const partner = await prisma.pactoPartner.findUnique({
    where: { token },
    include: { user: { select: { nombre: true } } },
  })
  if (!partner || !partner.activo) {
    res.status(404).json({ error: 'Link de PACTO inválido' })
    return
  }

  const alerta = await prisma.pactoAlerta.findFirst({
    where: { id: alertaId, partnerId: partner.id },
  })
  if (!alerta) {
    res.status(404).json({ error: 'Alerta no encontrada' })
    return
  }
  if (alerta.estado !== 'pendiente') {
    res.json({ ok: true, alerta }) // idempotent
    return
  }

  const updated = await prisma.pactoAlerta.update({
    where: { id: alertaId },
    data: {
      estado: decision,
      respuestaMensaje: mensaje?.trim() || null,
      respondedAt: new Date(),
    },
  })

  // Push notification to user
  const emoji = decision === 'aprobado' ? '✅' : '🛑'
  const label = decision === 'aprobado' ? 'aprobó' : 'frenó'
  sendPushToUser(alerta.userId, {
    title: `${emoji} ${partner.nombre} ${label} tu gasto`,
    body: mensaje?.trim() || `Tu partner respondió sobre el gasto en ${alerta.categoria}`,
    url: '/dashboard',
  }).catch(console.error)

  res.json({ ok: true, alerta: updated })
}
