import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { transaccionApi, metaApi } from '../api/endpoints'

export function useWeeklySummary(semana?: string) {
  return useQuery({
    queryKey: ['weekly-summary', semana ?? 'current'],
    queryFn: () => transaccionApi.getWeeklySummary(semana).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  })
}

export function useTransacciones(params?: Parameters<typeof transaccionApi.getAll>[0]) {
  return useQuery({
    queryKey: ['transacciones', params],
    queryFn: () => transaccionApi.getAll(params).then((r) => r.data),
    staleTime: 60 * 1000,
  })
}

export function useCreateTransaccion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Parameters<typeof transaccionApi.create>[0]) =>
      transaccionApi.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-summary'] })
      queryClient.invalidateQueries({ queryKey: ['transacciones'] })
      queryClient.invalidateQueries({ queryKey: ['metas-active'] })
    },
  })
}

export function useActiveMetas() {
  return useQuery({
    queryKey: ['metas-active'],
    queryFn: () => metaApi.getActive().then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreateMeta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Parameters<typeof metaApi.create>[0]) =>
      metaApi.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas-active'] })
    },
  })
}
