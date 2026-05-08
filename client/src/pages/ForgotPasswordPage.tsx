import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? 'https://pulso-server.onrender.com'

export function ForgotPasswordPage() {
  const [params]  = useSearchParams()
  const isMentor  = params.get('role') === 'mentor'

  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    try {
      await axios.post(`${BASE}/api/${isMentor ? 'asesor' : 'auth'}/forgot-password`, { email })
      setSent(true)
    } catch {
      setError('Error al enviar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
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
          <p className="text-text-muted text-sm mt-1">Recuperar contraseña</p>
        </div>

        <div className="bg-surface-raised border border-border-light rounded-3xl p-7 space-y-5">
          {!sent ? (
            <>
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary-dark/20 border border-primary-dark/30 flex items-center justify-center mx-auto mb-3">
                  <Mail size={22} className="text-primary-dark" />
                </div>
                <h2 className="text-white font-bold text-lg">¿Olvidaste tu contraseña?</h2>
                <p className="text-text-muted text-sm mt-1">
                  Ingresa tu correo institucional y te enviaremos un enlace para restablecerla.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                    Correo institucional
                  </label>
                  <input
                    type="email"
                    placeholder="tu.nombre@universidad.edu.co"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="w-full rounded-2xl border border-border-light bg-surface-elevated px-4 h-12 text-sm text-white placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary-dark/30 focus:border-primary-dark/60 transition-all"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm text-center font-medium">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary-dark to-purple-700 text-white font-bold text-sm disabled:opacity-40 hover:brightness-110 transition-all"
                >
                  {loading ? 'Enviando…' : 'Enviar enlace de recuperación'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }} className="flex justify-center">
                <CheckCircle size={52} className="text-neon-green" />
              </motion.div>
              <div>
                <h2 className="text-white font-bold text-lg">¡Revisa tu correo!</h2>
                <p className="text-text-muted text-sm mt-2 leading-relaxed">
                  Si el correo está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
                </p>
              </div>
              <div className="bg-primary-dark/10 border border-primary-dark/20 rounded-2xl p-3 text-xs text-primary-dark font-medium">
                📌 Revisa también tu carpeta de spam.
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-5">
          <Link
            to={isMentor ? '/asesor/login' : '/login'}
            className="inline-flex items-center gap-1.5 text-text-muted text-xs hover:text-white transition-colors"
          >
            <ArrowLeft size={12} /> Volver al inicio de sesión
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
