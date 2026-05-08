import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAsesorStore } from '../store/asesorStore'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export const asesorApi = axios.create({
  baseURL: `${BASE_URL}/api/asesor`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

asesorApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAsesorStore.getState().accessToken
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing = false
let queue: Array<(t: string) => void> = []

asesorApi.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status !== 401 || original._retry) return Promise.reject(error)

    if (refreshing) {
      return new Promise((resolve) => { queue.push((t) => { original.headers.Authorization = `Bearer ${t}`; resolve(asesorApi(original)) }) })
    }

    original._retry = true; refreshing = true
    try {
      const rf = useAsesorStore.getState().refreshToken
      if (!rf) throw new Error('no token')
      const { data } = await axios.post(`${BASE_URL}/api/asesor/refresh`, { refreshToken: rf })
      useAsesorStore.getState().setTokens(data.accessToken, data.refreshToken)
      queue.forEach((cb) => cb(data.accessToken)); queue = []
      original.headers.Authorization = `Bearer ${data.accessToken}`
      return asesorApi(original)
    } catch {
      useAsesorStore.getState().logout()
      window.location.href = '/asesor/login'
      return Promise.reject(error)
    } finally { refreshing = false }
  }
)

// API methods
export const asesorEndpoints = {
  register: (data: { email: string; password: string; nombre: string; carrera: string; semestre: number; bio?: string }) =>
    asesorApi.post<{ asesor: any; accessToken: string; refreshToken: string }>('/register', data),

  login: (data: { email: string; password: string }) =>
    asesorApi.post<{ asesor: any; accessToken: string; refreshToken: string }>('/login', data),

  verifyCode: (data: { email: string; code: string }) =>
    asesorApi.post<{ message: string; asesor: any }>('/verify-code', data),

  resendVerification: (email: string) =>
    asesorApi.post('/resend-verification', { email }),

  forgotPassword: (email: string) =>
    asesorApi.post('/forgot-password', { email }),

  resetPassword: (data: { email: string; code: string; password: string }) =>
    asesorApi.post('/reset-password', data),

  getMe: () => asesorApi.get('/me'),

  getSesiones: (estado?: string) =>
    asesorApi.get<any[]>('/sesiones', { params: estado ? { estado } : {} }),

  getEstudianteStats: (userId: string) =>
    asesorApi.get(`/estudiante/${userId}/stats`),

  saveObservacion: (sesionId: string, data: {
    temasDiscutidos: string[]
    patronesIdentificados: string[]
    compromisosProximaSemana: string[]
    notasImportantes?: string
  }) => asesorApi.post(`/sesiones/${sesionId}/observacion`, data),

  getDisponibilidad: () => asesorApi.get<{ id: string; disponibilidad: Array<{ dia: string; horas: string[] }> }>('/me'),

  updateDisponibilidad: (disponibilidad: Array<{ dia: string; horas: string[] }>) =>
    asesorApi.patch<{ id: string; disponibilidad: Array<{ dia: string; horas: string[] }> }>('/disponibilidad', { disponibilidad }),

  updateSesionStatus: (sesionId: string, estado: 'completada' | 'cancelada' | 'aplazada') =>
    asesorApi.patch(`/sesiones/${sesionId}/status`, { estado }),
}
