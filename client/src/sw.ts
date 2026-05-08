/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// ── Push Notifications (PACTO partner alerts) ─────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload: any
  try { payload = event.data.json() } catch { payload = { title: 'PULSO', body: event.data.text(), data: {} } }

  const { title = '⚡ PACTO', body = '', icon = '/pwa-192x192.png',
    badge = '/pwa-64x64.png', data = {}, actions = [],
    requireInteraction = true, tag } = payload

  event.waitUntil(
    self.registration.showNotification(title, {
      body, icon, badge, data, requireInteraction, tag,
      vibrate: [200, 100, 200],
    } as NotificationOptions)
  )
})

// ── Notification Click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.action === 'dismiss' ? null : (event.notification.data?.url ?? null)
  if (!url) return

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
