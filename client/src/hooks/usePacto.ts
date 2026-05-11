import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pactoApi } from '../api/endpoints'

export function usePactoPartner() {
  return useQuery({
    queryKey: ['pacto-partner'],
    queryFn: () => pactoApi.getPartner().then((r) => r.data.partner),
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpsertPartner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { nombre: string; telefono?: string }) =>
      pactoApi.upsertPartner(data).then((r) => r.data.partner),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pacto-partner'] }),
  })
}

export function useDeletePartner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => pactoApi.deletePartner(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pacto-partner'] }),
  })
}

export function useAlertaStatus(alertaId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['pacto-alerta', alertaId],
    queryFn: () => pactoApi.getAlertaStatus(alertaId!).then((r) => r.data.alerta),
    enabled: !!alertaId && enabled,
    refetchInterval: 3000, // poll every 3s while modal is open
    staleTime: 0,
  })
}
