import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, ArrowLeft, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { useForgotPassword, useResetPassword, useResendVerification } from '../hooks/useAuth'
import { useAsesorForgotPassword, useAsesorResetPassword, useAsesorResendVerification } from '../hooks/useAsesor'

// ── Tiny OTP component ───────────────────────────────────────────────────────

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
    const next = [...value]; next[i] = char; onChange(next)
    if (i < 5) focus(i + 1)
  }
  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (value[i]) { const next = [...value]; next[i] = ''; onChange(next) }
      else if (i > 0) focus(i - 1)
    } else if (e.key === 'ArrowLeft' && i > 0) focus(i - 1)
    else if (e.key === 'ArrowRight' && i < 5) focus(i + 1)
  }
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = [...value]
    for (let j = 0; j < pasted.length; j++) next[j] = pasted[j]
    onChange(next)
    focus(Math.min(pasted.length, 5))
  }

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
          className={`w-11 h-14 text-center text-2xl font-black text-white rounded-2xl border-2 focus:outline-none focus:ring-2 transition-all caret-transparent
            ${hasError
              ? 'border-red-500/60 focus:ring-red-500/20 bg-red-500/5'
              : value[i]
                ? 'border-primary-dark/60 bg-primary-dark/10 focus:ring-primary-dark/20'
                : 'border-white/10 bg-white/5 focus:border-primary-dark/60 focus:ring-primary-dark/20'
            }`}
        />
      ))}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

type Step = 'email' | 'code' | 'done'

export function ForgotPasswordPage() {
  const [searchParams] = useSearchParams()
  const isMentor = searchParams.get('role') === 'mentor'

  const [step, setStep]       = useState<Step>('email')
  const [email, setEmail]     = useState('')
  const [code, setCode]       = useState<string[]>(Array(6).fill(''))
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const studentForgot = useForgotPassword()
  const studentReset  = useResetPassword()
  const studentResend = useResendVerification()

  const mentorForgot  = useAsesorForgotPassword()
  const mentorReset   = useAsesorResetPassword()
  const mentorResend  = useAsesorResendVerification()

  const forgotMutation = isMentor ? mentorForgot : studentForgot
  const resetMutation  = isMentor ? mentorReset  : studentReset

  const codeStr    = code.join('')
  const isCodeDone = codeStr.length === 6

  // Step 1 — send code
  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    forgotMutation.mutate(email as any, {
      onSuccess: () => setStep('code'),
    })
  }

  // Step 2 — verify code + set new password
  const handleReset = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isCodeDone || !password || password !== confirm) return
    resetMutation.mutate(
      { email, code: codeStr, password } as any,
      { onSuccess: () => setStep('done') }
    )
  }

  const handleResend = () => {
    if (resendCooldown > 0) return
    const fn = isMentor ? mentorResend : studentResend
    ;(fn as any).mutate(email)
    setResendCooldown(60)
    setCode(Array(6).fill(''))
    const interval = setInterval(() => {
      setResendCooldown((c) => { if (c <= 1) { clearInterval(interval); return 0 } return c - 1 })
    }, 1000)
  }

  const resetError = (resetMutation.error as any)?.response?.data?.error
  const forgotError = (forgotMutation.error as any)?.response?.data?.error

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

        {/* Step indicators */}
        <div className="flex items-center gap-2 justify-center mb-6">
          {(['email', 'code', 'done'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s
                  ? 'bg-primary-dark text-white scale-110'
                  : ['code', 'done'].includes(step) && i < ['email', 'code', 'done'].indexOf(step)
                    ? 'bg-neon-green/20 text-neon-green'
                    : 'bg-white/5 text-text-dim'
              }`}>
                {i + 1}
              </div>
              {i < 2 && <div className={`w-8 h-px transition-all ${
                ['code', 'done'].includes(step) && i < ['email', 'code', 'done'].indexOf(step)
                  ? 'bg-neon-green/40' : 'bg-white/10'
              }`} />}
            </div>
          ))}
        </div>

        <div className="bg-surface-raised border border-border-light rounded-3xl p-7">
          <AnimatePresence mode="wait">

            {/* ── Step 1: Email ── */}
            {step === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-primary-dark/20 border border-primary-dark/30 flex items-center justify-center mx-auto mb-3">
                    <Mail size={22} className="text-primary-dark" />
                  </div>
                  <h2 className="text-white font-bold text-lg">¿Olvidaste tu contraseña?</h2>
                  <p className="text-text-muted text-sm mt-1">
                    Te enviaremos un código de 6 dígitos a tu correo institucional.
                  </p>
                </div>

                <form onSubmit={handleSendCode} className="space-y-4">
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

                  {forgotError && (
                    <p className="text-red-400 text-sm text-center">{forgotError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={forgotMutation.isPending || !email}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary-dark to-purple-700 text-white font-bold text-sm disabled:opacity-40 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    {forgotMutation.isPending
                      ? <><RefreshCw size={14} className="animate-spin" /> Enviando…</>
                      : 'Enviar código'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── Step 2: Code + New Password ── */}
            {step === 'code' && (
              <motion.div
                key="code"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="text-center">
                  <h2 className="text-white font-bold text-lg">Ingresa el código</h2>
                  <p className="text-text-muted text-sm mt-1">
                    Revisa <strong className="text-white">{email}</strong>
                  </p>
                </div>

                <form onSubmit={handleReset} className="space-y-5">
                  {/* OTP */}
                  <OTPInput value={code} onChange={setCode} hasError={!!resetError && !password} />

                  {/* New password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                      <Lock size={10} /> Nueva contraseña
                    </label>
                    <input
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      className="w-full rounded-2xl border border-border-light bg-surface-elevated px-4 h-12 text-sm text-white placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary-dark/30 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                      <Lock size={10} /> Confirmar contraseña
                    </label>
                    <input
                      type="password"
                      placeholder="Repite la contraseña"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      className={`w-full rounded-2xl border bg-surface-elevated px-4 h-12 text-sm text-white placeholder:text-text-dim focus:outline-none focus:ring-2 transition-all ${
                        confirm && password !== confirm
                          ? 'border-red-500/60 focus:ring-red-500/20'
                          : 'border-border-light focus:ring-primary-dark/30'
                      }`}
                    />
                    {confirm && password !== confirm && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle size={11} /> Las contraseñas no coinciden
                      </p>
                    )}
                  </div>

                  {resetError && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-2.5">
                      <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
                      <p className="text-xs text-red-400">{resetError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!isCodeDone || !password || password !== confirm || password.length < 8 || resetMutation.isPending}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary-dark to-purple-700 text-white font-bold text-sm disabled:opacity-40 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    {resetMutation.isPending
                      ? <><RefreshCw size={14} className="animate-spin" /> Guardando…</>
                      : 'Cambiar contraseña'}
                  </button>
                </form>

                {/* Resend */}
                <div className="text-center">
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className="text-xs text-text-dim hover:text-white transition-colors disabled:opacity-40"
                  >
                    {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : '¿No recibiste el código? Reenviar'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Success ── */}
            {step === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                  className="flex justify-center"
                >
                  <CheckCircle size={56} className="text-neon-green" />
                </motion.div>
                <div>
                  <h2 className="text-white font-bold text-lg">¡Contraseña actualizada!</h2>
                  <p className="text-text-muted text-sm mt-2">
                    Ya puedes iniciar sesión con tu nueva contraseña.
                  </p>
                </div>
                <Link
                  to={isMentor ? '/asesor/login' : '/login'}
                  className="block w-full h-12 rounded-2xl bg-gradient-to-r from-primary-dark to-purple-700 text-white font-bold text-sm hover:brightness-110 transition-all leading-[3rem]"
                >
                  Ir al inicio de sesión
                </Link>
              </motion.div>
            )}

          </AnimatePresence>
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
