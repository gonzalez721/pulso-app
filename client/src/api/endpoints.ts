import api from './client'
import type {
  User,
  Transaccion,
  Meta,
  Sesion,
  Asesor,
  InsightItem,
  WeeklySummary,
  MoodCheckin,
} from '../types'

// Auth
export const authApi = {
  register: (data: { email: string; password: string; nombre: string; universidad?: string; semestre?: number }) =>
    api.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', data),

  verifyCode: (data: { email: string; code: string }) =>
    api.post<{ message: string; user: User }>('/auth/verify-code', data),

  resendVerification: (email: string) =>
    api.post('/auth/resend-verification', { email }),

  forgotPassword: (data: { email: string }) =>
    api.post('/auth/forgot-password', data),

  resetPassword: (data: { email: string; code: string; password: string }) =>
    api.post('/auth/reset-password', data),

  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
}

// User
export const userApi = {
  getProfile: () => api.get<User>('/user/profile'),

  updateProfile: (data: Partial<User> & {
    objetivo?: string
    categoriasGasto?: Record<string, number>
    dificultadesReportadas?: string[]
    presupuestoSemanal?: number
    onboardingComplete?: boolean
  }) => api.patch<User>('/user/profile', data),

  updateFoto: (fotoUrl: string) => api.patch<{ id: string; fotoUrl: string }>('/user/foto', { fotoUrl }),
}

// Transacciones
export const transaccionApi = {
  create: (data: {
    monto: number
    categoria: string
    descripcion?: string
    fecha?: string
    metodoPago?: string
  }) => api.post<Transaccion>('/transacciones', data),

  getAll: (params?: { limit?: number; offset?: number; categoria?: string; desde?: string; hasta?: string }) =>
    api.get<{ transacciones: Transaccion[]; total: number }>('/transacciones', { params }),

  getWeeklySummary: (semana?: string) =>
    api.get<WeeklySummary>('/transacciones/weekly-summary', { params: semana ? { semana } : {} }),
}

// Metas
export const metaApi = {
  create: (data: { tipoMeta: string; montoObjetivo: number; fechaInicio: string; fechaFin: string }) =>
    api.post<Meta>('/metas', data),

  getActive: () => api.get<Meta[]>('/metas/active'),

  update: (id: string, data: Partial<Meta>) => api.patch<Meta>(`/metas/${id}`, data),
}

// Sesiones
export const sesionApi = {
  getAll: () => api.get<Sesion[]>('/sesiones'),

  getDisponibilidad: (fecha?: string) =>
    api.get<Asesor[]>('/sesiones/disponibilidad', { params: fecha ? { fecha } : {} }),

  book: (data: { asesorId: string; fechaHora: string; temasAgenda?: string[] }) =>
    api.post<Sesion>('/sesiones/book', data),

  cancel: (id: string) => api.patch<Sesion>(`/sesiones/${id}/cancel`),
}

// Insights
export const insightApi = {
  generate: (semanaInicio?: string) =>
    api.post<{
      insights: InsightItem[]
      semanaInicio: string
      semanaFin: string
      totalGastado: number
      presupuesto: number
    }>('/insights/generate', semanaInicio ? { semanaInicio } : {}),
}

// Mood
export const moodApi = {
  save: (data: { mood: string; nota?: string }) => api.post<MoodCheckin>('/mood', data),
  getRecent: (limit?: number) => api.get<MoodCheckin[]>('/mood', { params: { limit } }),
}

// PACTO
export type PactoPartnerItem = { id: string; nombre: string; telefono?: string; token: string; estado: string; partnerUserId?: string; createdAt: string }
export type PactoStats = { nombre: string; fotoUrl?: string | null; spent: number; budget: number; pct: number | null; byCategory: Record<string, number>; txCount: number }

export const pactoApi = {
  getPartners: () =>
    api.get<{
      partners: PactoPartnerItem[]
      asInvited: { id: string; inviterNombre: string; inviterFotoUrl?: string; estado: string }[]
    }>('/pacto/partners'),

  createPartner: (data: { nombre: string; telefono?: string }) =>
    api.post<{ partner: PactoPartnerItem }>('/pacto/partner', data),

  updatePartner: (partnerId: string, data: { nombre?: string; telefono?: string }) =>
    api.patch<{ partner: PactoPartnerItem }>(`/pacto/partner/${partnerId}`, data),

  deletePartner: (partnerId: string) =>
    api.delete(`/pacto/partner/${partnerId}`),

  acceptPacto: (token: string) =>
    api.post<{ ok: boolean; estado: string }>('/pacto/accept', { token }),

  getDashboard: () =>
    api.get<{
      connected: boolean
      me?: PactoStats
      competitions?: { partnerId: string; linkId?: string; partnerNombreInvite: string; partner: PactoStats }[]
    }>('/pacto/dashboard'),

  getAlertaStatus: (alertaId: string) =>
    api.get<{ alerta: { id: string; estado: string; respuestaMensaje: string | null; respondedAt: string | null } }>(`/pacto/alerta/${alertaId}/status`),

  getInviteInfo: (token: string) =>
    api.get<{ alreadyAccepted: boolean; inviterNombre: string; inviterFotoUrl?: string; partnerNombre?: string }>(`/pacto/invite/${token}`),

  getPartnerPage: (token: string) =>
    api.get<{ partner: { nombre: string; userNombre: string; userFotoUrl?: string } }>(`/pacto/p/${token}`),

  getPartnerAlertas: (token: string) =>
    api.get<{ alertas: any[]; userNombre: string }>(`/pacto/p/${token}/alertas`),

  responderAlerta: (token: string, alertaId: string, data: { decision: 'aprobado' | 'rechazado'; mensaje?: string }) =>
    api.post(`/pacto/p/${token}/alerta/${alertaId}/responder`, data),
}
