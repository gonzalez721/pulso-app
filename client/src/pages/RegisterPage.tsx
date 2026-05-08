import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Lock, GraduationCap, BookOpen, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useRegister } from '../hooks/useAuth'

const UNIVERSIDADES_CO = [
  'Universidad de los Andes',
  'Universidad Nacional de Colombia',
  'Universidad Javeriana',
  'Universidad de Antioquia',
  'Universidad del Valle',
  'Universidad del Rosario',
  'Universidad EAFIT',
  'Universidad Externado de Colombia',
  'Universidad Distrital Francisco José de Caldas',
  'Universidad Pedagógica Nacional',
  'Universidad del Norte',
  'Universidad Tecnológica de Pereira',
  'Universidad Industrial de Santander',
  'Universidad de Caldas',
  'Universidad de Nariño',
  'Otra universidad',
]

function FieldWrapper({ label, icon: Icon, error, children }: { label: string; icon: any; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
        <Icon size={11} />
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  )
}

function StyledInput({ value, onChange, type = 'text', placeholder, hasError, autoComplete }: {
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; placeholder?: string; hasError?: boolean; autoComplete?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className={`w-full h-12 rounded-2xl border bg-surface-elevated px-4 text-sm text-white placeholder:text-text-dim focus:outline-none focus:ring-2 transition-all ${
        hasError
          ? 'border-red-500/60 focus:ring-red-500/20'
          : 'border-border-light focus:ring-primary-dark/30 focus:border-primary-dark/60'
      }`}
    />
  )
}

export function RegisterPage() {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    universidad: '',
    semestre: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [emailOk, setEmailOk] = useState(false)
  const { mutate, isPending, error } = useRegister()

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.value
    setForm((f) => ({ ...f, [k]: val }))
    if (k === 'email') {
      setEmailOk(val.toLowerCase().endsWith('.edu.co'))
      if (errors.email) setErrors((er) => ({ ...er, email: '' }))
    }
    if (errors[k]) setErrors((er) => ({ ...er, [k]: '' }))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.nombre.trim()) errs.nombre = 'Ingresa tu nombre completo'
    if (!form.email) errs.email = 'Ingresa tu correo institucional'
    else if (!form.email.toLowerCase().endsWith('.edu.co')) errs.email = 'Debe ser un correo .edu.co'
    if (!form.password) errs.password = 'Crea una contraseña'
    else if (form.password.length < 8) errs.password = 'Mínimo 8 caracteres'
    if (!form.universidad) errs.universidad = 'Selecciona tu universidad'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    mutate({
      nombre: form.nombre.trim(),
      email: form.email.toLowerCase(),
      password: form.password,
      universidad: form.universidad,
      semestre: form.semestre ? Number(form.semestre) : undefined,
    } as any)
  }

  return (
    <div className="min-h-screen bg-[#0A0A12] flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden">
      {/* Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-dark/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-neon-green/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10 space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary-dark to-purple-900 flex items-center justify-center mx-auto shadow-glow">
            <span className="text-3xl">⚡</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display text-white tracking-tight">Crear cuenta</h1>
            <p className="text-text-muted mt-1 text-sm">Solo correos institucionales colombianos</p>
          </div>

          {/* Edu.co badge */}
          <div className="inline-flex items-center gap-2 bg-neon-green/10 border border-neon-green/25 rounded-2xl px-4 py-2">
            <GraduationCap size={14} className="text-neon-green" />
            <span className="text-xs font-bold text-neon-green">Exclusivo para estudiantes .edu.co</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-surface-raised border border-border-light rounded-3xl p-5 space-y-4">

          <FieldWrapper label="Nombre completo" icon={User} error={errors.nombre}>
            <StyledInput
              value={form.nombre}
              onChange={set('nombre')}
              placeholder="Tu nombre completo"
              hasError={!!errors.nombre}
              autoComplete="name"
            />
          </FieldWrapper>

          <FieldWrapper label="Correo institucional" icon={Mail} error={errors.email}>
            <div className="relative">
              <StyledInput
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="tu.nombre@universidad.edu.co"
                hasError={!!errors.email}
                autoComplete="email"
              />
              {emailOk && (
                <CheckCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neon-green" />
              )}
            </div>
            {!errors.email && form.email && !emailOk && (
              <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                <AlertCircle size={11} /> El correo debe terminar en .edu.co
              </p>
            )}
          </FieldWrapper>

          <FieldWrapper label="Contraseña" icon={Lock} error={errors.password}>
            <StyledInput
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="Mínimo 8 caracteres"
              hasError={!!errors.password}
              autoComplete="new-password"
            />
          </FieldWrapper>

          <FieldWrapper label="Universidad" icon={GraduationCap} error={errors.universidad}>
            <select
              value={form.universidad}
              onChange={set('universidad')}
              className={`w-full h-12 rounded-2xl border bg-surface-elevated px-4 text-sm focus:outline-none focus:ring-2 transition-all appearance-none ${
                errors.universidad
                  ? 'border-red-500/60 text-white focus:ring-red-500/20'
                  : 'border-border-light text-white focus:ring-primary-dark/30 focus:border-primary-dark/60'
              } ${!form.universidad ? 'text-text-dim' : ''}`}
            >
              <option value="" disabled className="bg-surface-raised text-text-muted">Selecciona tu universidad</option>
              {UNIVERSIDADES_CO.map((u) => (
                <option key={u} value={u} className="bg-surface-raised text-white">{u}</option>
              ))}
            </select>
          </FieldWrapper>

          <FieldWrapper label="Semestre (opcional)" icon={BookOpen}>
            <select
              value={form.semestre}
              onChange={set('semestre')}
              className="w-full h-12 rounded-2xl border border-border-light bg-surface-elevated px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-dark/30 transition-all appearance-none"
            >
              <option value="" className="bg-surface-raised text-text-muted">¿En qué semestre estás?</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                <option key={s} value={s} className="bg-surface-raised text-white">Semestre {s}</option>
              ))}
            </select>
          </FieldWrapper>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400 font-medium">
                {(error as any)?.response?.data?.error ?? 'Error al registrar. Intenta de nuevo.'}
              </p>
            </div>
          )}

          <Button type="submit" loading={isPending} fullWidth size="lg" className="mt-2">
            Crear cuenta gratis
          </Button>
        </form>

        <p className="text-center text-sm text-text-muted">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-bold text-neon-green hover:brightness-110 transition-all">
            Inicia sesión
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
