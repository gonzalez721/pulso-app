import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useLogin } from '../hooks/useAuth'

export function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [unverified, setUnverified] = useState(false)
  const navigate = useNavigate()
  const { mutate, isPending, error } = useLogin({
    onUnverified: () => setUnverified(true),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setUnverified(false)
    mutate({ email, password })
  }

  return (
    <div className="min-h-screen bg-[#0A0A12] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-dark/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-neon-green/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8 relative z-10"
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary-dark to-purple-900 flex items-center justify-center mx-auto mb-4 shadow-glow">
            <span className="text-3xl">⚡</span>
          </div>
          <h1 className="text-4xl font-bold font-display text-white tracking-tight">PULSO</h1>
          <p className="text-text-muted mt-1 font-sans">Tus finanzas, a tu ritmo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Correo institucional"
            type="email"
            placeholder="tu.nombre@universidad.edu.co"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {/* Unverified email notice */}
          {unverified && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-500/10 border border-yellow-500/25 rounded-2xl px-4 py-3 space-y-2"
            >
              <p className="text-yellow-300 text-sm font-medium">
                📬 Debes verificar tu correo antes de ingresar.
              </p>
              <button
                type="button"
                onClick={async () => {
                  const { default: axios } = await import('axios')
                  const BASE = import.meta.env.VITE_API_URL ?? 'https://pulso-server.onrender.com'
                  await axios.post(`${BASE}/api/auth/resend-verification`, { email }).catch(() => {})
                  navigate('/verify-email')
                }}
                className="text-yellow-300 text-xs underline hover:text-yellow-200 transition-colors"
              >
                Reenviar enlace de verificación →
              </button>
            </motion.div>
          )}

          {error && !unverified && (
            <p className="text-sm text-red-400 font-medium text-center">
              Credenciales incorrectas. Intenta de nuevo.
            </p>
          )}

          <Button type="submit" loading={isPending} fullWidth size="lg" className="mt-2">
            Iniciar sesión
          </Button>
        </form>

        <div className="space-y-3 text-center">
          <p className="text-sm text-text-muted">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-bold text-neon-green hover:brightness-110">
              Regístrate gratis
            </Link>
          </p>
          <Link to="/forgot-password" className="block text-xs text-text-dim hover:text-text-muted transition-colors">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <div className="bg-surface-raised border border-neon-green/20 rounded-2xl p-3 text-center">
          <p className="text-xs text-neon-green/80 font-medium">
            🎓 Solo correos institucionales .edu.co
          </p>
        </div>
      </motion.div>
    </div>
  )
}
