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
      if (data.requiresVerification) {
        navigate('/verify-email?role=mentor')
      } else {
        setAuth(data.asesor, data.accessToken, data.refreshToken)
        navigate('/asesor/dashboard')
      }
    },
  })
}

export function useAsesorLogin(opts?: { onUnverified?: () => void }) {
  const { setAuth } = useAsesorStore()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      asesorEndpoints.login(data).then((r) => r.data),
    onSuccess: (data) => {
      setAuth(data.asesor, data.accessToken, data.refreshToken)
      navigate('/asesor/dashboard')
    },
    onError: (err: any) => {
      if (err?.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        opts?.onUnverified?.()
      }
    },
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

export function useSaveObservacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sesionId, data }: { sesionId: string; data: Parameters<typeof asesorEndpoints.saveObservacion>[1] }) =>
      asesorEndpoints.saveObservacion(sesionId, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['asesor', 'sesiones'] }),
  })
}
