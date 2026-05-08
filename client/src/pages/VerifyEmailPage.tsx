import { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { useAsesorStore } from '../store/asesorStore'

const BASE = import.meta.env.VITE_API_URL ?? 'https://pulso-server.onrender.com'

type Status = 'loading' | 'success' | 'error' | 'pending'

export function VerifyEmailPage() {
  const [params]  = useSearchParams()
  const token     = params.get('token')
  const isMentor  = params.get('role') === 'mentor'

  const [status, setStatus]     = useState<Status>(token ? 'loading' : 'pending')
  const [message, setMessage]   = useState('')
  const [resendEmail, setResend] = useState('')
  const [resendSent, setResendSent] = useState(false)

  const navigate = useNavigate()
  const { setAuth }        = useAuthStore()
  const { setAuth: setAsesorAuth } = useAsesorStore()

  useEffect(() => {
    if (!token) return

    const endpoint = isMentor
      ? `${BASE}/api/asesor/verify-email?token=${token}`
      : `${BASE}/api/auth/verify-email?token=${token}`

    axios.get(endpoint)
      .then(({ data }) => {
        if (isMentor) {
          setAsesorAuth(data.asesor, data.accessToken, data.refreshToken)
          setStatus('success')
          setTimeout(() => navigate('/asesor/dashboard'), 2000)
        } else {
          setAuth(data.user, data.accessToken, data.refreshToken)
          setStatus('success')
          setTimeout(() => navigate(data.user.onboardingComplete ? '/dashboard' : '/onboarding'), 2000)
        }
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err?.response?.data?.error ?? 'Enlace inválido o expirado.')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const handleResend = async () => {
    if (!resendEmail) return
    const url = `${BASE}/api/${isMentor ? 'asesor' : 'auth'}/resend-verification`
    await axios.post(url, { email: resendEmail }).catch(() => {})
    setResendSent(true)
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
          <p className="text-text-muted text-sm mt-1">Verificación de cuenta</p>
        </div>

        <div className="bg-surface-raised border border-border-light rounded-3xl p-7 text-center space-y-5">

          {/* Loading */}
          {status === 'loading' && (
            <>
              <Loader2 size={48} className="text-primary-dark animate-spin mx-auto" />
              <div>
                <h2 className="text-white font-bold text-lg">Verificando tu correo…</h2>
                <p className="text-text-muted text-sm mt-1">Un momento por favor.</p>
              </div>
            </>
          )}

          {/* Success */}
          {status === 'success' && (
            <>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }} className="flex justify-center">
                <CheckCircle size={52} className="text-neon-green" />
              </motion.div>
              <div>
                <h2 className="text-white font-bold text-lg">¡Correo verificado! 🎉</h2>
                <p className="text-text-muted text-sm mt-1">Redirigiendo a tu cuenta…</p>
              </div>
            </>
          )}

          {/* Error */}
          {status === 'error' && (
            <>
              <XCircle size={52} className="text-red-400 mx-auto" />
              <div>
                <h2 className="text-white font-bold text-lg">Enlace inválido</h2>
                <p className="text-red-400 text-sm mt-1">{message}</p>
              </div>
              <div className="space-y-3 pt-1">
                <p className="text-text-muted text-xs">¿Quieres que te enviemos un nuevo enlace?</p>
                {!resendSent ? (
                  <div className="space-y-2">
                    <input
                      type="email"
                      placeholder="tu.correo@universidad.edu.co"
                      value={resendEmail}
                      onChange={(e) => setResend(e.target.value)}
                      className="w-full rounded-2xl border border-border-light bg-surface-elevated px-4 h-11 text-sm text-white placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary-dark/30 transition-all"
                    />
                    <button
                      onClick={handleResend}
                      disabled={!resendEmail}
                      className="w-full h-11 rounded-2xl bg-primary-dark text-white font-bold text-sm disabled:opacity-40 hover:brightness-110 transition-all"
                    >
                      Reenviar enlace
                    </button>
                  </div>
                ) : (
                  <p className="text-neon-green text-sm font-medium">✅ ¡Enlace enviado! Revisa tu bandeja.</p>
                )}
              </div>
            </>
          )}

          {/* Pending (no token — shown after register) */}
          {status === 'pending' && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-primary-dark/20 border border-primary-dark/30 flex items-center justify-center mx-auto">
                <Mail size={28} className="text-primary-dark" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Revisa tu correo 📬</h2>
                <p className="text-text-muted text-sm mt-2 leading-relaxed">
                  Te enviamos un enlace de verificación a tu correo institucional.<br />
                  Haz clic en él para activar tu cuenta.
                </p>
              </div>
              <div className="bg-primary-dark/10 border border-primary-dark/20 rounded-2xl p-3 text-xs text-primary-dark font-medium">
                📌 Revisa también tu carpeta de <strong>spam</strong> si no lo ves.
              </div>
            </>
          )}

        </div>

        <div className="text-center mt-5">
          <Link to="/" className="text-text-muted text-xs hover:text-white transition-colors">
            ← Volver al inicio
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
