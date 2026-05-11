import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
})

// Attach token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Token refresh on 401
let isRefreshing = false
let queue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Don't intercept auth endpoints — let the mutation's onError handle it
    const url = original.url ?? ''
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')

    if (error.response?.status !== 401 || original._retry || isAuthRoute) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        queue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`
          resolve(api(original))
        })
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const refreshToken = useAuthStore.getState().refreshToken
      if (!refreshToken) throw new Error('No refresh token')

      const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken })
      const { accessToken, refreshToken: newRefresh } = data

      useAuthStore.getState().setTokens(accessToken, newRefresh)
      queue.forEach((cb) => cb(accessToken))
      queue = []

      original.headers.Authorization = `Bearer ${accessToken}`
      return api(original)
    } catch {
      useAuthStore.getState().logout()
      // Don't redirect if already on an auth page — just clear the session
      const authPaths = ['/login', '/register', '/verify-code', '/forgot-password', '/asesor/login', '/asesor/register']
      const onAuthPage = authPaths.some((p) => window.location.pathname.startsWith(p))
      if (!onAuthPage) window.location.href = '/'
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
