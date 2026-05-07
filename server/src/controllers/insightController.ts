import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { generateWeeklyInsights } from '../lib/openai'

export async function generateInsights(req: AuthRequest, res: Response): Promise<void> {
  const { semanaInicio } = req.body

  let startDate: Date
  if (semanaInicio) {
    startDate = new Date(semanaInicio)
    startDate.setHours(0, 0, 0, 0)
  } else {
    startDate = new Date()
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1)
    startDate.setHours(0, 0, 0, 0)
  }

  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)
  endDate.setHours(23, 59, 59, 999)

  const [transacciones, activeMeta] = await Promise.all([
    prisma.transaccion.findMany({
      where: {
        userId: req.userId!,
        fecha: { gte: startDate, lte: endDate },
      },
      orderBy: { fecha: 'asc' },
    }),
    prisma.meta.findFirst({
      where: {
        userId: req.userId!,
        activa: true,
        tipoMeta: 'SEMANAL',
        fechaInicio: { lte: endDate },
        fechaFin: { gte: startDate },
      },
    }),
  ])

  const presupuesto = activeMeta?.montoObjetivo ?? 700

  const insights = await generateWeeklyInsights(transacciones, presupuesto)

  res.json({
    insights,
    semanaInicio: startDate.toISOString(),
    semanaFin: endDate.toISOString(),
    totalTransacciones: transacciones.length,
    totalGastado: transacciones.reduce((s, t) => s + t.monto, 0),
    presupuesto,
  })
}
