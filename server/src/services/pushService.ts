import webpush from 'web-push'
import { prisma } from '../lib/prisma'

const vapidReady = !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)

if (vapidReady) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL ?? 'mailto:admin@pulsopacto.online',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  console.log('[push] VAPID configured ✅')
} else {
  console.warn('[push] VAPID keys not set — push notifications disabled')
}

interface PushPayload {
  title: string
  body: string
  url?: string
}

async function removeSub(id: string) {
  await prisma.pushSubscription.delete({ where: { id } }).catch(() => {})
}

async function sendToSubs(
  subs: { id: string; endpoint: string; p256dh: string; auth: string }[],
  payload: PushPayload
) {
  if (!vapidReady) return
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        )
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) await removeSub(sub.id)
      }
    })
  )
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  if (subs.length) await sendToSubs(subs, payload)
}

export async function sendPushToAsesor(asesorId: string, payload: PushPayload) {
  const subs = await prisma.pushSubscription.findMany({ where: { asesorId } })
  if (subs.length) await sendToSubs(subs, payload)
}
