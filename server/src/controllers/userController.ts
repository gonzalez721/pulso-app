import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { generateUserProfileSummary } from '../lib/openai'

export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      email: true,
      nombre: true,
      universidad: true,
      semestre: true,
      mensualidadMensual: true,
      appsPago: true,
      onboardingComplete: true,
      createdAt: true,
      perfil: true,
    },
  })

  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' })
    return
  }

  res.json(user)
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  const {
    nombre,
    universidad,
    semestre,
    mensualidadMensual,
    appsPago,
    onboardingComplete,
    objetivo,
    categoriasGasto,
    dificultadesReportadas,
    presupuestoSemanal,
  } = req.body

  // Update user base fields
  const updatedUser = await prisma.user.update({
    where: { id: req.userId },
    data: {
      ...(nombre !== undefined && { nombre }),
      ...(universidad !== undefined && { universidad }),
      ...(semestre !== undefined && { semestre: Number(semestre) }),
      ...(mensualidadMensual !== undefined && { mensualidadMensual: Number(mensualidadMensual) }),
      ...(appsPago !== undefined && { appsPago }),
      ...(onboardingComplete !== undefined && { onboardingComplete }),
    },
    select: {
      id: true,
      email: true,
      nombre: true,
      universidad: true,
      semestre: true,
      mensualidadMensual: true,
      appsPago: true,
      onboardingComplete: true,
    },
  })

  // Update or create perfil
  if (objetivo || categoriasGasto || dificultadesReportadas) {
    let resumenIA: string | undefined

    // Generate AI summary when completing onboarding
    if (onboardingComplete && objetivo) {
      try {
        resumenIA = await generateUserProfileSummary({
          objetivo,
          categorias: categoriasGasto ? Object.keys(categoriasGasto) : [],
          dificultades: dificultadesReportadas ?? [],
          presupuesto: presupuestoSemanal ?? 0,
        })
      } catch {
        // Non-critical
      }
    }

    await prisma.perfilFinanciero.upsert({
      where: { userId: req.userId! },
      create: {
        userId: req.userId!,
        objetivo,
        categoriasGasto: categoriasGasto ?? {},
        dificultadesReportadas: dificultadesReportadas ?? [],
        preferencias: {},
        resumenIA,
      },
      update: {
        ...(objetivo !== undefined && { objetivo }),
        ...(categoriasGasto !== undefined && { categoriasGasto }),
        ...(dificultadesReportadas !== undefined && { dificultadesReportadas }),
        ...(resumenIA !== undefined && { resumenIA }),
      },
    })

    // Create weekly goal on onboarding complete
    if (onboardingComplete && presupuestoSemanal) {
      const now = new Date()
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay() + 1)
      startOfWeek.setHours(0, 0, 0, 0)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)

      const existingMeta = await prisma.meta.findFirst({
        where: { userId: req.userId!, activa: true, tipoMeta: 'SEMANAL' },
      })

      if (!existingMeta) {
        await prisma.meta.create({
          data: {
            userId: req.userId!,
            tipoMeta: 'SEMANAL',
            montoObjetivo: Number(presupuestoSemanal),
            fechaInicio: startOfWeek,
            fechaFin: endOfWeek,
          },
        })
      }
    }
  }

  res.json(updatedUser)
}
