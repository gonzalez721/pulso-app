import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, AlertCircle, CheckCircle, GraduationCap, Mail, Lock, BookOpen, User } from 'lucide-react'
import { pactoApi, authApi } from '../api/endpoints'
import { useAuthStore } from '../store/authStore'
import { useAcceptPacto } from '../hooks/usePacto'
import { Button } from '../components/ui/Button'

const UNIVERSIDADES_CO = [
  'Universidad de los Andes', 'Universidad Nacional de Colombia', 'Universidad Javeriana',
  'Universidad de Antioquia', 'Universidad del Valle', 'Universidad del Rosario',
  'Universidad EAFIT', 'Universidad Externado de Colombia',
  'Universidad Distrital Francisco José de Caldas', 'Universidad Pedagógica Nacional',
  'Universidad del Norte', 'Universidad Tecnológica de Pereira',
  'Universidad Industrial de Santander', 'Universidad de Caldas',
  'Universidad de Nariño', 'Otra universidad',
]

interface InviteInfo {
  alreadyAccepted: boolean
  inviterNombre: string
  inviterFotoUrl?: string
  partnerNombre?: string
}

function getInitials(n: string) {
  return n.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function StyledInput({ value, onChange, type = 'text', placeholder, hasError, autoComplete, readOnly }: {
  value: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; placeholder?: string; hasError?: boolean; autoComplete?: string; readOnly?: boolean
}) {
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      autoComplete={autoComplete} readOnly={readOnly}
      className={`w-full h-12 rounded-2xl border bg-surface-elevated px-4 text-sm text-white placeholder:text-text-dim focus:outline-none focus:ring-2 transition-all ${
        hasError ? 'border-red-500/60 focus:ring-red-500/20'
        : readOnly ? 'border-border-light opacity-60 cursor-default'
        : 'border-border-light focus:ring-primary-dark/30 focus:border-primary-dark/60'
      }`}
    />
  )
}

export function PactoPartnerPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const { mutate: acceptPacto, isPending: accepting } = useAcceptPacto()

  const [info, setInfo] = useState<InviteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Registration form
  const [form, setForm] = useState({ nombre: '', email: '', password: '', universidad: '', semestre: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [emailOk, setEmailOk] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) return
    pactoApi.getInviteInfo(token).then(r => {
      setInfo(r.data)
      setForm(f => ({ ...f, nombre: r.data.partnerNombre ?? '' }))
    }).catch(() => setError('Esta invitación no es válida o ya expiró.'))
      .finally(() => setLoading(false))
  }, [token])

  // If user is already logged in → just link and redirect
  useEffect(() => {
    if (isAuthenticated && info && !info.alreadyAccepted && token) {
      acceptPacto(token, {
        onSuccess: () => navigate('/pacto'),
        onError: () => navigate('/pacto'),
      })
    }
  }, [isAuthenticated, info])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.value
    setForm(f => ({ ...f, [k]: val }))
    if (k === 'email') setEmailOk(val.toLowerCase().endsWith('.edu.co'))
    if (errors[k]) setErrors(er => ({ ...er, [k]: '' }))
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

  const { setAuth } = useAuthStore()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await authApi.register({
        nombre: form.nombre.trim(),
        email: form.email.toLowerCase(),
        password: form.password,
        universidad: form.universidad,
        semestre: form.semestre ? Number(form.semestre) : undefined,
      } as any)
      const { user, accessToken, refreshToken } = res.data as any
      // Properly authenticate in the zustand store so API calls work
      setAuth(user, accessToken, refreshToken)
      // Store pacto token to be accepted after email verification
      localStorage.setItem('pendingPactoToken', token!)
      setDone(true)
      setTimeout(() => navigate(`/verify-code?email=${encodeURIComponent(form.email)}`), 1500)
    } catch (err: any) {
      setSubmitError(err?.response?.data?.error ?? 'Error al registrar. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A12' }}>
      <div className="w-8 h-8 rounded-full border-2 border-primary-dark border-t-transparent animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#0A0A12' }}>
      <p className="text-4xl mb-4">🔒</p>
      <p className="text-white font-bold text-lg mb-2">Invitación inválida</p>
      <p className="text-text-muted text-sm">{error}</p>
    </div>
  )

  if (info?.alreadyAccepted) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#0A0A12' }}>
      <CheckCircle size={48} className="text-neon-green mx-auto mb-4" />
      <p className="text-white font-bold text-lg mb-1">¡PACTO ya activo!</p>
      <p className="text-text-muted text-sm">Tú y {info.inviterNombre} ya están conectados.</p>
      <button onClick={() => navigate('/')} className="mt-6 text-sm font-bold text-neon-green underline">
        Ir a la app →
      </button>
    </div>
  )

  if (done) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#0A0A12' }}>
      <CheckCircle size={48} className="text-neon-green mx-auto mb-4" />
      <p className="text-white font-bold text-lg">¡Cuenta creada!</p>
      <p className="text-text-muted text-sm mt-1">Verifica tu correo para activar tu PACTO con {info?.inviterNombre}.</p>
    </div>
  )

  return (
    <div className="min-h-screen pb-16 flex flex-col items-center" style={{ background: '#0A0A12' }}>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-dark/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm px-5 pt-12 space-y-6 relative">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Shield size={24} style={{ color: '#A890FF' }} />
            <span className="text-2xl font-extrabold text-white">PACTO</span>
          </div>

          {/* Inviter card */}
          <div className="rounded-3xl p-5 text-center"
            style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #2A1A4E 100%)', border: '1px solid rgba(124,77,255,0.25)' }}>
            <div className="w-16 h-16 rounded-2xl bg-surface-elevated border border-border-light flex items-center justify-center overflow-hidden mx-auto mb-3">
              {info?.inviterFotoUrl
                ? <img src={info.inviterFotoUrl} className="w-full h-full object-cover" alt="" />
                : <span className="text-xl font-extrabold text-primary-dark">{getInitials(info?.inviterNombre ?? '?')}</span>
              }
            </div>
            <p className="font-extrabold text-white text-lg">{info?.inviterNombre}</p>
            <p className="text-text-muted text-sm mt-1">te invita a ser su partner PACTO en PULSO 🤝</p>
          </div>

          <div className="rounded-2xl px-4 py-3 text-xs text-text-muted text-left leading-relaxed"
            style={{ background: 'rgba(168,255,62,0.05)', border: '1px solid rgba(168,255,62,0.12)' }}>
            🏆 Compitan semanalmente a ver quién controla mejor su presupuesto. {info?.inviterNombre} te notificará cuando haga un gasto de riesgo para que puedas opinar.
          </div>
        </motion.div>

        {/* Registration form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleRegister}
          className="bg-surface-raised border border-border-light rounded-3xl p-5 space-y-4"
        >
          <p className="text-sm font-bold text-white text-center">Crear tu cuenta gratis</p>

          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
              <User size={11} /> Nombre completo
            </label>
            <StyledInput value={form.nombre} onChange={set('nombre')} placeholder="Tu nombre" hasError={!!errors.nombre} autoComplete="name" />
            {errors.nombre && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} />{errors.nombre}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
              <Mail size={11} /> Correo institucional
            </label>
            <div className="relative">
              <StyledInput type="email" value={form.email} onChange={set('email')}
                placeholder="tu.nombre@universidad.edu.co" hasError={!!errors.email} autoComplete="email" />
              {emailOk && <CheckCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neon-green" />}
            </div>
            {errors.email && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} />{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
              <Lock size={11} /> Contraseña
            </label>
            <StyledInput type="password" value={form.password} onChange={set('password')}
              placeholder="Mínimo 8 caracteres" hasError={!!errors.password} autoComplete="new-password" />
            {errors.password && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} />{errors.password}</p>}
          </div>

          {/* Universidad */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
              <GraduationCap size={11} /> Universidad
            </label>
            <select value={form.universidad} onChange={set('universidad')}
              className={`w-full h-12 rounded-2xl border bg-surface-elevated px-4 text-sm focus:outline-none focus:ring-2 appearance-none transition-all ${
                errors.universidad ? 'border-red-500/60 text-white' : 'border-border-light text-white focus:ring-primary-dark/30 focus:border-primary-dark/60'
              } ${!form.universidad ? 'text-text-dim' : ''}`}>
              <option value="" disabled className="bg-surface-raised text-text-muted">Selecciona tu universidad</option>
              {UNIVERSIDADES_CO.map(u => <option key={u} value={u} className="bg-surface-raised text-white">{u}</option>)}
            </select>
            {errors.universidad && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} />{errors.universidad}</p>}
          </div>

          {/* Semestre */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
              <BookOpen size={11} /> Semestre (opcional)
            </label>
            <select value={form.semestre} onChange={set('semestre')}
              className="w-full h-12 rounded-2xl border border-border-light bg-surface-elevated px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-dark/30 appearance-none">
              <option value="" className="bg-surface-raised text-text-muted">¿En qué semestre estás?</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(s => (
                <option key={s} value={s} className="bg-surface-raised text-white">Semestre {s}</option>
              ))}
            </select>
          </div>

          {submitError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{submitError}</p>
            </div>
          )}

          <Button type="submit" loading={submitting} fullWidth size="lg">
            🤝 Unirme al PACTO
          </Button>
        </motion.form>

        <p className="text-center text-xs text-text-dim pb-4">
          Solo correos institucionales .edu.co · Powered by <span className="font-bold text-text-muted">PULSO</span>
        </p>
      </div>
    </div>
  )
}
