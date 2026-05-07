import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAsesorLogin } from '../../hooks/useAsesor'

export function AsesorLoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const { mutate, isPending, error } = useAsesorLogin()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2D1B4E] to-[#4A2D7A] flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-[1.8rem] bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4 shadow-float backdrop-blur">
            <span className="text-4xl">🎓</span>
          </div>
          <h1 className="text-3xl font-extrabold font-display text-white">Portal Asesor</h1>
          <p className="text-white/60 mt-1 text-sm">PULSO — Acompañamiento Financiero</p>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-6 space-y-4">
          <Input
            label="Email institucional"
            type="email"
            placeholder="tu@pulso.app"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/90"
            autoComplete="email"
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white/90"
            autoComplete="current-password"
          />

          {error && (
            <p className="text-red-300 text-sm font-medium text-center">
              Credenciales incorrectas. Intenta de nuevo.
            </p>
          )}

          <Button
            onClick={() => mutate({ email, password })}
            loading={isPending}
            disabled={!email || !password}
            fullWidth
            size="lg"
            className="bg-white text-primary-dark hover:bg-primary-light mt-2"
          >
            Ingresar al portal
          </Button>
        </div>

        {/* Demo hint */}
        <div className="mt-4 text-center">
          <p className="text-white/40 text-xs">
            Demo: sofia.ramirez@pulso.app / asesor1234
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-white/50 text-xs hover:text-white/80 transition-colors">
            ← Volver al portal estudiante
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
