import { useRef, useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, RefreshCw, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { useVerifyCode, useResendVerification } from '../hooks/useAuth'
import { useAsesorVerifyCode, useAsesorResendVerification } from '../hooks/useAsesor'

function OTPInput({
  value,
  onChange,
  hasError,
}: {
  value: string[]
  onChange: (val: string[]) => void
  hasError?: boolean
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const focus = (i: number) => inputs.current[i]?.focus()

  const handleChange = (i: number, raw: string) => {
    const char = raw.replace(/\D/g, '').slice(-1)
    if (!char) return
    const next = [...value]
    next[i] = char
    onChange(next)
    if (i < 5) focus(i + 1)
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (value[i]) {
        const next = [...value]; next[i] = ''; onChange(next)
      } else if (i > 0) {
        focus(i - 1)
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      focus(i - 1)
    } else if (e.key === 'ArrowRight' && i < 5) {
      focus(i + 1)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = [...value]
    for (let j = 0; j < pasted.length; j++) next[j] = pasted[j]
    onChange(next)
    const lastFilled = Math.min(pasted.length, 5)
    focus(lastFilled)
  }

  const borderColor = hasError
    ? 'border-red-500/60 focus:ring-red-500/20 bg-red-500/5'
    : 'border-white/10 focus:border-primary-dark/60 focus:ring-primary-dark/20 bg-white/5'

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className={`w-11 h-14 text-center text-2xl font-black text-white rounded-2xl border-2 focus:outline-none focus:ring-2 transition-all caret-transparent ${borderColor} ${
            value[i] ? 'border-primary-dark/60 bg-primary-dark/10' : ''
          }`}
        />
      ))}
    </div>
  )
}

export function VerifyCodePage({ isMentor = false }: { isMentor?: boolean }) {
  const [params] = useSearchParams()
  const navigate  = useNavigate()
  const email     = params.get('email') ?? ''

  const [code, setCode]           = useState<string[]>(Array(6).fill(''))
  const [resendCooldown, setResendCooldown] = useState(0)
  const [verified, setVerified]   = useState(false)

  // Hooks — student
  const studentVerify   = useVerifyCode()
  const studentResend   = useResendVerification()

  // Hooks — mentor
  const mentorVerify  = useAsesorVerifyCode()
  const mentorResend  = useAsesorResendVerification()

  const verify  = isMentor ? mentorVerify  : studentVerify
  const resend  = isMentor ? mentorResend  : studentResend

  const codeStr = code.join('')
  const isComplete = codeStr.length === 6

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    if (isComplete && !verify.isPending && !verified) {
      handleSubmit()
    }
  }, [codeStr])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const handleSubmit = useCallback(() => {
    if (!isComplete || !email) return
    if (isMentor) {
      (mentorVerify as any).mutate(
        { email, code: codeStr },
        { onSuccess: () => setVerified(true) }
      )
    } else {
      (studentVerify as any).mutate(
        { email, code: codeStr },
        { onSuccess: () => setVerified(true) }
      )
    }
  }, [codeStr, email, isMentor])

  const handleResend = () => {
    if (resendCooldown > 0) return
    const fn = isMentor ? mentorResend : studentResend
    ;(fn as any).mutate(email)
    setResendCooldown(60)
    setCode(Array(6).fill(''))
  }

  const verifyError = (verify.error as any)?.response?.data?.error

  const obfuscated = email
    ? email.replace(/^(.{2})(.+?)(@.+)$/, (_, a, b, c) => a + b.replace(/./g, '•') + c)
    : ''

  return (
    <div className="min-h-screen bg-[#0A0A12] flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-dark/15 rounded-full blur-3xl pointer-events-none" />
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
        </div>

        <AnimatePresence mode="wait">
          {verified ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-raised border border-neon-green/20 rounded-3xl p-8 text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10, delay: 0.1 }}
                className="flex justify-center"
              >
                <CheckCircle size={60} className="text-neon-green" />
              </motion.div>
              <div>
                <h2 className="text-white font-bold text-xl">¡Correo verificado!</h2>
                <p className="text-text-muted text-sm mt-2">Tu cuenta está activa. Redirigiendo…</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              className="bg-surface-raised border border-border-light rounded-3xl p-7 space-y-6"
            >
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-primary-dark/15 border border-primary-dark/25 flex items-center justify-center mx-auto">
                  <ShieldCheck size={24} className="text-primary-dark" />
                </div>
                <h2 className="text-white font-bold text-xl">Verifica tu correo</h2>
                <p className="text-text-muted text-sm leading-relaxed">
                  Enviamos un código de 6 dígitos a<br />
                  <strong className="text-white">{obfuscated || 'tu correo'}</strong>
                </p>
              </div>

              {/* OTP boxes */}
              <div className="space-y-4">
                <OTPInput value={code} onChange={setCode} hasError={!!verifyError} />

                <AnimatePresence>
                  {verifyError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-2.5"
                    >
                      <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
                      <p className="text-xs text-red-400">{verifyError}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!isComplete || verify.isPending}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary-dark to-purple-700 text-white font-bold text-sm disabled:opacity-40 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  {verify.isPending ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    'Verificar cuenta'
                  )}
                </button>
              </div>

              {/* Resend */}
              <div className="text-center space-y-1">
                <p className="text-text-dim text-xs">¿No recibiste el código?</p>
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resend.isPending}
                  className="text-xs font-bold text-primary-dark hover:brightness-110 transition-all disabled:opacity-40 flex items-center gap-1.5 mx-auto"
                >
                  {resend.isPending ? (
                    <RefreshCw size={11} className="animate-spin" />
                  ) : null}
                  {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código'}
                </button>
                {resend.isSuccess && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-neon-green"
                  >
                    ✓ Nuevo código enviado
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back link */}
        <div className="text-center mt-5">
          <button
            onClick={() => navigate(isMentor ? '/asesor/login' : '/login')}
            className="inline-flex items-center gap-1.5 text-text-muted text-xs hover:text-white transition-colors"
          >
            <ArrowLeft size={12} /> Volver al inicio de sesión
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// Mentor variant
export function AsesorVerifyCodePage() {
  return <VerifyCodePage isMentor />
}
