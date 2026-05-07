import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const asesorPassword = await bcrypt.hash('asesor1234', 10)

  const asesores = await Promise.all([
    prisma.asesor.upsert({
      where: { email: 'sofia.ramirez@pulso.app' },
      update: { password: asesorPassword },
      create: {
        email: 'sofia.ramirez@pulso.app',
        password: asesorPassword,
        nombre: 'Sofía Ramírez',
        carrera: 'Administración de Empresas',
        semestre: 8,
        bio: 'Me apasiona ayudar a otros estudiantes a tomar control de sus finanzas. Especializada en presupuesto personal y ahorro universitario.',
        fotoUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=sofia&backgroundColor=ffd5dc',
        disponibilidad: [
          { dia: 'Lunes',    horas: ['09:00', '10:00', '11:00', '14:00', '15:00'] },
          { dia: 'Miércoles',horas: ['09:00', '10:00', '16:00', '17:00'] },
          { dia: 'Viernes',  horas: ['10:00', '11:00', '12:00'] },
        ],
        activo: true,
      },
    }),
    prisma.asesor.upsert({
      where: { email: 'carlos.mendez@pulso.app' },
      update: { password: asesorPassword },
      create: {
        email: 'carlos.mendez@pulso.app',
        password: asesorPassword,
        nombre: 'Carlos Méndez',
        carrera: 'Economía',
        semestre: 9,
        bio: 'Estudiante de economía con experiencia en finanzas personales. He ayudado a más de 30 estudiantes a reducir sus deudas.',
        fotoUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=carlos&backgroundColor=c0aede',
        disponibilidad: [
          { dia: 'Martes', horas: ['10:00', '11:00', '14:00', '15:00', '16:00'] },
          { dia: 'Jueves', horas: ['09:00', '10:00', '11:00', '17:00'] },
          { dia: 'Sábado', horas: ['09:00', '10:00', '11:00'] },
        ],
        activo: true,
      },
    }),
    prisma.asesor.upsert({
      where: { email: 'ana.torres@pulso.app' },
      update: { password: asesorPassword },
      create: {
        email: 'ana.torres@pulso.app',
        password: asesorPassword,
        nombre: 'Ana Torres',
        carrera: 'Contaduría Pública',
        semestre: 7,
        bio: 'Especializada en llevar registros financieros claros. Te enseño a entender a dónde va tu dinero cada mes.',
        fotoUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ana&backgroundColor=b6e3f4',
        disponibilidad: [
          { dia: 'Lunes',    horas: ['13:00', '14:00', '15:00', '16:00'] },
          { dia: 'Miércoles',horas: ['11:00', '12:00', '13:00'] },
          { dia: 'Viernes',  horas: ['13:00', '14:00', '15:00', '16:00'] },
        ],
        activo: true,
      },
    }),
  ])

  console.log(`✅ Created/updated ${asesores.length} asesores`)

  const hashedPassword = await bcrypt.hash('demo1234', 10)
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@pulso.app' },
    update: {},
    create: {
      email: 'demo@pulso.app',
      password: hashedPassword,
      nombre: 'Estudiante Demo',
      universidad: 'Universidad Nacional',
      semestre: 5,
      mensualidadMensual: 3000,
      appsPago: ['Mercado Pago', 'OXXO Pay'],
      onboardingComplete: true,
    },
  })

  await prisma.perfilFinanciero.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      objetivo: 'SPEND_SMARTER',
      categoriasGasto: { Comida: 40, Transporte: 15, Entretenimiento: 20, Estudios: 15, Salud: 10 },
      dificultadesReportadas: ['impulse_spending', 'tracking'],
      preferencias: { notificaciones: true, currency: 'MXN' },
      resumenIA: 'Estudiante enfocado en optimizar gastos de entretenimiento y comida. Tendencia a gastos impulsivos los fines de semana.',
    },
  })

  // Weekly goal
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1)
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  const existingMeta = await prisma.meta.findFirst({
    where: { userId: demoUser.id, activa: true, tipoMeta: 'SEMANAL' },
  })
  if (!existingMeta) {
    await prisma.meta.create({
      data: { userId: demoUser.id, tipoMeta: 'SEMANAL', montoObjetivo: 700, fechaInicio: startOfWeek, fechaFin: endOfWeek },
    })
  }

  // Sample transactions
  await prisma.transaccion.deleteMany({ where: { userId: demoUser.id } })
  const txSamples = [
    { monto: 85,  categoria: 'Comida',          descripcion: 'Comida cafetería',     diasAtras: 0 },
    { monto: 25,  categoria: 'Transporte',       descripcion: 'Uber al campus',       diasAtras: 0 },
    { monto: 150, categoria: 'Entretenimiento',  descripcion: 'Netflix + Spotify',    diasAtras: 1 },
    { monto: 45,  categoria: 'Comida',           descripcion: 'Antojitos con amigos', diasAtras: 1 },
    { monto: 30,  categoria: 'Transporte',       descripcion: 'Metro semanal',        diasAtras: 2 },
    { monto: 200, categoria: 'Estudios',         descripcion: 'Libros semestre',      diasAtras: 2 },
    { monto: 65,  categoria: 'Comida',           descripcion: 'Supermercado',         diasAtras: 3 },
    { monto: 120, categoria: 'Entretenimiento',  descripcion: 'Cine + cena',          diasAtras: 4 },
    { monto: 40,  categoria: 'Salud',            descripcion: 'Farmacia',             diasAtras: 4 },
    { monto: 90,  categoria: 'Comida',           descripcion: 'Comida + café',        diasAtras: 5 },
    { monto: 55,  categoria: 'Transporte',       descripcion: 'Gasolina',             diasAtras: 6 },
    { monto: 180, categoria: 'Entretenimiento',  descripcion: 'Concierto',            diasAtras: 7 },
    { monto: 70,  categoria: 'Comida',           descripcion: 'Comida semana pasada', diasAtras: 8 },
    { monto: 35,  categoria: 'Otros',            descripcion: 'Varios',               diasAtras: 9 },
  ]
  for (const t of txSamples) {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() - t.diasAtras)
    await prisma.transaccion.create({
      data: { userId: demoUser.id, monto: t.monto, categoria: t.categoria, descripcion: t.descripcion, fecha },
    })
  }

  // Create a sample session with the first asesor (Sofia)
  const sofia = asesores[0]
  const sesionFecha = new Date()
  sesionFecha.setDate(sesionFecha.getDate() + 2) // day after tomorrow
  sesionFecha.setHours(10, 0, 0, 0)

  const hash = crypto.createHash('sha256')
    .update(`${demoUser.email}-${sofia.email}-${sesionFecha.getTime()}`)
    .digest('hex').slice(0, 6)
  const mes = sesionFecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
    .replace(/ /g, '').replace('.', '').toLowerCase()
  const linkMeet = `https://meet.jit.si/pulso-sofia-ramirez-estudiante-demo-${mes}-${hash}`

  await prisma.sesion.deleteMany({ where: { userId: demoUser.id } })
  await prisma.sesion.create({
    data: {
      userId: demoUser.id,
      asesorId: sofia.id,
      fechaHora: sesionFecha,
      estado: 'programada' as const,
      linkMeet,
      temasAgenda: ['Control de gastos', 'Ahorro'],
    },
  })

  console.log(`✅ Demo user: demo@pulso.app / demo1234`)
  console.log(`✅ Asesores: sofia.ramirez@pulso.app / asesor1234`)
  console.log(`✅ ${txSamples.length} transacciones + 1 sesión programada`)
  console.log('\n🚀 Seed completo!')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
