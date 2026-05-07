import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useLogin } from '../hooks/useAuth'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { mutate, isPending, error } = useLogin()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutate({ email, password })
  }

  return (
    <div className="min-h-screen bg-primary-light flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-[1.5rem] bg-primary-dark flex items-center justify-center mx-auto mb-4 shadow-float">
            <span className="text-3xl">💸</span>
          </div>
          <h1 className="text-3xl font-extrabold font-display text-primary-dark">PULSO</h1>
          <p className="text-text-muted mt-1">Inicia sesión en tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="tu@email.com"
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

          {error && (
            <p className="text-sm text-red-500 font-medium text-center">
              Credenciales incorrectas. Intenta de nuevo.
            </p>
          )}

          <Button type="submit" loading={isPending} fullWidth size="lg" className="mt-2">
            Iniciar sesión
          </Button>
        </form>

        <p className="text-center text-sm text-text-muted">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-bold text-primary-dark hover:underline">
            Regístrate gratis
          </Link>
        </p>

        <div className="bg-white/60 rounded-2xl p-3 text-center">
          <p className="text-xs text-text-muted font-medium">Demo: demo@pulso.app / demo1234</p>
        </div>
      </motion.div>
    </div>
  )
}
