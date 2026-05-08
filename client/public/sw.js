const CACHE_NAME = 'pulso-v1'

// ── Install & Activate ────────────────────────────────────────────────────────
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// ── Push Notifications (PACTO partner alerts) ─────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'PULSO', body: event.data.text(), data: {} }
  }

  const {
    title = '⚡ PACTO',
    body = '',
    icon = '/pwa-192x192.png',
    badge = '/pwa-64x64.png',
    data = {},
    actions = [],
    requireInteraction = true,
    tag,
  } = payload

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      data,
      actions,
      requireInteraction,
      tag,
      vibrate: [200, 100, 200],
    })
  )
})

// ── Notification Click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const action = event.action
  const data = event.notification.data ?? {}
  const url = action === 'dismiss' ? null : (data.url ?? null)

  if (!url) return

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If the responder page is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise open a new tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })
  )
})
