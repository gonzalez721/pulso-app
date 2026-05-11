import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pactoApi } from '../api/endpoints'

export function usePactoPartners() {
  return useQuery({
    queryKey: ['pacto-partners'],
    queryFn: () => pactoApi.getPartners().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreatePartner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { nombre: string; telefono?: string }) =>
      pactoApi.createPartner(data).then((r) => r.data.partner),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pacto-partners'] }),
  })
}

export function useUpdatePartner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ partnerId, ...data }: { partnerId: string; nombre?: string; telefono?: string }) =>
      pactoApi.updatePartner(partnerId, data).then((r) => r.data.partner),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pacto-partners'] }),
  })
}

export function useDeletePartner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (partnerId: string) => pactoApi.deletePartner(partnerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pacto-partners'] })
      qc.invalidateQueries({ queryKey: ['pacto-dashboard'] })
    },
  })
}

export function useAcceptPacto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (token: string) => pactoApi.acceptPacto(token).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pacto-partners'] })
      qc.invalidateQueries({ queryKey: ['pacto-dashboard'] })
    },
  })
}

export function usePactoDashboard() {
  return useQuery({
    queryKey: ['pacto-dashboard'],
    queryFn: () => pactoApi.getDashboard().then((r) => r.data),
    staleTime: 60 * 1000,
    refetchInterval: 30 * 1000,
  })
}

export function useAlertaStatus(alertaId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['pacto-alerta', alertaId],
    queryFn: () => pactoApi.getAlertaStatus(alertaId!).then((r) => r.data.alerta),
    enabled: !!alertaId && enabled,
    refetchInterval: 3000,
    staleTime: 0,
  })
}

// Keep backward compat for AddTransactionModal
export function usePactoPartner() {
  const { data } = usePactoPartners()
  return {
    data: {
      partner: data?.partners?.[0] ?? null,
      asInvited: data?.asInvited?.[0] ?? null,
    },
  }
}
