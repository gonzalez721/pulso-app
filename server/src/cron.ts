import cron from 'node-cron'
import { prisma } from './lib/prisma'
import { sendPushToUser, sendPushToAsesor } from './services/pushService'

export function startCronJobs() {
  // ── Session reminder: every 5 min, check sessions starting in ~1 hour ──
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date()
      const in55 = new Date(now.getTime() + 55 * 60 * 1000)
      const in65 = new Date(now.getTime() + 65 * 60 * 1000)

      const sessions = await prisma.sesion.findMany({
        where: { estado: 'programada', fechaHora: { gte: in55, lte: in65 } },
        include: {
          user:   { select: { id: true, nombre: true } },
          asesor: { select: { id: true, nombre: true } },
        },
      })

      for (const s of sessions) {
        const hora = new Date(s.fechaHora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

        await sendPushToUser(s.userId, {
          title: '⏰ Sesión en 1 hora',
          body: `Tu sesión con ${s.asesor.nombre} es a las ${hora}. ¡Prepárate!`,
          url: '/sessions',
        })

        await sendPushToAsesor(s.asesorId, {
          title: '⏰ Sesión en 1 hora',
          body: `Sesión con ${s.user.nombre} a las ${hora}. Revisa su historial.`,
          url: '/asesor/sesiones',
        })
      }
    } catch (err) {
      console.error('[cron:session-reminder]', err)
    }
  })

  // ── Streak danger: daily at 11pm — users who haven't logged today ──
  cron.schedule('0 23 * * *', async () => {
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const users = await prisma.user.findMany({
        where: { onboardingComplete: true },
        select: { id: true },
      })

      for (const u of users) {
        const [todayCount, totalCount] = await Promise.all([
          prisma.transaccion.count({ where: { userId: u.id, fecha: { gte: todayStart } } }),
          prisma.transaccion.count({ where: { userId: u.id } }),
        ])

        if (totalCount > 0 && todayCount === 0) {
          await sendPushToUser(u.id, {
            title: '🔥 ¡Tu racha está en peligro!',
            body: 'Registra al menos un gasto hoy antes de medianoche para mantenerla.',
            url: '/dashboard',
          })
        }
      }
    } catch (err) {
      console.error('[cron:streak-danger]', err)
    }
  })

  console.log('✅ Cron jobs iniciados (sesiones + racha)')
}
