import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export async function saveMood(req: AuthRequest, res: Response): Promise<void> {
  const { mood, nota } = req.body

  if (!mood) {
    res.status(400).json({ error: 'Mood es requerido' })
    return
  }

  const checkin = await prisma.moodCheckin.create({
    data: { userId: req.userId!, mood, nota },
  })

  res.status(201).json(checkin)
}

export async function getMoods(req: AuthRequest, res: Response): Promise<void> {
  const { limit = '7' } = req.query

  const moods = await prisma.moodCheckin.findMany({
    where: { userId: req.userId! },
    orderBy: { fecha: 'desc' },
    take: Number(limit),
  })

  res.json(moods)
}
