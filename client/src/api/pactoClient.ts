import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

const pactoApi = axios.create({
  baseURL: `${BASE_URL}/api/pacto`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

pactoApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const pactoEndpoints = {
  setup: (modo: 'humano' | 'ia') =>
    pactoApi.post<{ pacto: any; inviteUrl: string | null }>('/setup', { modo }),

  getStatus: () =>
    pactoApi.get<{ activo: boolean; estado?: string; modo?: string; partnerNombre?: string; inviteUrl?: string | null }>('/status'),

  getInviteInfo: (token: string) =>
    axios.get<{ userName: string; inviteToken: string; vapidPublicKey: string }>(
      `${BASE_URL}/api/pacto/invitacion/${token}`
    ),

  acceptInvite: (token: string, partnerNombre: string, pushSubscription: PushSubscription | null) =>
    axios.post(`${BASE_URL}/api/pacto/invitacion/${token}/accept`, {
      partnerNombre,
      pushSubscription: pushSubscription ? JSON.parse(JSON.stringify(pushSubscription)) : null,
    }),

  getAlertaStatus: (alertaId: string) =>
    axios.get<{
      estado: string
      mensajePartner?: string
      mensajeAuto?: string
      segundosRestantes?: number
    }>(`${BASE_URL}/api/pacto/alerta/${alertaId}/status`),

  responderAlerta: (alertaId: string, mensaje: string) =>
    axios.post(`${BASE_URL}/api/pacto/alerta/${alertaId}/responder`, { mensaje }),

  getHistorial: () =>
    pactoApi.get<any[]>('/alertas'),
}

// ── Web Push helpers ──────────────────────────────────────────────────────────

export const VAPID_PUBLIC_KEY = 'BG_RYyTbFu3kqU0YI1bnDuS1d_ZSiMBpvnnoFYumquUlBAiYwyCDQHU8Rgop3rWBntB3VpUSRuoerlHl1Gr51Yg'

export async function suscribirPush(vapidKey: string): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })
    return sub
  } catch (e) {
    console.error('[push] subscribe error', e)
    return null
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = window.atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}
