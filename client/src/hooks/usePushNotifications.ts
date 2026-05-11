import { useState, useEffect } from 'react'
import { pushApi } from '../api/pushApi'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(b64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr.buffer
}

function subToKeys(sub: PushSubscription) {
  const key  = sub.getKey('p256dh')
  const auth = sub.getKey('auth')
  return {
    endpoint: sub.endpoint,
    p256dh:   key  ? btoa(String.fromCharCode(...new Uint8Array(key)))  : '',
    auth:     auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : '',
  }
}

interface Options { role?: 'user' | 'asesor' }

export function usePushNotifications({ role = 'user' }: Options = {}) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [supported]                 = useState(() => 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window)

  useEffect(() => {
    if (!supported) return
    setPermission(Notification.permission)
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setSubscribed(!!sub))
    )
  }, [supported])

  const subscribe = async () => {
    if (!supported || !VAPID_PUBLIC_KEY) return
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const keys = subToKeys(sub)
      if (role === 'asesor') await pushApi.asesorSubscribe(keys)
      else                   await pushApi.subscribe(keys)

      setSubscribed(true)
    } catch (err) {
      console.error('[push] subscribe error:', err)
    } finally {
      setLoading(false)
    }
  }

  const unsubscribe = async () => {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        if (role === 'asesor') await pushApi.asesorUnsubscribe({ endpoint: sub.endpoint })
        else                   await pushApi.unsubscribe({ endpoint: sub.endpoint })
        await sub.unsubscribe()
      }
      setSubscribed(false)
    } catch (err) {
      console.error('[push] unsubscribe error:', err)
    } finally {
      setLoading(false)
    }
  }

  return { supported, permission, subscribed, loading, subscribe, unsubscribe }
}
