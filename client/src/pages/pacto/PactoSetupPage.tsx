import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Users, Bot, Copy, Check, ChevronRight, ArrowLeft, Clock, MessageCircle, Zap, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePactoStatus, useSetupPacto, useHistorialAlertas } from '../../hooks/usePacto'
import { useAuthStore } from '../../store/authStore'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const ESTADO_LABEL: Record<string, { label: string; color: string }> = {
  esperando:  { label: 'Esperando respuesta',  color: 'text-amber-400' },
  respondida: { label: 'Partner respondió',    color: 'text-neon-green' },
  timeout:    { label: 'Sin respuesta',         color: 'text-text-muted' },
  auto:       { label: 'Respondida por IA',     color: 'text-primary-dark/80' },
}

export function PactoSetupPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: pactoStatus, isLoading } = usePactoStatus()
  const { mutate: setup, isPending: settingUp } = useSetupPacto()
  const { data: historial } = useHistorialAlertas()

  const [copied, setCopied] = useState(false)
  const [modo, setModo] = useState<'humano' | 'ia'>(pactoStatus?.modo as any ?? 'humano')

  const inviteUrl = pactoStatus?.inviteUrl ?? ''

  const handleActivar = () => {
    setup(modo)
  }

  const handleCopiar = () => {
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hola! Te invito a ser mi partner PACTO en PULSO 🛡️\n\nCuando detecte que voy a hacer una compra de riesgo, te avisaré y tendrás 60 segundos para responderme.\n\nEntra acá: ${inviteUrl}`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const isActivo = pactoStatus?.activo && pactoStatus?.estado === 'activo'

  return (
    <div className="min-h-screen px-5 pt-14 pb-32 relative" style={{ background: '#0A0A12' }}>
      {/* Glow bg */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-dark/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <ArrowLeft size={16} className="text-text-muted" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-white">PACTO</h1>
          <p className="text-xs text-text-muted">Tu sistema de responsabilidad financiera</p>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-primary-dark/30 border-t-primary-dark animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">

          {/* Hero — what is PACTO */}
          {!isActivo && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl p-5"
              style={{ background: 'linear-gradient(135deg, rgba(124,77,255,0.15) 0%, rgba(124,77,255,0.05) 100%)', border: '1px solid rgba(124,77,255,0.25)' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-primary-dark/30 flex items-center justify-center">
                  <Shield size={22} className="text-primary-dark" />
                </div>
                <div>
                  <p className="font-extrabold text-white text-base">¿Qué es PACTO?</p>
                  <p className="text-xs text-text-muted">Pausa antes de compras impulsivas</p>
                </div>
              </div>
              <p className="text-sm text-text-muted leading-relaxed">
                Cuando PULSO detecte que vas a hacer una compra de riesgo, <span className="text-white font-semibold">pausará tu pantalla</span> y notificará a alguien de confianza. Tendrán 60 segundos para enviarte un mensaje de apoyo.
              </p>
            </motion.div>
          )}

          {/* Active status banner */}
          {isActivo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl p-4"
              style={{ background: 'rgba(168,255,62,0.08)', border: '1px solid rgba(168,255,62,0.25)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center">
                  <Shield size={18} className="text-neon-green" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-neon-green text-sm">PACTO activo</p>
                  <p className="text-xs text-text-muted">
                    {pactoStatus?.modo === 'humano'
                      ? `Partner: ${pactoStatus.partnerNombre ?? 'esperando confirmación...'}`
                      : 'Modo IA — PULSO responde automáticamente'
                    }
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              </div>
            </motion.div>
          )}

          {/* Mode selector */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl p-4 space-y-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-sm font-bold text-white">Elige tu modo</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Humano */}
              <button
                onClick={() => setModo('humano')}
                className={`rounded-2xl p-4 text-left transition-all border ${
                  modo === 'humano'
                    ? 'border-primary-dark/60 bg-primary-dark/15'
                    : 'border-white/8 bg-white/3 hover:bg-white/5'
                }`}
              >
                <Users size={20} className={modo === 'humano' ? 'text-primary-dark mb-2' : 'text-text-muted mb-2'} />
                <p className={`text-sm font-bold ${modo === 'humano' ? 'text-white' : 'text-text-muted'}`}>Partner real</p>
                <p className="text-xs text-text-muted mt-1">Un amigo o familiar te acompaña</p>
              </button>

              {/* IA */}
              <button
                onClick={() => setModo('ia')}
                className={`rounded-2xl p-4 text-left transition-all border ${
                  modo === 'ia'
                    ? 'border-primary-dark/60 bg-primary-dark/15'
                    : 'border-white/8 bg-white/3 hover:bg-white/5'
                }`}
              >
                <Bot size={20} className={modo === 'ia' ? 'text-primary-dark mb-2' : 'text-text-muted mb-2'} />
                <p className={`text-sm font-bold ${modo === 'ia' ? 'text-white' : 'text-text-muted'}`}>PACTO IA</p>
                <p className="text-xs text-text-muted mt-1">Mensajes inteligentes automáticos</p>
              </button>
            </div>
          </motion.div>

          {/* Activate button */}
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleActivar}
            disabled={settingUp}
            className="w-full py-4 rounded-2xl font-bold text-[#0A0A12] text-base flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #a8ff3e, #7fff00)' }}
          >
            {settingUp ? (
              <div className="w-5 h-5 border-2 border-[#0A0A12]/40 border-t-[#0A0A12] rounded-full animate-spin" />
            ) : (
              <>
                <Shield size={17} />
                {isActivo
                  ? (pactoStatus?.modo === modo ? 'Configuración actualizada' : `Cambiar a modo ${modo}`)
                  : `Activar PACTO ${modo === 'humano' ? 'humano' : 'IA'}`
                }
              </>
            )}
          </motion.button>

          {/* Invite section (human mode, active) */}
          <AnimatePresence>
            {isActivo && pactoStatus?.modo === 'humano' && inviteUrl && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div
                  className="rounded-3xl p-5 space-y-4"
                  style={{ background: 'rgba(124,77,255,0.08)', border: '1px solid rgba(124,77,255,0.2)' }}
                >
                  <div className="flex items-center gap-2">
                    <Users size={15} className="text-primary-dark" />
                    <p className="text-sm font-bold text-white">
                      {pactoStatus?.partnerNombre
                        ? `${pactoStatus.partnerNombre} es tu partner 🎉`
                        : 'Invita a tu partner'
                      }
                    </p>
                  </div>

                  {!pactoStatus?.partnerNombre && (
                    <>
                      <p className="text-xs text-text-muted leading-relaxed">
                        Manda este link por WhatsApp. Tu partner solo necesita abrirlo y aceptar — no necesita descargarse nada.
                      </p>

                      {/* Link box */}
                      <div className="flex items-center gap-2 bg-black/30 rounded-2xl px-4 py-3 border border-white/8">
                        <p className="text-xs text-text-muted flex-1 truncate">{inviteUrl}</p>
                        <button
                          onClick={handleCopiar}
                          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold text-primary-dark"
                        >
                          {copied ? <Check size={13} className="text-neon-green" /> : <Copy size={13} />}
                          {copied ? 'Copiado' : 'Copiar'}
                        </button>
                      </div>

                      {/* WhatsApp button */}
                      <button
                        onClick={handleWhatsApp}
                        className="w-full py-3.5 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 bg-[#25d366]/10 border border-[#25d366]/30 hover:bg-[#25d366]/20 transition-colors"
                      >
                        <ExternalLink size={15} className="text-[#25d366]" />
                        Enviar por WhatsApp
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* How it works */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl p-5 space-y-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-sm font-bold text-white">¿Cómo funciona?</p>
            <div className="space-y-3">
              {[
                { icon: '🔍', text: 'PULSO analiza tus patrones de gasto en tiempo real' },
                { icon: '⚠️', text: 'Detecta compras de riesgo: múltiples gastos seguidos, exceso de presupuesto, velocidad inusual' },
                { icon: '⏸️', text: 'Pausa tu pantalla mostrando el contexto de la compra' },
                { icon: '🔔', text: modo === 'humano' ? 'Notifica a tu partner — tiene 60 segundos para responder' : 'PULSO IA envía un mensaje personalizado basado en tus patrones' },
                { icon: '✅', text: 'Tú decides: seguir con la compra o cancelarla con orgullo' },
              ].map(({ icon, text }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                  <p className="text-xs text-text-muted leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* History */}
          {historial && historial.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="space-y-3"
            >
              <p className="text-sm font-bold text-white px-1">Historial de alertas</p>
              {historial.slice(0, 5).map((a: any) => {
                const estadoInfo = ESTADO_LABEL[a.estado] ?? { label: a.estado, color: 'text-text-muted' }
                const ctx = a.contexto ?? {}
                return (
                  <div
                    key={a.id}
                    className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Shield size={14} className="text-primary-dark/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {fmt(ctx.monto ?? 0)} · {ctx.categoria ?? '—'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className={`text-xs font-medium ${estadoInfo.color}`}>{estadoInfo.label}</p>
                        {a.mensajePartner && (
                          <>
                            <span className="text-white/20">·</span>
                            <p className="text-xs text-text-muted truncate">{a.mensajePartner}</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-bold text-white/40">
                        {Math.round(a.puntuacion * 100)}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </motion.div>
          )}

        </div>
      )}
    </div>
  )
}
