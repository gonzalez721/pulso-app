/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> }

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

registerRoute(new NavigationRoute(new NetworkFirst({ cacheName: 'navigation' })))

// ── Push notifications ─────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json() as { title: string; body: string; url?: string }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      data: { url: data.url ?? '/' },
    } as NotificationOptions)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url: string = (event.notification.data as { url: string }).url ?? '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(url))
        if (existing) return existing.focus()
        return self.clients.openWindow(url)
      })
  )
})
