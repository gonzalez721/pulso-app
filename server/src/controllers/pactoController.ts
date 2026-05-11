import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { sendPushToUser } from '../services/pushService'

// ─── User-auth routes ─────────────────────────────────────────────────────────

/** GET /api/pacto/partner — get current user's outgoing partner invite */
export async function getPartner(req: AuthRequest, res: Response): Promise<void> {
  // User may be the inviter OR the invited
  const asInviter = await prisma.pactoPartner.findUnique({
    where: { userId: req.userId! },
    select: { id: true, nombre: true, telefono: true, token: true, activo: true, estado: true, partnerUserId: true, createdAt: true },
  })
  // User may also be the invited party
  const asInvited = await prisma.pactoPartner.findUnique({
    where: { partnerUserId: req.userId! },
    include: { user: { select: { nombre: true, fotoUrl: true } } },
  })
  res.json({ partner: asInviter, asInvited: asInvited ? { inviterNombre: asInvited.user.nombre, inviterFotoUrl: asInvited.user.fotoUrl, estado: asInvited.estado } : null })
}

/** POST /api/pacto/partner — create or update partner invite */
export async function upsertPartner(req: AuthRequest, res: Response): Promise<void> {
  const { nombre, telefono } = req.body
  if (!nombre?.trim()) {
    res.status(400).json({ error: 'El nombre del partner es requerido' })
    return
  }

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

/** DELETE /api/pacto/partner — remove partner invite */
export async function deletePartner(req: AuthRequest, res: Response): Promise<void> {
  await prisma.pactoPartner.deleteMany({ where: { userId: req.userId! } })
  res.json({ ok: true })
}

/** POST /api/pacto/accept — invited user links their account to a token */
export async function acceptPacto(req: AuthRequest, res: Response): Promise<void> {
  const { token } = req.body
  if (!token) { res.status(400).json({ error: 'Token requerido' }); return }

  const partner = await prisma.pactoPartner.findUnique({ where: { token } })
  if (!partner || !partner.activo) {
    res.status(404).json({ error: 'Invitación no válida' }); return
  }
  if (partner.userId === req.userId!) {
    res.status(400).json({ error: 'No puedes ser tu propio partner' }); return
  }
  if (partner.partnerUserId && partner.partnerUserId !== req.userId!) {
    res.status(409).json({ error: 'Este link ya fue usado por otra persona' }); return
  }

  const updated = await prisma.pactoPartner.update({
    where: { token },
    data: { partnerUserId: req.userId!, estado: 'aceptado' },
  })

  // Notify the inviter
  const invited = await prisma.user.findUnique({ where: { id: req.userId! }, select: { nombre: true } })
  sendPushToUser(partner.userId, {
    title: '🤝 ¡Tu PACTO está activo!',
    body: `${invited?.nombre ?? 'Tu partner'} aceptó la invitación. Ya pueden competir juntos.`,
    url: '/pacto',
  }).catch(console.error)

  res.json({ ok: true, estado: updated.estado })
}

/** GET /api/pacto/dashboard — competitive stats for both users in the PACTO */
export async function getDashboard(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!

  // Find the partner relationship (either side)
  const asInviter = await prisma.pactoPartner.findUnique({
    where: { userId },
    include: { user: { select: { nombre: true, fotoUrl: true } } },
  })
  const asInvited = await prisma.pactoPartner.findUnique({
    where: { partnerUserId: userId },
    include: { user: { select: { nombre: true, fotoUrl: true } } },
  })

  const link = asInviter ?? asInvited
  if (!link || link.estado !== 'aceptado') {
    res.json({ connected: false }); return
  }

  const myId = userId
  const partnerId = asInviter ? (link.partnerUserId ?? null) : link.userId

  if (!partnerId) { res.json({ connected: false }); return }

  // Week bounds
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const [myUser, partnerUser, myTx, partnerTx, myMeta, partnerMeta] = await Promise.all([
    prisma.user.findUnique({ where: { id: myId }, select: { nombre: true, fotoUrl: true } }),
    prisma.user.findUnique({ where: { id: partnerId }, select: { nombre: true, fotoUrl: true } }),
    prisma.transaccion.findMany({ where: { userId: myId, fecha: { gte: weekStart, lte: weekEnd } } }),
    prisma.transaccion.findMany({ where: { userId: partnerId, fecha: { gte: weekStart, lte: weekEnd } } }),
    prisma.meta.findFirst({ where: { userId: myId, activa: true, tipoMeta: 'SEMANAL', fechaInicio: { lte: now }, fechaFin: { gte: now } } }),
    prisma.meta.findFirst({ where: { userId: partnerId, activa: true, tipoMeta: 'SEMANAL', fechaInicio: { lte: now }, fechaFin: { gte: now } } }),
  ])

  const buildStats = (tx: { monto: number; categoria: string }[], meta: { montoObjetivo: number } | null) => {
    const spent = tx.reduce((s, t) => s + t.monto, 0)
    const budget = meta?.montoObjetivo ?? 0
    const pct = budget > 0 ? Math.round((spent / budget) * 100) : null
    const byCategory: Record<string, number> = {}
    for (const t of tx) byCategory[t.categoria] = (byCategory[t.categoria] ?? 0) + t.monto
    return { spent, budget, pct, byCategory, txCount: tx.length }
  }

  res.json({
    connected: true,
    me: { ...myUser, ...buildStats(myTx, myMeta) },
    partner: { ...partnerUser, ...buildStats(partnerTx, partnerMeta) },
    weekStart: weekStart.toISOString(),
  })
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

// ─── Public partner-token routes (invite page) ────────────────────────────────

/** GET /api/pacto/invite/:token — get invite info (no auth) */
export async function getInviteInfo(req: Request, res: Response): Promise<void> {
  const { token } = req.params
  const partner = await prisma.pactoPartner.findUnique({
    where: { token },
    include: { user: { select: { nombre: true, fotoUrl: true } } },
  })
  if (!partner || !partner.activo) {
    res.status(404).json({ error: 'Invitación no válida o expirada' }); return
  }
  if (partner.estado === 'aceptado') {
    res.json({ alreadyAccepted: true, inviterNombre: partner.user.nombre }); return
  }
  res.json({
    alreadyAccepted: false,
    inviterNombre: partner.user.nombre,
    inviterFotoUrl: partner.user.fotoUrl,
    partnerNombre: partner.nombre, // pre-fill name
  })
}

// ─── Legacy public partner page routes (for alerta responses) ─────────────────

/** GET /api/pacto/p/:token */
export async function getPartnerPage(req: Request, res: Response): Promise<void> {
  const { token } = req.params
  const partner = await prisma.pactoPartner.findUnique({
    where: { token },
    include: { user: { select: { nombre: true, fotoUrl: true } } },
  })
  if (!partner || !partner.activo) {
    res.status(404).json({ error: 'Link de PACTO inválido o desactivado' }); return
  }
  res.json({ partner: { nombre: partner.nombre, userNombre: partner.user.nombre, userFotoUrl: partner.user.fotoUrl } })
}

/** GET /api/pacto/p/:token/alertas */
export async function getPartnerAlertas(req: Request, res: Response): Promise<void> {
  const { token } = req.params
  const partner = await prisma.pactoPartner.findUnique({
    where: { token },
    include: { user: { select: { nombre: true } } },
  })
  if (!partner || !partner.activo) { res.status(404).json({ error: 'Link de PACTO inválido' }); return }
  const alertas = await prisma.pactoAlerta.findMany({
    where: { partnerId: partner.id, expiresAt: { gte: new Date() } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })
  res.json({ alertas, userNombre: partner.user.nombre })
}

/** POST /api/pacto/p/:token/alerta/:alertaId/responder */
export async function responderAlerta(req: Request, res: Response): Promise<void> {
  const { token, alertaId } = req.params
  const { decision, mensaje } = req.body
  if (!['aprobado', 'rechazado'].includes(decision)) { res.status(400).json({ error: 'Decisión inválida' }); return }

  const partner = await prisma.pactoPartner.findUnique({ where: { token } })
  if (!partner || !partner.activo) { res.status(404).json({ error: 'Link de PACTO inválido' }); return }

  const alerta = await prisma.pactoAlerta.findFirst({ where: { id: alertaId, partnerId: partner.id } })
  if (!alerta) { res.status(404).json({ error: 'Alerta no encontrada' }); return }
  if (alerta.estado !== 'pendiente') { res.json({ ok: true, alerta }); return }

  const updated = await prisma.pactoAlerta.update({
    where: { id: alertaId },
    data: { estado: decision, respuestaMensaje: mensaje?.trim() || null, respondedAt: new Date() },
  })

  const emoji = decision === 'aprobado' ? '✅' : '🛑'
  const label = decision === 'aprobado' ? 'aprobó' : 'frenó'
  sendPushToUser(alerta.userId, {
    title: `${emoji} Tu partner ${label} tu gasto`,
    body: mensaje?.trim() || `Respondió sobre el gasto en ${alerta.categoria}`,
    url: '/pacto',
  }).catch(console.error)

  res.json({ ok: true, alerta: updated })
}
