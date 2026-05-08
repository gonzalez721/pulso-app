import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { Prisma } from '@prisma/client'
import { enviarNotificacionPartner } from '../lib/webpush'
import webpush from 'web-push'

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'https://pulsopacto.online'
const WINDOW_SECS  = 60   // seconds partner has to respond

// ─── POST /api/pacto/setup ────────────────────────────────────────────────────
// Creates or updates the user's PACTO relation (human or IA mode)
export async function setupPacto(req: AuthRequest, res: Response): Promise<void> {
  const { modo } = req.body as { modo: 'humano' | 'ia' }
  if (!modo) { res.status(400).json({ error: 'modo requerido' }); return }

  const pacto = await prisma.pactoRelacion.upsert({
    where:  { userId: req.userId! },
    update: { modo, estado: modo === 'ia' ? 'activo' : 'pendiente', updatedAt: new Date() },
    create: { userId: req.userId!, modo, estado: modo === 'ia' ? 'activo' : 'pendiente' },
  })

  res.json({
    pacto,
    inviteUrl: modo === 'humano'
      ? `${FRONTEND_URL}/pacto/invitacion?token=${pacto.inviteToken}`
      : null,
  })
}

// ─── GET /api/pacto/status ────────────────────────────────────────────────────
export async function getPactoStatus(req: AuthRequest, res: Response): Promise<void> {
  const pacto = await prisma.pactoRelacion.findUnique({
    where: { userId: req.userId! },
  })

  if (!pacto) { res.json({ activo: false }); return }

  res.json({
    activo:      pacto.estado === 'activo',
    estado:      pacto.estado,
    modo:        pacto.modo,
    partnerNombre: pacto.partnerNombre,
    inviteUrl:   pacto.modo === 'humano'
      ? `${FRONTEND_URL}/pacto/invitacion?token=${pacto.inviteToken}`
      : null,
  })
}

// ─── GET /api/pacto/invitacion/:token (public) ────────────────────────────────
export async function getInviteInfo(req: Request, res: Response): Promise<void> {
  const { token } = req.params

  const pacto = await prisma.pactoRelacion.findUnique({
    where:  { inviteToken: token },
    include: { user: { select: { nombre: true } } },
  })

  if (!pacto) { res.status(404).json({ error: 'Invitación no encontrada' }); return }
  if (pacto.estado === 'activo') { res.status(409).json({ error: 'Este PACTO ya tiene un partner activo', yaActivo: true }); return }

  res.json({
    userName:  pacto.user.nombre,
    inviteToken: token,
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? '',
  })
}

// ─── POST /api/pacto/invitacion/:token/accept (public) ───────────────────────
export async function acceptInvite(req: Request, res: Response): Promise<void> {
  const { token } = req.params
  const { partnerNombre, pushSubscription } = req.body as {
    partnerNombre: string
    pushSubscription: webpush.PushSubscription
  }

  if (!partnerNombre?.trim()) { res.status(400).json({ error: 'Nombre requerido' }); return }

  const pacto = await prisma.pactoRelacion.findUnique({ where: { inviteToken: token } })
  if (!pacto) { res.status(404).json({ error: 'Invitación no encontrada' }); return }
  if (pacto.estado === 'activo') { res.status(409).json({ error: 'Ya tiene un partner activo' }); return }

  await prisma.pactoRelacion.update({
    where: { inviteToken: token },
    data:  {
      partnerNombre:    partnerNombre.trim(),
      pushSubscription: pushSubscription ? (pushSubscription as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
      estado:           'activo',
      activadoEn:       new Date(),
    },
  })

  res.json({ ok: true, mensaje: `¡Bienvenido/a ${partnerNombre}! Ya sos parte del PACTO.` })
}

// ─── GET /api/pacto/alerta/:id/status (public — partner polls this too) ───────
export async function getAlertaStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  const alerta = await prisma.pactoAlerta.findUnique({
    where:  { id },
    select: { estado: true, mensajePartner: true, mensajeAuto: true, expiresAt: true },
  })

  if (!alerta) { res.status(404).json({ error: 'Alerta no encontrada' }); return }

  // Auto-expire if window has passed and still waiting
  if (alerta.estado === 'esperando' && new Date() > alerta.expiresAt) {
    await prisma.pactoAlerta.update({
      where: { id },
      data:  { estado: 'timeout' },
    })
    res.json({ estado: 'timeout', mensajeAuto: alerta.mensajeAuto })
    return
  }

  res.json({
    estado:        alerta.estado,
    mensajePartner: alerta.mensajePartner,
    mensajeAuto:   alerta.mensajeAuto,
    segundosRestantes: Math.max(0, Math.round((alerta.expiresAt.getTime() - Date.now()) / 1000)),
  })
}

// ─── POST /api/pacto/alerta/:id/responder (public — partner responds) ─────────
export async function responderAlerta(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  const { mensaje } = req.body as { mensaje: string }

  if (!mensaje?.trim()) { res.status(400).json({ error: 'Mensaje requerido' }); return }

  const alerta = await prisma.pactoAlerta.findUnique({ where: { id } })
  if (!alerta) { res.status(404).json({ error: 'Alerta no encontrada' }); return }
  if (alerta.estado !== 'esperando') { res.status(409).json({ error: 'La ventana ya cerró' }); return }
  if (new Date() > alerta.expiresAt) { res.status(410).json({ error: 'Tiempo agotado' }); return }

  await prisma.pactoAlerta.update({
    where: { id },
    data:  { estado: 'respondida', mensajePartner: mensaje.trim() },
  })

  res.json({ ok: true })
}

// ─── GET /api/pacto/alertas — history for user + asesor view ─────────────────
export async function getHistorialAlertas(req: AuthRequest, res: Response): Promise<void> {
  const alertas = await prisma.pactoAlerta.findMany({
    where:   { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
    take:    50,
    select: {
      id: true, tiposRiesgo: true, puntuacion: true, contexto: true,
      estado: true, mensajePartner: true, mensajeAuto: true, createdAt: true,
    },
  })
  res.json(alertas)
}

// ─── POST /api/pacto/push-subscription — update partner push sub ──────────────
export async function updatePushSubscription(req: Request, res: Response): Promise<void> {
  const { token, subscription } = req.body as {
    token: string
    subscription: webpush.PushSubscription
  }

  await prisma.pactoRelacion.update({
    where: { inviteToken: token },
    data:  { pushSubscription: subscription as unknown as Prisma.InputJsonValue },
  })

  res.json({ ok: true })
}

// ─── Called internally after a transaction is saved ──────────────────────────
export async function triggerPactoAlerta(
  userId:    string,
  userName:  string,
  result:    import('../lib/riskDetection').RiskResult,
  mensajeAuto: string,
): Promise<{ alertaId: string } | null> {
  const pacto = await prisma.pactoRelacion.findUnique({ where: { userId } })
  if (!pacto || pacto.estado !== 'activo') return null

  const expiresAt = new Date(Date.now() + WINDOW_SECS * 1000)

  const alerta = await prisma.pactoAlerta.create({
    data: {
      userId,
      pactoId:    pacto.id,
      tiposRiesgo: result.signals.map(s => s.tipo),
      puntuacion:  result.puntuacion,
      contexto:    result.contexto as any,
      mensajeAuto,
      expiresAt,
    },
  })

  // Send push to partner (human mode only)
  if (pacto.modo === 'humano' && pacto.pushSubscription) {
    const sub = pacto.pushSubscription as unknown as webpush.PushSubscription
    enviarNotificacionPartner(sub, {
      alertaId:   alerta.id,
      userName,
      monto:      result.contexto.monto,
      categoria:  result.contexto.categoria,
      descripcion: result.contexto.descripcion,
      porcentajePresupuesto: result.contexto.porcentajePresupuesto,
      nComprasHoy: result.contexto.nComprasHoy,
      responderUrl: `${FRONTEND_URL}/pacto/responder?alertaId=${alerta.id}`,
    }).catch(console.error)
  }

  return { alertaId: alerta.id }
}
