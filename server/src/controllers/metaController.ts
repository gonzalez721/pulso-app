import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export async function createMeta(req: AuthRequest, res: Response): Promise<void> {
  const { tipoMeta, montoObjetivo, fechaInicio, fechaFin } = req.body

  if (!tipoMeta || !montoObjetivo || !fechaInicio || !fechaFin) {
    res.status(400).json({ error: 'Tipo, monto, fecha inicio y fecha fin son requeridos' })
    return
  }

  // Deactivate existing goals of same type if weekly
  if (tipoMeta === 'SEMANAL') {
    await prisma.meta.updateMany({
      where: { userId: req.userId!, tipoMeta: 'SEMANAL', activa: true },
      data: { activa: false },
    })
  }

  const meta = await prisma.meta.create({
    data: {
      userId: req.userId!,
      tipoMeta,
      montoObjetivo: Number(montoObjetivo),
      fechaInicio: new Date(fechaInicio),
      fechaFin: new Date(fechaFin),
    },
  })

  res.status(201).json(meta)
}

export async function getActiveMetas(req: AuthRequest, res: Response): Promise<void> {
  const metas = await prisma.meta.findMany({
    where: { userId: req.userId!, activa: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(metas)
}

export async function updateMeta(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params
  const { montoObjetivo, montoGastado, activa } = req.body

  const meta = await prisma.meta.findFirst({ where: { id, userId: req.userId! } })
  if (!meta) {
    res.status(404).json({ error: 'Meta no encontrada' })
    return
  }

  const updated = await prisma.meta.update({
    where: { id },
    data: {
      ...(montoObjetivo !== undefined && { montoObjetivo: Number(montoObjetivo) }),
      ...(montoGastado !== undefined && { montoGastado: Number(montoGastado) }),
      ...(activa !== undefined && { activa }),
    },
  })

  res.json(updated)
}
