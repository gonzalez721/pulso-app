import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { sendSessionConfirmation, sendSessionNotificationAsesor, sendSessionCancellation, sendSessionCancellationAsesor } from '../lib/resend'
import { createGoogleMeetSession, deleteGoogleCalendarEvent } from '../lib/googleMeet'

export async function getSesiones(req: AuthRequest, res: Response): Promise<void> {
  const sesiones = await prisma.sesion.findMany({
    where: { userId: req.userId! },
    include: { asesor: true, observaciones: true },
    orderBy: { fechaHora: 'desc' },
  })
  res.json(sesiones)
}

export async function getDisponibilidad(req: AuthRequest, res: Response): Promise<void> {
  const { fecha } = req.query

  const asesores = await prisma.asesor.findMany({
    where: { activo: true },
    select: {
      id: true, nombre: true, carrera: true, semestre: true,
      bio: true, fotoUrl: true, disponibilidad: true,
    },
  })

  if (!fecha) { res.json(asesores); return }

  const targetDate = new Date(fecha as string)
  const dayNames   = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const dayName    = dayNames[targetDate.getDay()]

  const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0)
  const endOfDay   = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999)

  const sesionesDelDia = await prisma.sesion.findMany({
    where: { fechaHora: { gte: startOfDay, lte: endOfDay }, estado: { not: 'cancelada' } },
    select: { asesorId: true, fechaHora: true },
  })

  const occupied: Record<string, Set<string>> = {}
  for (const s of sesionesDelDia) {
    if (!occupied[s.asesorId]) occupied[s.asesorId] = new Set()
    occupied[s.asesorId].add(
      s.fechaHora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
    )
  }

  const result = asesores.map((asesor) => {
    const disponibilidad = asesor.disponibilidad as Array<{ dia: string; horas: string[] }>
    const daySlots = disponibilidad.find((d) => d.dia === dayName)
    const horasDisponibles = (daySlots?.horas ?? []).filter((h) => !occupied[asesor.id]?.has(h))
    return { ...asesor, horasDisponibles }
  })

  res.json(result)
}

export async function bookSesion(req: AuthRequest, res: Response): Promise<void> {
  try {
  const { asesorId, fechaHora, temasAgenda } = req.body

  if (!asesorId || !fechaHora) {
    res.status(400).json({ error: 'Asesor y fecha/hora son requeridos' }); return
  }

  const [asesor, student] = await Promise.all([
    prisma.asesor.findUnique({ where: { id: asesorId } }),
    prisma.user.findUnique({ where: { id: req.userId! } }),
  ])

  if (!asesor) { res.status(404).json({ error: 'Asesor no encontrado' }); return }
  if (!student) { res.status(404).json({ error: 'Usuario no encontrado' }); return }

  const fecha = new Date(fechaHora)

  const conflicto = await prisma.sesion.findFirst({
    where: { asesorId, fechaHora: fecha, estado: { not: 'cancelada' } },
  })
  if (conflicto) { res.status(409).json({ error: 'El horario ya está ocupado' }); return }

  // Create Google Meet event
  const temas: string[] = temasAgenda ?? []
  const { linkMeet, googleCalendarEventId } = await createGoogleMeetSession({
    titulo: `PULSO: ${student.nombre} × ${asesor.nombre}`,
    descripcion: [
      `Sesión de asesoría financiera PULSO de 20 minutos.`,
      temas.length ? `Temas: ${temas.join(', ')}.` : '',
      `Estudiante: ${student.nombre} (${student.email})`,
      `Asesor: ${asesor.nombre} (${asesor.email})`,
    ].filter(Boolean).join('\n'),
    fechaInicio: fecha,
    duracionMin: 20,
    asesorEmail: asesor.email,
    estudianteEmail: student.email,
    asesorNombre: asesor.nombre,
    estudianteNombre: student.nombre,
  })

  const sesion = await prisma.sesion.create({
    data: {
      userId: req.userId!,
      asesorId,
      fechaHora: fecha,
      estado: 'programada',
      linkMeet,
      googleCalendarEventId,
      temasAgenda: temas,
    },
    include: { asesor: true },
  })

  // Confirmation email to student (non-blocking)
  sendSessionConfirmation({
    to: student.email,
    userName: student.nombre,
    asesorName: asesor.nombre,
    fechaHora: fecha,
    linkMeet: linkMeet,
    temas,
  }).catch((e) => console.error('[Resend] confirm student:', e.message))

  // Notification email to asesor (non-blocking)
  sendSessionNotificationAsesor({
    to: asesor.email,
    asesorName: asesor.nombre,
    studentName: student.nombre,
    studentEmail: student.email,
    fechaHora: fecha,
    linkMeet: linkMeet,
    temas,
  }).catch((e) => console.error('[Resend] notify asesor:', e.message))

  res.status(201).json(sesion)
  } catch (err) {
    console.error('bookSesion error:', err)
    res.status(500).json({ error: 'Error al crear la sesión' })
  }
}

export async function cancelSesion(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params

  const sesion = await prisma.sesion.findFirst({
    where: { id, userId: req.userId! },
    include: { asesor: true },
  })

  if (!sesion) { res.status(404).json({ error: 'Sesión no encontrada' }); return }
  if (sesion.estado === 'cancelada') { res.status(400).json({ error: 'Ya está cancelada' }); return }

  const updated = await prisma.sesion.update({
    where: { id },
    data: { estado: 'cancelada' },
    include: { asesor: true },
  })

  // Remove Google Calendar event
  if (sesion.googleCalendarEventId) {
    deleteGoogleCalendarEvent(sesion.googleCalendarEventId).catch(() => {})
  }

  const student = await prisma.user.findUnique({ where: { id: req.userId! } })
  if (student) {
    sendSessionCancellation({
      to: student.email,
      userName: student.nombre,
      asesorName: sesion.asesor.nombre,
      fechaHora: sesion.fechaHora,
    }).catch((e) => console.error('[Resend] cancel student:', e.message))

    sendSessionCancellationAsesor({
      to: sesion.asesor.email,
      asesorName: sesion.asesor.nombre,
      studentName: student.nombre,
      fechaHora: sesion.fechaHora,
    }).catch((e) => console.error('[Resend] cancel asesor:', e.message))
  }

  res.json(updated)
}
