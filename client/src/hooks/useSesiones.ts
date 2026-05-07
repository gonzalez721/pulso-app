import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sesionApi } from '../api/endpoints'

export function useSesiones() {
  return useQuery({
    queryKey: ['sesiones'],
    queryFn: () => sesionApi.getAll().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useDisponibilidad(fecha?: string) {
  return useQuery({
    queryKey: ['disponibilidad', fecha ?? 'all'],
    queryFn: () => sesionApi.getDisponibilidad(fecha).then((r) => r.data),
    enabled: true,
    staleTime: 10 * 60 * 1000,
  })
}

export function useBookSesion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Parameters<typeof sesionApi.book>[0]) =>
      sesionApi.book(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sesiones'] })
      queryClient.invalidateQueries({ queryKey: ['disponibilidad'] })
    },
  })
}

export function useCancelSesion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => sesionApi.cancel(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sesiones'] })
      queryClient.invalidateQueries({ queryKey: ['disponibilidad'] })
    },
  })
}
