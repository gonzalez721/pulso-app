import webpush from 'web-push'

let initialized = false

function init() {
  if (initialized) return
  const pub  = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const mail = process.env.VAPID_EMAIL ?? 'mailto:pacto@pulsopacto.online'
  if (!pub || !priv) { console.warn('[webpush] VAPID keys not set — push disabled'); return }
  webpush.setVapidDetails(mail, pub, priv)
  initialized = true
}

export interface PactoNotificacionPayload {
  alertaId:   string
  userName:   string
  monto:      number
  categoria:  string
  descripcion?: string
  porcentajePresupuesto: number
  nComprasHoy: number
  responderUrl: string
}

export async function enviarNotificacionPartner(
  subscription: webpush.PushSubscription,
  payload: PactoNotificacionPayload
): Promise<boolean> {
  init()
  if (!initialized) return false

  const { userName, monto, categoria, nComprasHoy, porcentajePresupuesto } = payload

  const montoFmt = new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(monto)

  const body = [
    `${userName} va a gastar ${montoFmt} en ${categoria}.`,
    nComprasHoy > 1 ? `Es su ${nComprasHoy}ª compra hoy.` : '',
    `Lleva ${porcentajePresupuesto}% del presupuesto.`,
    '¿Le escribís?',
  ].filter(Boolean).join(' ')

  const notifPayload = JSON.stringify({
    title: `⚡ PACTO — ${userName} necesita tu apoyo`,
    body,
    icon:  '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    data:  { url: payload.responderUrl, alertaId: payload.alertaId },
    actions: [
      { action: 'responder', title: '✍️ Responder ahora' },
      { action: 'dismiss',   title: 'Ignorar' },
    ],
    requireInteraction: true,
    tag: `pacto-${payload.alertaId}`,
  })

  try {
    await webpush.sendNotification(subscription, notifPayload)
    return true
  } catch (err: any) {
    console.error('[webpush] sendNotification error:', err.statusCode, err.body)
    return false
  }
}

export { webpush }
