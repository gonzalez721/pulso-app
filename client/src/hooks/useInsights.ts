import { useMutation, useQuery } from '@tanstack/react-query'
import { insightApi, moodApi } from '../api/endpoints'

export function useGenerateInsights() {
  return useMutation({
    mutationFn: (semanaInicio?: string) => insightApi.generate(semanaInicio).then((r) => r.data),
  })
}

export function useInsights(semanaInicio?: string) {
  return useQuery({
    queryKey: ['insights', semanaInicio ?? 'current'],
    queryFn: () => insightApi.generate(semanaInicio).then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  })
}

export function useSaveMood() {
  return useMutation({
    mutationFn: (data: { mood: string; nota?: string }) => moodApi.save(data).then((r) => r.data),
  })
}
