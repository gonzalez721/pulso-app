import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { signAccessToken, signRefreshToken, saveRefreshToken, verifyRefreshToken, isRefreshTokenValid, revokeRefreshToken } from '../lib/jwt'
import { AsesorRequest } from '../middleware/asesorAuth'
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendSessionSummaryStudent, sendSessionSummaryAsesor } from '../lib/resend'

const CLIENT_URL = process.env.FRONTEND_URL ?? 'https://client-silk-one.vercel.app'

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function createVerificationToken(userId: string, type: 'email_verify' | 'password_reset') {
  await prisma.verificationToken.deleteMany({ where: { userId, type } })
  const code = generateOTP()
  const hours = type === 'email_verify' ? 24 : 1
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000)
  await prisma.verificationToken.create({ data: { userId, token: code, type, expiresAt } })
  return code
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export async function asesorRegister(req: Request, res: Response): Promise<void> {
  const { email, password, nombre, carrera, semestre, bio } = req.body

  if (!email || !password || !nombre || !carrera || !semestre) {
    res.status(400).json({ error: 'Email, contraseña, nombre, carrera y semestre son requeridos' })
    return
  }

  if (!email.toLowerCase().endsWith('.edu.co')) {
    res.status(400).json({ error: 'Debes usar tu correo institucional (.edu.co)' })
    return
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' })
    return
  }

  const exists = await prisma.asesor.findUnique({ where: { email: email.toLowerCase() } })
  if (exists) {
    res.status(409).json({ error: 'El email ya está registrado como asesor' })
    return
  }

  const hashed = await bcrypt.hash(password, 10)
  const asesor = await prisma.asesor.create({
    data: {
      email: email.toLowerCase(),
      password: hashed,
      nombre,
      carrera,
      semestre: Number(semestre),
      bio: bio || null,
      emailVerified: false,
    },
    select: { id: true, email: true, nombre: true, carrera: true, semestre: true, bio: true, fotoUrl: true },
  })

  // Send 6-digit verification code
  const code = await createVerificationToken(asesor.id, 'email_verify')
  sendVerificationEmail({ to: asesor.email, nombre: asesor.nombre, code, role: 'mentor' })
    .catch((e) => console.error('[Resend] verify mentor:', e.message))

  const payload = { userId: asesor.id, email: asesor.email, role: 'asesor' } as any
  const accessToken  = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)
  await saveRefreshToken(asesor.id, refreshToken)

  res.status(201).json({ asesor, accessToken, refreshToken })
}

export async function asesorLogin(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body
  if (!email || !password) { res.status(400).json({ error: 'Email y contraseña requeridos' }); return }

  if (!email.toLowerCase().endsWith('.edu.co')) {
    res.status(400).json({ error: 'Debes usar tu correo institucional (.edu.co)' })
    return
  }

  const asesor = await prisma.asesor.findUnique({ where: { email: email.toLowerCase() } })
  if (!asesor || !asesor.password) { res.status(401).json({ error: 'Credenciales incorrectas' }); return }

  const valid = await bcrypt.compare(password, asesor.password)
  if (!valid) { res.status(401).json({ error: 'Credenciales incorrectas' }); return }


  const payload = { userId: asesor.id, email: asesor.email, role: 'asesor' } as any
  const accessToken  = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)
  await saveRefreshToken(asesor.id, refreshToken)

  res.json({
    asesor: {
      id: asesor.id, email: asesor.email, nombre: asesor.nombre,
      carrera: asesor.carrera, semestre: asesor.semestre,
      bio: asesor.bio, fotoUrl: asesor.fotoUrl,
      emailVerified: asesor.emailVerified,
    },
    accessToken,
    refreshToken,
  })
}

export async function asesorVerifyCode(req: Request, res: Response): Promise<void> {
  const { email, code } = req.body
  if (!email || !code) { res.status(400).json({ error: 'Email y código son requeridos' }); return }

  const asesor = await prisma.asesor.findUnique({ where: { email: email.toLowerCase() } })
  if (!asesor) { res.status(400).json({ error: 'Código inválido' }); return }

  if (asesor.emailVerified) {
    res.json({ message: 'Tu correo ya está verificado.' })
    return
  }

  const record = await prisma.verificationToken.findFirst({
    where: { userId: asesor.id, type: 'email_verify' },
  })
  if (!record || record.token !== code.toString().trim()) {
    res.status(400).json({ error: 'Código incorrecto. Revisa tu correo e intenta de nuevo.' }); return
  }
  if (record.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { id: record.id } })
    res.status(400).json({ error: 'El código ha expirado. Solicita uno nuevo.' }); return
  }

  const updated = await prisma.asesor.update({
    where: { id: asesor.id },
    data: { emailVerified: true },
    select: { id: true, email: true, nombre: true, carrera: true, semestre: true, bio: true, fotoUrl: true, emailVerified: true },
  })
  await prisma.verificationToken.delete({ where: { id: record.id } })

  sendWelcomeEmail({ to: updated.email, nombre: updated.nombre, role: 'mentor' }).catch(console.error)

  res.json({ message: '¡Correo verificado!', asesor: updated })
}

export async function asesorResendVerification(req: Request, res: Response): Promise<void> {
  const { email } = req.body
  if (!email) { res.status(400).json({ error: 'Email requerido' }); return }

  const asesor = await prisma.asesor.findUnique({ where: { email: email.toLowerCase() } })
  if (!asesor) { res.json({ message: 'Si el correo existe, recibirás un nuevo código.' }); return }
  if (asesor.emailVerified) { res.json({ message: 'Tu correo ya está verificado.' }); return }

  const code = await createVerificationToken(asesor.id, 'email_verify')
  sendVerificationEmail({ to: asesor.email, nombre: asesor.nombre, code, role: 'mentor' }).catch(console.error)
  res.json({ message: 'Código de verificación enviado.' })
}

export async function asesorForgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body
  if (!email) { res.status(400).json({ error: 'Email requerido' }); return }

  const asesor = await prisma.asesor.findUnique({ where: { email: email.toLowerCase() } })
  if (asesor) {
    const code = await createVerificationToken(asesor.id, 'password_reset')
    sendPasswordResetEmail({ to: asesor.email, nombre: asesor.nombre, code }).catch(console.error)
  }
  res.json({ message: 'Si el correo está registrado, recibirás un código para restablecer tu contraseña.' })
}

export async function asesorResetPassword(req: Request, res: Response): Promise<void> {
  const { email, code, password } = req.body
  if (!email || !code || !password) {
    res.status(400).json({ error: 'Email, código y contraseña son requeridos' }); return
  }
  if (password.length < 8) { res.status(400).json({ error: 'Mínimo 8 caracteres' }); return }

  const asesor = await prisma.asesor.findUnique({ where: { email: email.toLowerCase() } })
  if (!asesor) { res.status(400).json({ error: 'Código inválido' }); return }

  const record = await prisma.verificationToken.findFirst({
    where: { userId: asesor.id, type: 'password_reset' },
  })
  if (!record || record.token !== code.toString().trim()) {
    res.status(400).json({ error: 'Código incorrecto' }); return
  }
  if (record.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { id: record.id } })
    res.status(400).json({ error: 'El código ha expirado. Solicita uno nuevo.' }); return
  }

  const hashed = await bcrypt.hash(password, 10)
  await prisma.asesor.update({ where: { id: asesor.id }, data: { password: hashed } })
  await prisma.verificationToken.delete({ where: { id: record.id } })
  res.json({ message: 'Contraseña actualizada correctamente.' })
}

export async function asesorRefresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body
  if (!refreshToken) { res.status(400).json({ error: 'Refresh token requerido' }); return }
  try {
    const valid = await isRefreshTokenValid(refreshToken)
    if (!valid) { res.status(401).json({ error: 'Refresh token inválido' }); return }

    const payload = verifyRefreshToken(refreshToken) as any
    await revokeRefreshToken(refreshToken)
    const newAccess  = signAccessToken(payload)
    const newRefresh = signRefreshToken(payload)
    await saveRefreshToken(payload.userId, newRefresh)
    res.json({ accessToken: newAccess, refreshToken: newRefresh })
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
}

// ─── Dashboard ─────────────────────────────────────────────────────────────

export async function getAsesorProfile(req: AsesorRequest, res: Response): Promise<void> {
  const asesor = await prisma.asesor.findUnique({
    where: { id: req.asesorId },
    select: { id: true, email: true, nombre: true, carrera: true, semestre: true, bio: true, fotoUrl: true, disponibilidad: true },
  })
  if (!asesor) { res.status(404).json({ error: 'Asesor no encontrado' }); return }
  res.json(asesor)
}

export async function getAsesorSesiones(req: AsesorRequest, res: Response): Promise<void> {
  const { estado } = req.query

  const sesiones = await prisma.sesion.findMany({
    where: {
      asesorId: req.asesorId!,
      ...(estado ? { estado: estado as string } : {}),
    },
    include: {
      user: {
        select: {
          id: true, nombre: true, email: true, universidad: true, semestre: true,
          perfil: {
            select: { objetivo: true, resumenIA: true, categoriasGasto: true, dificultadesReportadas: true },
          },
        },
      },
      observaciones: true,
    },
    orderBy: { fechaHora: 'asc' },
  })

  res.json(sesiones)
}

// ─── Student stats (for advisor view) ──────────────────────────────────────

export async function getEstudianteStats(req: AsesorRequest, res: Response): Promise<void> {
  const { userId } = req.params

  // Verify the asesor has at least one session with this student
  const sesionRelacion = await prisma.sesion.findFirst({
    where: { asesorId: req.asesorId!, userId },
  })
  if (!sesionRelacion) { res.status(403).json({ error: 'No tienes sesiones con este estudiante' }); return }

  const [student, metas, todasTx] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, nombre: true, email: true, universidad: true, semestre: true,
        mensualidadMensual: true, createdAt: true,
        perfil: true,
      },
    }),
    prisma.meta.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 4 }),
    prisma.transaccion.findMany({
      where: { userId, fecha: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      orderBy: { fecha: 'desc' },
    }),
  ])

  if (!student) { res.status(404).json({ error: 'Estudiante no encontrado' }); return }

  // Weekly breakdown (last 4 weeks)
  const semanas: Array<{ label: string; total: number; presupuesto: number }> = []
  for (let w = 3; w >= 0; w--) {
    const start = new Date(); start.setDate(start.getDate() - start.getDay() + 1 - w * 7); start.setHours(0, 0, 0, 0)
    const end   = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999)
    const txWeek = todasTx.filter((t) => t.fecha >= start && t.fecha <= end)
    const metaWeek = metas.find((m) => m.fechaInicio <= end && m.fechaFin >= start)
    semanas.push({
      label: `Sem ${4 - w}`,
      total: txWeek.reduce((s, t) => s + t.monto, 0),
      presupuesto: metaWeek?.montoObjetivo ?? 700,
    })
  }

  // Category breakdown (last 30 days)
  const byCategory: Record<string, number> = {}
  for (const t of todasTx) byCategory[t.categoria] = (byCategory[t.categoria] ?? 0) + t.monto
  const totalMes = todasTx.reduce((s, t) => s + t.monto, 0)
  const categoryBreakdown = Object.entries(byCategory)
    .map(([categoria, monto]) => ({ categoria, monto, porcentaje: totalMes > 0 ? (monto / totalMes) * 100 : 0 }))
    .sort((a, b) => b.monto - a.monto)

  // Mood data
  const moods = await prisma.moodCheckin.findMany({
    where: { userId, fecha: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
    orderBy: { fecha: 'desc' },
    take: 14,
  })

  const metaActiva = metas.find((m) => m.activa && m.tipoMeta === 'SEMANAL')

  res.json({
    student,
    metaActiva,
    totalMes,
    semanas,
    categoryBreakdown,
    transaccionesRecientes: todasTx.slice(0, 10),
    moods,
    alertas: buildAlertas(todasTx, metaActiva),
  })
}

function buildAlertas(
  txs: Array<{ monto: number; categoria: string; fecha: Date }>,
  meta: { montoObjetivo: number; montoGastado: number } | undefined
): Array<{ tipo: 'warning' | 'danger' | 'info'; mensaje: string }> {
  const alertas: Array<{ tipo: 'warning' | 'danger' | 'info'; mensaje: string }> = []

  if (meta && meta.montoGastado > meta.montoObjetivo) {
    alertas.push({ tipo: 'danger', mensaje: `Superó su presupuesto semanal en $${(meta.montoGastado - meta.montoObjetivo).toFixed(0)}` })
  } else if (meta && meta.montoGastado > meta.montoObjetivo * 0.85) {
    alertas.push({ tipo: 'warning', mensaje: `Está al ${Math.round((meta.montoGastado / meta.montoObjetivo) * 100)}% de su presupuesto semanal` })
  }

  const entTx = txs.filter((t) => t.categoria === 'Entretenimiento')
  const entTotal = entTx.reduce((s, t) => s + t.monto, 0)
  if (entTotal > 400) {
    alertas.push({ tipo: 'warning', mensaje: `Gasto alto en entretenimiento: $${entTotal.toFixed(0)} este mes` })
  }

  const uniqueDays = new Set(txs.map((t) => t.fecha.toDateString()))
  if (uniqueDays.size < 3 && txs.length > 0) {
    alertas.push({ tipo: 'info', mensaje: 'Registra gastos con poca frecuencia — puede perder trazabilidad' })
  }

  return alertas
}

// ─── Availability ──────────────────────────────────────────────────────────

export async function updateDisponibilidad(req: AsesorRequest, res: Response): Promise<void> {
  const { disponibilidad } = req.body

  if (!Array.isArray(disponibilidad)) {
    res.status(400).json({ error: 'disponibilidad debe ser un arreglo' }); return
  }

  // Validate structure: [{ dia: string, horas: string[] }]
  const DIAS_VALIDOS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  for (const slot of disponibilidad) {
    if (!slot.dia || !DIAS_VALIDOS.includes(slot.dia)) {
      res.status(400).json({ error: `Día inválido: ${slot.dia}` }); return
    }
    if (!Array.isArray(slot.horas)) {
      res.status(400).json({ error: 'horas debe ser un arreglo' }); return
    }
  }

  const updated = await prisma.asesor.update({
    where: { id: req.asesorId! },
    data: { disponibilidad },
    select: { id: true, disponibilidad: true },
  })

  res.json(updated)
}

// ─── Asesor saves observations after session ───────────────────────────────

export async function saveObservacion(req: AsesorRequest, res: Response): Promise<void> {
  const { sesionId } = req.params
  const { temasDiscutidos, patronesIdentificados, compromisosProximaSemana, notasImportantes } = req.body

  const sesion = await prisma.sesion.findFirst({
    where: { id: sesionId, asesorId: req.asesorId! },
    include: {
      user: { select: { nombre: true, email: true } },
      asesor: { select: { nombre: true, email: true } },
    },
  })
  if (!sesion) { res.status(404).json({ error: 'Sesión no encontrada' }); return }

  const temas       = temasDiscutidos          ?? []
  const patrones    = patronesIdentificados    ?? []
  const compromisos = compromisosProximaSemana ?? []

  const obs = await prisma.observacion.upsert({
    where: { sesionId },
    create: { sesionId, temasDiscutidos: temas, patronesIdentificados: patrones, compromisosProximaSemana: compromisos, notasImportantes },
    update: { temasDiscutidos: temas, patronesIdentificados: patrones, compromisosProximaSemana: compromisos, notasImportantes },
  })

  // Mark session as completed
  await prisma.sesion.update({ where: { id: sesionId }, data: { estado: 'completada' } })

  // Summary emails — non-blocking
  sendSessionSummaryStudent({
    to: sesion.user.email,
    studentName: sesion.user.nombre,
    asesorName: sesion.asesor.nombre,
    fechaHora: sesion.fechaHora,
    temasDiscutidos: temas,
    compromisosProximaSemana: compromisos,
    patronesIdentificados: patrones,
    notasImportantes,
  }).catch(() => {})

  sendSessionSummaryAsesor({
    to: sesion.asesor.email,
    asesorName: sesion.asesor.nombre,
    studentName: sesion.user.nombre,
    fechaHora: sesion.fechaHora,
    temasDiscutidos: temas,
    compromisosProximaSemana: compromisos,
    patronesIdentificados: patrones,
    notasImportantes,
  }).catch(() => {})

  res.json(obs)
}
