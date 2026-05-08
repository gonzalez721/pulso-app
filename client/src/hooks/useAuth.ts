import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi, userApi } from '../api/endpoints'
import { useAuthStore } from '../store/authStore'

export function useLogin(opts?: { onUnverified?: () => void }) {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: { email: string; password: string }) => authApi.login(data),
    onSuccess: ({ data }) => {
      setAuth(data.user, data.accessToken, data.refreshToken)
      navigate(data.user.onboardingComplete ? '/dashboard' : '/onboarding')
    },
    onError: (err: any) => {
      if (err?.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        opts?.onUnverified?.()
      }
    },
  })
}

export function useRegister() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: { email: string; password: string; nombre: string; universidad?: string; semestre?: number }) =>
      authApi.register(data),
    onSuccess: ({ data }) => {
      // Always log in immediately — verification email is sent but not required
      setAuth(data.user, data.accessToken, data.refreshToken)
      navigate('/onboarding')
    },
  })
}

export function useLogout() {
  const { refreshToken, logout } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (): Promise<any> => (refreshToken ? authApi.logout(refreshToken) : Promise.resolve()),
    onSettled: () => {
      logout()
      queryClient.clear()
      navigate('/login')
    },
  })
}

export function useProfile() {
  const { isAuthenticated } = useAuthStore()

  return useQuery({
    queryKey: ['profile'],
    queryFn: () => userApi.getProfile().then((r) => r.data),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateProfile() {
  const { setUser } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Parameters<typeof userApi.updateProfile>[0]) =>
      userApi.updateProfile(data).then((r) => r.data),
    onSuccess: (user) => {
      setUser(user)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
