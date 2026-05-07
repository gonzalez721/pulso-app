import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

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
    await prisma.meta.update({
      where: { id: activeMeta.id },
      data: { montoGastado: { increment: Number(monto) } },
    })
  }

  res.status(201).json(transaccion)
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
