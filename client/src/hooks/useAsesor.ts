import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { asesorEndpoints } from '../api/asesorClient'
import { useAsesorStore } from '../store/asesorStore'

export function useAsesorRegister() {
  const { setAuth } = useAsesorStore()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data: { email: string; password: string; nombre: string; carrera: string; semestre: number; bio?: string }) =>
      asesorEndpoints.register(data).then((r) => r.data),
    onSuccess: (data) => {
      setAuth(data.asesor, data.accessToken, data.refreshToken)
      // Go to code verification after registration
      navigate(`/asesor/verify-code?email=${encodeURIComponent(data.asesor.email)}`)
    },
  })
}

export function useAsesorLogin() {
  const { setAuth } = useAsesorStore()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      asesorEndpoints.login(data).then((r) => r.data),
    onSuccess: (data) => {
      setAuth(data.asesor, data.accessToken, data.refreshToken)
      if (!data.asesor.emailVerified) {
        navigate(`/asesor/verify-code?email=${encodeURIComponent(data.asesor.email)}`)
      } else {
        navigate('/asesor/dashboard')
      }
    },
  })
}

export function useAsesorVerifyCode() {
  const { setAsesor } = useAsesorStore()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data: { email: string; code: string }) =>
      asesorEndpoints.verifyCode(data).then((r) => r.data),
    onSuccess: (data) => {
      setAsesor(data.asesor)
      navigate('/asesor/dashboard')
    },
  })
}

export function useAsesorResendVerification() {
  return useMutation({
    mutationFn: (email: string) => asesorEndpoints.resendVerification(email),
  })
}

export function useAsesorLogout() {
  const { logout } = useAsesorStore()
  const navigate = useNavigate()
  const qc = useQueryClient()
  return () => { logout(); qc.removeQueries({ queryKey: ['asesor'] }); navigate('/asesor/login') }
}

export function useAsesorSesiones(estado?: string) {
  const { isAuthenticated } = useAsesorStore()
  return useQuery({
    queryKey: ['asesor', 'sesiones', estado ?? 'all'],
    queryFn: () => asesorEndpoints.getSesiones(estado).then((r) => r.data),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    refetchInterval: 30 * 1000,
  })
}

export function useEstudianteStats(userId: string | null) {
  const { isAuthenticated } = useAsesorStore()
  return useQuery({
    queryKey: ['asesor', 'estudiante', userId],
    queryFn: () => asesorEndpoints.getEstudianteStats(userId!).then((r) => r.data),
    enabled: isAuthenticated && !!userId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useUpdateSesionStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sesionId, estado }: { sesionId: string; estado: 'completada' | 'cancelada' | 'aplazada' }) =>
      asesorEndpoints.updateSesionStatus(sesionId, estado).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['asesor', 'sesiones'] }),
  })
}

export function useSaveObservacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sesionId, data }: { sesionId: string; data: Parameters<typeof asesorEndpoints.saveObservacion>[1] }) =>
      asesorEndpoints.saveObservacion(sesionId, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['asesor', 'sesiones'] }),
  })
}

export function useAsesorMe() {
  const { isAuthenticated } = useAsesorStore()
  return useQuery({
    queryKey: ['asesor', 'me'],
    queryFn: () => asesorEndpoints.getMe().then((r) => r.data),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
  })
}

export function useUpdateDisponibilidad() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (disponibilidad: Array<{ dia: string; horas: string[] }>) =>
      asesorEndpoints.updateDisponibilidad(disponibilidad).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asesor', 'me'] })
      qc.invalidateQueries({ queryKey: ['disponibilidad'] })
    },
  })
}

export function useAsesorForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => asesorEndpoints.forgotPassword(email),
  })
}

export function useAsesorResetPassword() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data: { email: string; code: string; password: string }) =>
      asesorEndpoints.resetPassword(data),
    onSuccess: () => {
      navigate('/asesor/login')
    },
  })
}
