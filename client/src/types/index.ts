export interface User {
  id: string
  email: string
  nombre: string
  universidad?: string
  semestre?: number
  mensualidadMensual?: number
  appsPago: string[]
  onboardingComplete: boolean
  createdAt: string
  perfil?: PerfilFinanciero
}

export interface PerfilFinanciero {
  id: string
  userId: string
  objetivo?: string
  categoriasGasto: Record<string, number>
  dificultadesReportadas: string[]
  preferencias: Record<string, unknown>
  resumenIA?: string
  createdAt: string
  updatedAt: string
}

export interface Transaccion {
  id: string
  userId: string
  monto: number
  categoria: string
  descripcion?: string
  fecha: string
  metodoPago?: string
  comprobante?: string
  createdAt: string
}

export interface Meta {
  id: string
  userId: string
  tipoMeta: string
  montoObjetivo: number
  montoGastado: number
  fechaInicio: string
  fechaFin: string
  activa: boolean
  createdAt: string
  updatedAt: string
}

export interface Asesor {
  id: string
  nombre: string
  carrera: string
  semestre: number
  bio?: string
  fotoUrl?: string
  disponibilidad: Array<{ dia: string; horas: string[] }>
  calendlyUsername?: string
  horasDisponibles?: string[]
}

export interface Sesion {
  id: string
  userId: string
  asesorId: string
  asesor: Asesor
  fechaHora: string
  duracionMin: number
  estado: 'programada' | 'completada' | 'cancelada'
  linkMeet?: string
  temasAgenda: string[]
  observaciones?: Observacion
  createdAt: string
}

export interface Observacion {
  id: string
  sesionId: string
  temasDiscutidos: string[]
  patronesIdentificados: string[]
  compromisosProximaSemana: string[]
  notasImportantes?: string
  createdAt: string
}

export interface InsightItem {
  titulo: string
  descripcion: string
  icono: string
}

export interface WeeklySummary {
  semanaInicio: string
  semanaFin: string
  total: number
  transacciones: Transaccion[]
  dailyBreakdown: Array<{ fecha: string; monto: number }>
  categoryBreakdown: Array<{ categoria: string; monto: number; porcentaje: number }>
}

export interface MoodCheckin {
  id: string
  userId: string
  mood: string
  nota?: string
  fecha: string
}

export type Objetivo = 'SAVE_MORE' | 'SPEND_SMARTER' | 'STOP_IMPULSE' | 'LESS_STRESS'

export const CATEGORIAS = [
  { key: 'Comida', label: 'Comida', emoji: '🍕' },
  { key: 'Transporte', label: 'Transporte', emoji: '🚌' },
  { key: 'Entretenimiento', label: 'Entretenimiento', emoji: '🎮' },
  { key: 'Estudios', label: 'Estudios', emoji: '📚' },
  { key: 'Salud', label: 'Salud', emoji: '💊' },
  { key: 'Ropa', label: 'Ropa', emoji: '👕' },
  { key: 'Suscripciones', label: 'Suscripciones', emoji: '📱' },
  { key: 'Hogar', label: 'Hogar', emoji: '🏠' },
  { key: 'Otros', label: 'Otros', emoji: '📦' },
]

export const CATEGORY_COLORS: Record<string, string> = {
  Comida: '#FF9B9B',
  Transporte: '#FFD4C8',
  Entretenimiento: '#C8B8E8',
  Estudios: '#B8D4E8',
  Salud: '#B8E8C8',
  Ropa: '#E8D4B8',
  Suscripciones: '#D4C8E8',
  Hogar: '#C8E8D4',
  Otros: '#E5E5E5',
}
