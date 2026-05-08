import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAsesorLogin } from '../../hooks/useAsesor'

export function AsesorLoginPage() {
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [unverified, setUnverified] = useState(false)
  const navigate = useNavigate()
  const { mutate, isPending, error } = useAsesorLogin({
    onUnverified: () => setUnverified(true),
  })

  return (
    <div className="min-h-screen bg-[#0A0A12] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-dark/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-neon-green/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-[1.8rem] bg-gradient-to-br from-primary-dark to-purple-900 flex items-center justify-center mx-auto mb-4 shadow-glow">
            <span className="text-4xl">🎓</span>
          </div>
          <h1 className="text-3xl font-extrabold font-display text-white">Portal Asesor</h1>
          <p className="text-text-muted mt-1 text-sm">PULSO — Acompañamiento Financiero</p>
        </div>

        {/* Form */}
        <div className="bg-surface-raised border border-border-light rounded-3xl p-6 space-y-4">
          <Input
            label="Email institucional"
            type="email"
            placeholder="tu.nombre@universidad.edu.co"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setUnverified(false) }}
            autoComplete="email"
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {/* Unverified notice */}
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
                  await axios.post(`${BASE}/api/asesor/resend-verification`, { email }).catch(() => {})
                  navigate('/verify-email?role=mentor')
                }}
                className="text-yellow-300 text-xs underline hover:text-yellow-200 transition-colors"
              >
                Reenviar enlace de verificación →
              </button>
            </motion.div>
          )}

          {error && !unverified && (
            <p className="text-red-400 text-sm font-medium text-center">
              Credenciales incorrectas. Intenta de nuevo.
            </p>
          )}

          <Button
            onClick={() => { setUnverified(false); mutate({ email, password }) }}
            loading={isPending}
            disabled={!email || !password}
            fullWidth
            size="lg"
            className="mt-2"
          >
            Ingresar al portal
          </Button>
        </div>

        <div className="space-y-2 mt-5 text-center">
          <p className="text-sm text-text-muted">
            ¿Eres mentor nuevo?{' '}
            <Link to="/asesor/register" className="font-bold text-primary-dark hover:brightness-110 transition-all">
              Regístrate aquí
            </Link>
          </p>
          <Link to="/forgot-password?role=mentor" className="block text-xs text-text-dim hover:text-text-muted transition-colors">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <div className="text-center mt-3">
          <Link to="/login" className="text-text-muted text-xs hover:text-white transition-colors">
            ← Volver al portal estudiante
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
