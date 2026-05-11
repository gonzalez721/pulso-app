import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Clock, Shield } from 'lucide-react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { useAlertaStatus } from '../hooks/usePacto'

interface Riesgo {
  nivel: 'medio' | 'alto'
  razonesRiesgo: string[]
  alertaId?: string
}

interface Props {
  open: boolean
  riesgo: Riesgo | null
  monto: number
  categoria: string
  partnerNombre?: string | null
  onContinue: () => void  // user decides to proceed anyway
  onCancel: () => void    // user decides to cancel the spend
}

const COUNTDOWN_SECS = 60

export function PactoAlertaModal({ open, riesgo, monto, categoria, partnerNombre, onContinue, onCancel }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECS)
  const [partnerResponded, setPartnerResponded] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Poll for partner response
  const { data: alertaStatus } = useAlertaStatus(
    riesgo?.alertaId ?? null,
    open && !!riesgo?.alertaId && !partnerResponded,
  )

  // Detect partner response
  useEffect(() => {
    if (!alertaStatus) return
    if (alertaStatus.estado === 'aprobado' || alertaStatus.estado === 'rechazado') {
      setPartnerResponded(true)
    }
  }, [alertaStatus])

  // Countdown timer
  useEffect(() => {
    if (!open) { setSecondsLeft(COUNTDOWN_SECS); setPartnerResponded(false); return }

    setSecondsLeft(COUNTDOWN_SECS)
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [open])

  if (!riesgo) return null

  const progress = secondsLeft / COUNTDOWN_SECS
  const circumference = 2 * Math.PI * 28
  const partnerDecision = alertaStatus?.estado as string | undefined

  return (
    <Modal open={open} onClose={() => {}} title="" hideClose>
      <div className="px-5 py-4 flex flex-col gap-5">

        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield size={20} className="text-yellow-400" />
            <span className="font-extrabold text-white text-lg">Pausa PACTO</span>
          </div>
          <p className="text-text-muted text-sm">
            Antes de registrar este gasto, tómate un momento.
          </p>
        </div>

        {/* Amount + category */}
        <div
          className="rounded-3xl p-5 text-center"
          style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #2A1A1E 100%)', border: '1px solid rgba(255,165,0,0.3)' }}
        >
          <p className="text-text-muted text-xs font-bold uppercase tracking-wide mb-1">Gasto detectado</p>
          <p className="text-3xl font-extrabold text-white">
            ${monto.toLocaleString('es-CO')}
          </p>
          <p className="text-sm text-text-muted mt-0.5">{categoria}</p>
        </div>

        {/* Risk reasons */}
        {riesgo.razonesRiesgo.length > 0 && (
          <div className="space-y-2">
            {riesgo.razonesRiesgo.map((r, i) => (
              <div
                key={i}
                className="flex items-start gap-2 px-4 py-2.5 rounded-2xl"
                style={{ background: 'rgba(255,165,0,0.07)', border: '1px solid rgba(255,165,0,0.2)' }}
              >
                <span className="text-yellow-400 mt-0.5 flex-shrink-0">⚠️</span>
                <span className="text-sm text-white leading-snug">{r}</span>
              </div>
            ))}
          </div>
        )}

        {/* Partner notification + countdown */}
        {riesgo.nivel === 'alto' && partnerNombre ? (
          <AnimatePresence mode="wait">
            {!partnerResponded ? (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 py-2"
              >
                <p className="text-sm text-text-muted text-center">
                  <span className="text-white font-bold">{partnerNombre}</span> fue notificado.
                  Esperando respuesta…
                </p>
                {/* Circular countdown */}
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="absolute inset-0 -rotate-90" width="80" height="80">
                    <circle
                      cx="40" cy="40" r="28"
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="40" cy="40" r="28"
                      fill="none"
                      stroke={secondsLeft > 20 ? '#A8FF3E' : secondsLeft > 10 ? '#FFB800' : '#FF4757'}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference * (1 - progress)}
                      style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                    />
                  </svg>
                  <span className="text-xl font-extrabold text-white z-10">{secondsLeft}</span>
                </div>
                {secondsLeft === 0 && (
                  <p className="text-xs text-text-dim">Sin respuesta — puedes decidir ahora</p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="responded"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl p-5 text-center"
                style={{
                  background: partnerDecision === 'aprobado'
                    ? 'rgba(168,255,62,0.08)'
                    : 'rgba(255,71,87,0.08)',
                  border: `1px solid ${partnerDecision === 'aprobado' ? 'rgba(168,255,62,0.3)' : 'rgba(255,71,87,0.3)'}`,
                }}
              >
                {partnerDecision === 'aprobado' ? (
                  <CheckCircle size={28} className="text-neon-green mx-auto mb-2" />
                ) : (
                  <XCircle size={28} className="text-red-400 mx-auto mb-2" />
                )}
                <p className="font-extrabold text-white text-base">
                  {partnerDecision === 'aprobado' ? `${partnerNombre} lo aprobó ✅` : `${partnerNombre} lo frenó 🛑`}
                </p>
                {alertaStatus?.respuestaMensaje && (
                  <p className="text-sm text-text-muted mt-1 leading-relaxed italic">
                    "{alertaStatus.respuestaMensaje}"
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          /* Medio risk — just a countdown, no partner */
          <div className="flex items-center justify-center gap-3 py-2">
            <Clock size={16} className="text-text-muted" />
            <span className="text-text-muted text-sm">
              {secondsLeft > 0 ? `Reflexiona ${secondsLeft}s antes de decidir` : 'Toma tu decisión'}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-1">
          <Button onClick={onContinue} fullWidth size="lg">
            ✓ Sí, registrar de todas formas
          </Button>
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-2xl text-sm font-semibold transition-all"
            style={{
              background: 'rgba(168,255,62,0.06)',
              border: '1px solid rgba(168,255,62,0.2)',
              color: '#A8FF3E',
            }}
          >
            ✕ Cancelar este gasto
          </button>
        </div>

      </div>
    </Modal>
  )
}
