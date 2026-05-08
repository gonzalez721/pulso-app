import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import { useAsesorStore } from './store/asesorStore'
import { AppLayout } from './components/layout/AppLayout'
import { AsesorLayout } from './components/asesor/AsesorLayout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { OnboardingPage } from './pages/onboarding/OnboardingPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { WeeklyWrapPage } from './pages/weekly/WeeklyWrapPage'
import { SessionsPage } from './pages/sessions/SessionsPage'
import { ProfilePage } from './pages/profile/ProfilePage'
import { MoodCheckinPage } from './pages/mood/MoodCheckinPage'
import { LandingPage } from './pages/LandingPage'
import { AsesorLoginPage } from './pages/asesor/AsesorLoginPage'
import { AsesorRegisterPage } from './pages/asesor/AsesorRegisterPage'
import { AsesorDashboard } from './pages/asesor/AsesorDashboard'
import { AsesorSesionesPage } from './pages/asesor/AsesorSesionesPage'
import { AsesorSesionDetail } from './pages/asesor/AsesorSesionDetail'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    },
  },
})

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function RequireAsesorAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAsesorStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/asesor/login" replace />
}

// Si ya estás logueado te manda directo, si no muestra la landing
function SmartHome() {
  const { isAuthenticated: isStudent } = useAuthStore()
  const { isAuthenticated: isMentor } = useAsesorStore()
  if (isMentor) return <Navigate to="/asesor/dashboard" replace />
  if (isStudent) return <Navigate to="/dashboard" replace />
  return <LandingPage />
}

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (!user?.onboardingComplete) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Onboarding (auth required, onboarding not complete) */}
          <Route
            path="/onboarding"
            element={
              <RequireAuth>
                <OnboardingPage />
              </RequireAuth>
            }
          />

          {/* App (auth + onboarding required) */}
          <Route
            element={
              <RequireAuth>
                <RequireOnboarding>
                  <AppLayout />
                </RequireOnboarding>
              </RequireAuth>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/weekly" element={<WeeklyWrapPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/mood" element={<MoodCheckinPage />} />
          </Route>

          {/* Asesor portal */}
          <Route path="/asesor/login" element={<AsesorLoginPage />} />
          <Route path="/asesor/register" element={<AsesorRegisterPage />} />
          <Route
            path="/asesor"
            element={
              <RequireAsesorAuth>
                <AsesorLayout />
              </RequireAsesorAuth>
            }
          >
            <Route index element={<Navigate to="/asesor/dashboard" replace />} />
            <Route path="dashboard" element={<AsesorDashboard />} />
            <Route path="sesiones" element={<AsesorSesionesPage />} />
            <Route path="sesion/:sesionId" element={<AsesorSesionDetail />} />
          </Route>

          {/* Landing — entrada unificada */}
          <Route path="/" element={<SmartHome />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
