import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useRegister } from '../hooks/useAuth'

export function RegisterPage() {
  const [form, setForm] = useState({ nombre: '', email: '', password: '' })
  const { mutate, isPending, error } = useRegister()

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutate(form)
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
          <h1 className="text-3xl font-extrabold font-display text-primary-dark">Crear cuenta</h1>
          <p className="text-text-muted mt-1">Empieza a controlar tus finanzas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Tu nombre"
            value={form.nombre}
            onChange={set('nombre')}
            required
            autoComplete="name"
          />
          <Input
            label="Email universitario"
            type="email"
            placeholder="tu@universidad.edu"
            value={form.email}
            onChange={set('email')}
            required
            autoComplete="email"
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={form.password}
            onChange={set('password')}
            required
            minLength={8}
            autoComplete="new-password"
          />

          {error && (
            <p className="text-sm text-red-500 font-medium text-center">
              Error al registrar. El email puede ya estar en uso.
            </p>
          )}

          <Button type="submit" loading={isPending} fullWidth size="lg" className="mt-2">
            Crear cuenta gratis
          </Button>
        </form>

        <p className="text-center text-sm text-text-muted">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-bold text-primary-dark hover:underline">
            Inicia sesión
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
