import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi, userApi } from '../api/endpoints'
import { useAuthStore } from '../store/authStore'

export function useLogin(opts?: { onUnverified?: (email: string) => void }) {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: { email: string; password: string }) => authApi.login(data),
    onSuccess: ({ data }) => {
      setAuth(data.user, data.accessToken, data.refreshToken)
      if (!data.user.emailVerified) {
        navigate(`/verify-code?email=${encodeURIComponent(data.user.email)}`)
        opts?.onUnverified?.(data.user.email)
      } else {
        navigate(data.user.onboardingComplete ? '/dashboard' : '/onboarding')
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
      setAuth(data.user, data.accessToken, data.refreshToken)
      // Always go to code verification after registration
      navigate(`/verify-code?email=${encodeURIComponent(data.user.email)}`)
    },
  })
}

export function useVerifyCode() {
  const { setUser, user } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: { email: string; code: string }) => authApi.verifyCode(data),
    onSuccess: ({ data }) => {
      setUser(data.user)
      navigate(data.user.onboardingComplete ? '/dashboard' : '/onboarding')
    },
  })
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (email: string) => authApi.resendVerification(email),
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

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword({ email }),
  })
}

export function useResetPassword() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: { email: string; code: string; password: string }) =>
      authApi.resetPassword(data),
    onSuccess: (_, variables) => {
      navigate(`/login`)
    },
  })
}
