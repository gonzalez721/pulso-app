import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AsesorUser {
  id: string
  email: string
  nombre: string
  carrera: string
  semestre: number
  bio?: string
  fotoUrl?: string
}

interface AsesorState {
  asesor: AsesorUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (asesor: AsesorUser, accessToken: string, refreshToken: string) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

export const useAsesorStore = create<AsesorState>()(
  persist(
    (set) => ({
      asesor: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (asesor, accessToken, refreshToken) =>
        set({ asesor, accessToken, refreshToken, isAuthenticated: true }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      logout: () => set({ asesor: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    { name: 'pulso-asesor' }
  )
)
