import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, CheckCircle, Eye, EyeOff } from 'lucide-react'
import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? 'https://pulso-server.onrender.com'

export function ResetPasswordPage() {
  const [params]   = useSearchParams()
  const token      = params.get('token') ?? ''
  const isMentor   = params.get('role') === 'mentor'
  const navigate   = useNavigate()

  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [loading, setLoading]       = useState(false)
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Mínimo 8 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    setLoading(true)
    setError('')
    try {
      await axios.post(`${BASE}/api/${isMentor ? 'asesor' : 'auth'}/reset-password`, { token, password })
      setDone(true)
      setTimeout(() => navigate(isMentor ? '/asesor/login' : '/login'), 3000)
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Error al restablecer. El enlace puede haber expirado.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0A0A12] flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <p className="text-red-400 font-medium">Enlace inválido.</p>
          <Link to="/" className="text-primary-dark text-sm hover:brightness-110">← Volver al inicio</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A12] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-dark/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-neon-green/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary-dark to-purple-900 flex items-center justify-center mx-auto mb-3 shadow-glow">
            <span className="text-3xl">⚡</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white font-display">PULSO</h1>
          <p className="text-text-muted text-sm mt-1">Nueva contraseña</p>
        </div>

        <div className="bg-surface-raised border border-border-light rounded-3xl p-7 space-y-5">
          {!done ? (
            <>
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary-dark/20 border border-primary-dark/30 flex items-center justify-center mx-auto mb-3">
                  <Lock size={22} className="text-primary-dark" />
                </div>
                <h2 className="text-white font-bold text-lg">Crea una nueva contraseña</h2>
                <p className="text-text-muted text-sm mt-1">Debe tener al menos 8 caracteres.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Nueva contraseña</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      className="w-full rounded-2xl border border-border-light bg-surface-elevated px-4 pr-12 h-12 text-sm text-white placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary-dark/30 focus:border-primary-dark/60 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-white transition-colors"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Confirmar contraseña</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Repite la contraseña"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    required
                    className="w-full rounded-2xl border border-border-light bg-surface-elevated px-4 h-12 text-sm text-white placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary-dark/30 focus:border-primary-dark/60 transition-all"
                  />
                </div>

                {/* Strength indicator */}
                {password.length > 0 && (
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          password.length >= level * 3
                            ? level <= 2 ? 'bg-red-400' : level === 3 ? 'bg-yellow-400' : 'bg-neon-green'
                            : 'bg-border-light'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {error && <p className="text-red-400 text-sm text-center font-medium">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !password || !confirm}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary-dark to-purple-700 text-white font-bold text-sm disabled:opacity-40 hover:brightness-110 transition-all"
                >
                  {loading ? 'Guardando…' : 'Guardar nueva contraseña'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }} className="flex justify-center">
                <CheckCircle size={52} className="text-neon-green" />
              </motion.div>
              <div>
                <h2 className="text-white font-bold text-lg">¡Contraseña actualizada!</h2>
                <p className="text-text-muted text-sm mt-1">Redirigiendo al inicio de sesión…</p>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-5">
          <Link to={isMentor ? '/asesor/login' : '/login'} className="text-text-muted text-xs hover:text-white transition-colors">
            ← Volver al inicio de sesión
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
