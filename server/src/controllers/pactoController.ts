import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { sendPushToUser } from '../services/pushService'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function weeklyStats(userId: string) {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const [user, tx, meta] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { nombre: true, fotoUrl: true } }),
    prisma.transaccion.findMany({ where: { userId, fecha: { gte: weekStart, lte: weekEnd } } }),
    prisma.meta.findFirst({ where: { userId, activa: true, tipoMeta: 'SEMANAL', fechaInicio: { lte: now }, fechaFin: { gte: now } } }),
  ])

  const spent = tx.reduce((s, t) => s + t.monto, 0)
  const budget = meta?.montoObjetivo ?? 0
  const pct = budget > 0 ? Math.round((spent / budget) * 100) : null
  const byCategory: Record<string, number> = {}
  for (const t of tx) byCategory[t.categoria] = (byCategory[t.categoria] ?? 0) + t.monto

  return { nombre: user?.nombre ?? '', fotoUrl: user?.fotoUrl ?? null, spent, budget, pct, byCategory, txCount: tx.length }
}

// ─── User-auth routes ─────────────────────────────────────────────────────────

/** GET /api/pacto/partners — all partners for current user */
export async function getPartners(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!

  // As inviter
  const outgoing = await prisma.pactoPartner.findMany({
    where: { userId, activo: true },
    orderBy: { createdAt: 'desc' },
    select: { id: true, nombre: true, telefono: true, token: true, estado: true, partnerUserId: true, createdAt: true },
  })

  // As invited (where this user is the accepted partner)
  const incoming = await prisma.pactoPartner.findMany({
    where: { partnerUserId: userId, activo: true },
    include: { user: { select: { nombre: true, fotoUrl: true } } },
  })

  res.json({
    partners: outgoing,
    asInvited: incoming.map((p) => ({
      id: p.id,
      inviterNombre: p.user.nombre,
      inviterFotoUrl: p.user.fotoUrl,
      estado: p.estado,
    })),
  })
}

/** POST /api/pacto/partner — create a new partner invite */
export async function createPartner(req: AuthRequest, res: Response): Promise<void> {
  const { nombre, telefono } = req.body
  if (!nombre?.trim()) {
    res.status(400).json({ error: 'El nombre del partner es requerido' }); return
  }

  const partner = await prisma.pactoPartner.create({
    data: { userId: req.userId!, nombre: nombre.trim(), telefono: telefono?.trim() || null },
  })

  res.json({ partner })
}

/** PATCH /api/pacto/partner/:partnerId — update partner name/phone */
export async function updatePartner(req: AuthRequest, res: Response): Promise<void> {
  const { partnerId } = req.params
  const { nombre, telefono } = req.body

  const existing = await prisma.pactoPartner.findFirst({ where: { id: partnerId, userId: req.userId! } })
  if (!existing) { res.status(404).json({ error: 'Partner no encontrado' }); return }

  const updated = await prisma.pactoPartner.update({
    where: { id: partnerId },
    data: { nombre: nombre?.trim() ?? existing.nombre, telefono: telefono?.trim() || null },
  })
  res.json({ partner: updated })
}

/** DELETE /api/pacto/partner/:partnerId — remove a specific partner */
export async function deletePartner(req: AuthRequest, res: Response): Promise<void> {
  const { partnerId } = req.params
  const existing = await prisma.pactoPartner.findFirst({ where: { id: partnerId, userId: req.userId! } })
  if (!existing) { res.status(404).json({ error: 'Partner no encontrado' }); return }
  await prisma.pactoPartner.delete({ where: { id: partnerId } })
  res.json({ ok: true })
}

/** POST /api/pacto/accept — invited user links their account to a token */
export async function acceptPacto(req: AuthRequest, res: Response): Promise<void> {
  const { token } = req.body
  if (!token) { res.status(400).json({ error: 'Token requerido' }); return }

  const partner = await prisma.pactoPartner.findUnique({ where: { token } })
  if (!partner || !partner.activo) { res.status(404).json({ error: 'Invitación no válida' }); return }
  if (partner.userId === req.userId!) { res.status(400).json({ error: 'No puedes ser tu propio partner' }); return }
  if (partner.partnerUserId && partner.partnerUserId !== req.userId!) {
    res.status(409).json({ error: 'Este link ya fue usado' }); return
  }

  const updated = await prisma.pactoPartner.update({
    where: { token },
    data: { partnerUserId: req.userId!, estado: 'aceptado' },
  })

  const invited = await prisma.user.findUnique({ where: { id: req.userId! }, select: { nombre: true } })
  sendPushToUser(partner.userId, {
    title: '🤝 ¡Tu PACTO está activo!',
    body: `${invited?.nombre ?? 'Tu partner'} aceptó la invitación. ¡Ya pueden competir!`,
    url: '/pacto',
  }).catch(console.error)

  res.json({ ok: true, estado: updated.estado })
}

/** GET /api/pacto/dashboard — competition stats for all accepted partners */
export async function getDashboard(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!

  // Find all accepted PACTO links involving this user
  const [asInviter, asInvited] = await Promise.all([
    prisma.pactoPartner.findMany({ where: { userId, estado: 'aceptado', activo: true } }),
    prisma.pactoPartner.findMany({ where: { partnerUserId: userId, estado: 'aceptado', activo: true } }),
  ])

  if (asInviter.length === 0 && asInvited.length === 0) {
    res.json({ connected: false, competitions: [] }); return
  }

  // Collect all partner user IDs
  const partnerIds = [
    ...asInviter.map((p) => p.partnerUserId!),
    ...asInvited.map((p) => p.userId),
  ].filter(Boolean)

  // Get my stats once
  const myStats = await weeklyStats(userId)

  // Get each partner's stats
  const competitionsRaw = await Promise.all(
    partnerIds.map(async (partnerId) => {
      const partnerStats = await weeklyStats(partnerId)
      return { partnerId, partnerStats }
    })
  )

  const competitions = competitionsRaw.map(({ partnerId, partnerStats }) => {
    // Find the link to get the display name (might differ from registered name)
    const link = asInviter.find((p) => p.partnerUserId === partnerId)
          ?? asInvited.find((p) => p.userId === partnerId)
    return {
      partnerId,
      linkId: link?.id,
      partnerNombreInvite: link ? (asInviter.includes(link) ? link.nombre : partnerStats.nombre) : partnerStats.nombre,
      partner: partnerStats,
    }
  })

  res.json({ connected: true, me: myStats, competitions })
}

/** GET /api/pacto/alertas */
export async function getAlertasForUser(req: AuthRequest, res: Response): Promise<void> {
  const partners = await prisma.pactoPartner.findMany({ where: { userId: req.userId! } })
  if (!partners.length) { res.json({ alertas: [] }); return }
  const alertas = await prisma.pactoAlerta.findMany({
    where: { partnerId: { in: partners.map((p) => p.id) } },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })
  res.json({ alertas })
}

/** GET /api/pacto/alerta/:alertaId/status */
export async function getAlertaStatus(req: AuthRequest, res: Response): Promise<void> {
  const { alertaId } = req.params
  const alerta = await prisma.pactoAlerta.findFirst({
    where: { id: alertaId, userId: req.userId! },
    select: { id: true, estado: true, respuestaMensaje: true, respondedAt: true },
  })
  if (!alerta) { res.status(404).json({ error: 'Alerta no encontrada' }); return }
  res.json({ alerta })
}

// ─── Public invite page ───────────────────────────────────────────────────────

/** GET /api/pacto/invite/:token */
export async function getInviteInfo(req: Request, res: Response): Promise<void> {
  const { token } = req.params
  const partner = await prisma.pactoPartner.findUnique({
    where: { token },
    include: { user: { select: { nombre: true, fotoUrl: true } } },
  })
  if (!partner || !partner.activo) { res.status(404).json({ error: 'Invitación no válida o expirada' }); return }
  if (partner.estado === 'aceptado') { res.json({ alreadyAccepted: true, inviterNombre: partner.user.nombre }); return }
  res.json({
    alreadyAccepted: false,
    inviterNombre: partner.user.nombre,
    inviterFotoUrl: partner.user.fotoUrl,
    partnerNombre: partner.nombre,
  })
}

// ─── Legacy public partner-alerta page ───────────────────────────────────────

export async function getPartnerPage(req: Request, res: Response): Promise<void> {
  const { token } = req.params
  const partner = await prisma.pactoPartner.findUnique({
    where: { token },
    include: { user: { select: { nombre: true, fotoUrl: true } } },
  })
  if (!partner || !partner.activo) { res.status(404).json({ error: 'Link inválido' }); return }
  res.json({ partner: { nombre: partner.nombre, userNombre: partner.user.nombre, userFotoUrl: partner.user.fotoUrl } })
}

export async function getPartnerAlertas(req: Request, res: Response): Promise<void> {
  const { token } = req.params
  const partner = await prisma.pactoPartner.findUnique({
    where: { token },
    include: { user: { select: { nombre: true } } },
  })
  if (!partner || !partner.activo) { res.status(404).json({ error: 'Link inválido' }); return }
  const alertas = await prisma.pactoAlerta.findMany({
    where: { partnerId: partner.id, expiresAt: { gte: new Date() } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })
  res.json({ alertas, userNombre: partner.user.nombre })
}

export async function responderAlerta(req: Request, res: Response): Promise<void> {
  const { token, alertaId } = req.params
  const { decision, mensaje } = req.body
  if (!['aprobado', 'rechazado'].includes(decision)) { res.status(400).json({ error: 'Decisión inválida' }); return }
  const partner = await prisma.pactoPartner.findUnique({ where: { token } })
  if (!partner || !partner.activo) { res.status(404).json({ error: 'Link inválido' }); return }
  const alerta = await prisma.pactoAlerta.findFirst({ where: { id: alertaId, partnerId: partner.id } })
  if (!alerta) { res.status(404).json({ error: 'Alerta no encontrada' }); return }
  if (alerta.estado !== 'pendiente') { res.json({ ok: true, alerta }); return }
  const updated = await prisma.pactoAlerta.update({
    where: { id: alertaId },
    data: { estado: decision, respuestaMensaje: mensaje?.trim() || null, respondedAt: new Date() },
  })
  const emoji = decision === 'aprobado' ? '✅' : '🛑'
  sendPushToUser(alerta.userId, {
    title: `${emoji} Tu partner ${decision === 'aprobado' ? 'aprobó' : 'frenó'} tu gasto`,
    body: mensaje?.trim() || `Respondió sobre el gasto en ${alerta.categoria}`,
    url: '/pacto',
  }).catch(console.error)
  res.json({ ok: true, alerta: updated })
}
