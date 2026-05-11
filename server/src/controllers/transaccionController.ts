import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { sendPushToUser } from '../services/pushService'
import { evaluarRiesgo, generarMensajeIA } from '../services/riesgoService'

const formatCurrency = (n: number) => '$' + Math.round(n).toLocaleString('es-CO')

export async function createTransaccion(req: AuthRequest, res: Response): Promise<void> {
  const { monto, categoria, descripcion, fecha, metodoPago, comprobante } = req.body

  if (!monto || !categoria) {
    res.status(400).json({ error: 'Monto y categoría son requeridos' })
    return
  }

  const transaccion = await prisma.transaccion.create({
    data: {
      userId: req.userId!,
      monto: Number(monto),
      categoria,
      descripcion,
      fecha: fecha ? new Date(fecha) : new Date(),
      metodoPago,
      comprobante,
    },
  })

  // Update active weekly goal
  const activeMeta = await prisma.meta.findFirst({
    where: {
      userId: req.userId!,
      activa: true,
      tipoMeta: 'SEMANAL',
      fechaInicio: { lte: transaccion.fecha },
      fechaFin: { gte: transaccion.fecha },
    },
  })

  if (activeMeta) {
    const prevGastado = activeMeta.montoGastado
    const newGastado  = prevGastado + Number(monto)

    await prisma.meta.update({
      where: { id: activeMeta.id },
      data: { montoGastado: { increment: Number(monto) } },
    })

    // Alert at 75% threshold (fire only once when crossing it)
    const threshold = 0.75
    const prevPct = prevGastado / activeMeta.montoObjetivo
    const newPct  = newGastado  / activeMeta.montoObjetivo

    if (prevPct < threshold && newPct >= threshold && newPct < 1) {
      const remaining = Math.round(activeMeta.montoObjetivo - newGastado)
      sendPushToUser(req.userId!, {
        title: '⚠️ Vas por el 75% de tu presupuesto',
        body: `Te quedan $${remaining.toLocaleString('es-CO')} para el resto de la semana. Lleva el ritmo.`,
        url: '/dashboard',
      }).catch(console.error)
    }

    // Alert when budget exceeded
    if (prevPct < 1 && newPct >= 1) {
      sendPushToUser(req.userId!, {
        title: '🚨 Superaste tu presupuesto semanal',
        body: 'Revisemos juntos qué pasó esta semana. Abre tu resumen.',
        url: '/weekly',
      }).catch(console.error)
    }
  }

  // ── PACTO risk evaluation ──────────────────────────────────────────────────
  let riesgo: { nivel: string; razonesRiesgo: string[]; alertaId?: string } | null = null
  try {
    const resultado = await evaluarRiesgo(req.userId!, Number(monto), categoria)

    if (resultado.nivel !== 'bajo') {
      riesgo = { nivel: resultado.nivel, razonesRiesgo: resultado.razonesRiesgo }

      // Only create alerta + notify ALL accepted partners on 'alto' risk
      if (resultado.nivel === 'alto') {
        const partners = await prisma.pactoPartner.findMany({
          where: { userId: req.userId!, activo: true, estado: 'aceptado' },
          include: { user: { select: { nombre: true } } },
        })

        const partner = partners[0] // use first for alertaId return; all get notified below
        if (partner) {
          // Get weekly spent for AI context
          const weekStart = new Date()
          weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
          weekStart.setHours(0, 0, 0, 0)
          const weekTx = await prisma.transaccion.findMany({
            where: { userId: req.userId!, fecha: { gte: weekStart } },
          })
          const weeklySpent = weekTx.reduce((s, t) => s + t.monto, 0)

          const meta = await prisma.meta.findFirst({
            where: {
              userId: req.userId!,
              activa: true,
              tipoMeta: 'SEMANAL',
              fechaInicio: { lte: new Date() },
              fechaFin: { gte: new Date() },
            },
          })

          // Generate AI message (async, don't block response)
          const mensajeIA = await generarMensajeIA({
            userNombre: partner.user.nombre,
            partnerNombre: partner.nombre,
            monto: Number(monto),
            categoria,
            razonesRiesgo: resultado.razonesRiesgo,
            weeklySpent,
            presupuesto: meta?.montoObjetivo ?? 0,
          }).catch(() => '')

          const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 min TTL
          const alerta = await prisma.pactoAlerta.create({
            data: {
              partnerId: partner.id,
              userId: req.userId!,
              monto: Number(monto),
              categoria,
              descripcion: descripcion ?? null,
              nivelRiesgo: resultado.nivel,
              razonesRiesgo: resultado.razonesRiesgo,
              mensajeIA,
              expiresAt,
            },
          })

          riesgo.alertaId = alerta.id

          // Notify all accepted partners that have a PULSO account
          for (const p of partners) {
            if (p.partnerUserId) {
              sendPushToUser(p.partnerUserId, {
                title: '🤝 PACTO — gasto de riesgo',
                body: `${partner.user.nombre} está por gastar ${formatCurrency(Number(monto))} en ${categoria}. ¿Qué le dices?`,
                url: `/pacto`,
              }).catch(console.error)
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[PACTO] risk eval error:', err)
  }

  res.status(201).json({ transaccion, riesgo })
}

export async function deleteTransaccion(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params
  const tx = await prisma.transaccion.findFirst({ where: { id, userId: req.userId! } })
  if (!tx) { res.status(404).json({ error: 'Transacción no encontrada' }); return }

  await prisma.transaccion.delete({ where: { id } })

  // Roll back the meta if applicable
  if (tx.monto > 0) {
    const meta = await prisma.meta.findFirst({
      where: {
        userId: req.userId!,
        activa: true,
        tipoMeta: 'SEMANAL',
        fechaInicio: { lte: tx.fecha },
        fechaFin: { gte: tx.fecha },
      },
    })
    if (meta) {
      await prisma.meta.update({
        where: { id: meta.id },
        data: { montoGastado: { decrement: tx.monto } },
      })
    }
  }

  res.json({ ok: true })
}

export async function getTransacciones(req: AuthRequest, res: Response): Promise<void> {
  const { limit = '20', offset = '0', categoria, desde, hasta } = req.query

  const where: Record<string, unknown> = { userId: req.userId! }

  if (categoria) where.categoria = categoria
  if (desde || hasta) {
    where.fecha = {
      ...(desde ? { gte: new Date(desde as string) } : {}),
      ...(hasta ? { lte: new Date(hasta as string) } : {}),
    }
  }

  const [transacciones, total] = await Promise.all([
    prisma.transaccion.findMany({
      where,
      orderBy: { fecha: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    }),
    prisma.transaccion.count({ where }),
  ])

  res.json({ transacciones, total, limit: Number(limit), offset: Number(offset) })
}

export async function getWeeklySummary(req: AuthRequest, res: Response): Promise<void> {
  const { semana } = req.query

  let startDate: Date
  let endDate: Date

  if (semana) {
    // semana = ISO week start date e.g. "2024-01-15"
    startDate = new Date(semana as string)
    startDate.setHours(0, 0, 0, 0)
  } else {
    startDate = new Date()
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1)
    startDate.setHours(0, 0, 0, 0)
  }

  endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)
  endDate.setHours(23, 59, 59, 999)

  const transacciones = await prisma.transaccion.findMany({
    where: {
      userId: req.userId!,
      fecha: { gte: startDate, lte: endDate },
    },
    orderBy: { fecha: 'asc' },
  })

  // Daily breakdown
  const dailyMap: Record<string, number> = {}
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    const key = d.toISOString().split('T')[0]
    dailyMap[key] = 0
  }
  for (const t of transacciones) {
    const key = t.fecha.toISOString().split('T')[0]
    if (key in dailyMap) dailyMap[key] += t.monto
  }

  // Category breakdown
  const categoryMap: Record<string, number> = {}
  for (const t of transacciones) {
    categoryMap[t.categoria] = (categoryMap[t.categoria] ?? 0) + t.monto
  }

  const total = transacciones.reduce((s, t) => s + t.monto, 0)

  res.json({
    semanaInicio: startDate.toISOString(),
    semanaFin: endDate.toISOString(),
    total,
    transacciones,
    dailyBreakdown: Object.entries(dailyMap).map(([fecha, monto]) => ({ fecha, monto })),
    categoryBreakdown: Object.entries(categoryMap)
      .map(([categoria, monto]) => ({ categoria, monto, porcentaje: total > 0 ? (monto / total) * 100 : 0 }))
      .sort((a, b) => b.monto - a.monto),
  })
}
