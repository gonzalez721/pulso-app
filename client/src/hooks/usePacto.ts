import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pactoEndpoints } from '../api/pactoClient'
import { useAuthStore } from '../store/authStore'

export function usePactoStatus() {
  const { isAuthenticated } = useAuthStore()
  return useQuery({
    queryKey: ['pacto', 'status'],
    queryFn:  () => pactoEndpoints.getStatus().then(r => r.data),
    enabled:  isAuthenticated,
    staleTime: 60 * 1000,
  })
}

export function useSetupPacto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (modo: 'humano' | 'ia') => pactoEndpoints.setup(modo).then(r => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['pacto'] }),
  })
}

export function useAlertaStatus(alertaId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['pacto', 'alerta', alertaId],
    queryFn:  () => pactoEndpoints.getAlertaStatus(alertaId!).then(r => r.data),
    enabled:  enabled && !!alertaId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return 3000
      if (data.estado === 'esperando') return 3000
      return false  // stop polling once resolved
    },
    staleTime: 0,
  })
}

export function useResponderAlerta() {
  return useMutation({
    mutationFn: ({ alertaId, mensaje }: { alertaId: string; mensaje: string }) =>
      pactoEndpoints.responderAlerta(alertaId, mensaje).then(r => r.data),
  })
}

export function useHistorialAlertas() {
  const { isAuthenticated } = useAuthStore()
  return useQuery({
    queryKey: ['pacto', 'historial'],
    queryFn:  () => pactoEndpoints.getHistorial().then(r => r.data),
    enabled:  isAuthenticated,
    staleTime: 30 * 1000,
  })
}
