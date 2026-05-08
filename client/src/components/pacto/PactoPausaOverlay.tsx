import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Clock, MessageCircle, ChevronRight, Zap } from 'lucide-react'
import { useAlertaStatus } from '../../hooks/usePacto'

const WINDOW_SECS = 60

interface PactoPausaOverlayProps {
  alertaId:    string
  contexto: {
    monto:                  number
    categoria:              string
    descripcion?:           string
    porcentajePresupuesto:  number
    nComprasHoy:            number
    nComprasMismaCategoria: number
    velocidadVsPromedio:    number
  }
  mensajeAuto:   string
  partnerNombre?: string
  modo:           'humano' | 'ia'
  onContinuar:    () => void
  onCancelar:     () => void
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export function PactoPausaOverlay({
  alertaId, contexto, mensajeAuto, partnerNombre, modo, onContinuar, onCancelar,
}: PactoPausaOverlayProps) {
  const [segsLocales, setSegsLocales] = useState(WINDOW_SECS)
  const [fase, setFase] = useState<'esperando' | 'respondida' | 'timeout' | 'auto'>('esperando')
  const [mensaje, setMensaje] = useState<string | null>(null)

  const { data: alertaData } = useAlertaStatus(alertaId, fase === 'esperando')

  // Sync state from server
  useEffect(() => {
    if (!alertaData) return
    if (alertaData.estado !== 'esperando') {
      setFase(alertaData.estado as any)
      setMensaje(alertaData.mensajePartner ?? alertaData.mensajeAuto ?? mensajeAuto)
    }
    if (alertaData.segundosRestantes !== undefined) {
      setSegsLocales(alertaData.segundosRestantes)
    }
  }, [alertaData, mensajeAuto])

  // Local countdown
  useEffect(() => {
    if (fase !== 'esperando') return
    const t = setInterval(() => {
      setSegsLocales(s => {
        if (s <= 1) {
          setFase('timeout')
          setMensaje(mensajeAuto)
          clearInterval(t)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [fase, mensajeAuto])

  const colorPresupuesto =
    contexto.porcentajePresupuesto >= 90 ? 'text-red-400' :
    contexto.porcentajePresupuesto >= 70 ? 'text-amber-400' : 'text-neon-green'

  const progressPct = (segsLocales / WINDOW_SECS) * 100

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'linear-gradient(160deg, #07070f 0%, #1a0a2e 100%)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <div className="w-10 h-10 rounded-2xl bg-primary-dark/20 border border-primary-dark/30 flex items-center justify-center">
          <Shield size={20} className="text-primary-dark" />
        </div>
        <div>
          <p className="text-xs font-bold text-primary-dark/70 uppercase tracking-widest">PACTO activo</p>
          <p className="text-base font-extrabold text-white">Momento de pausa</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">

        {/* Purchase summary */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl p-5"
          style={{ background: 'rgba(124,77,255,0.1)', border: '1px solid rgba(124,77,255,0.25)' }}
        >
          <p className="text-xs font-bold text-primary-dark/60 uppercase tracking-wider mb-1">Vas a gastar</p>
          <p className="text-3xl font-black text-white mb-0.5">{fmt(contexto.monto)}</p>
          <p className="text-sm text-text-muted">{contexto.categoria}{contexto.descripcion ? ` · ${contexto.descripcion}` : ''}</p>
        </motion.div>

        {/* Context signals */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          {contexto.porcentajePresupuesto > 0 && (
            <ContextRow
              icon="📊"
              label={`${contexto.porcentajePresupuesto}% del presupuesto semanal`}
              valueClass={colorPresupuesto}
            />
          )}
          {contexto.nComprasHoy > 1 && (
            <ContextRow icon="🛒" label={`${contexto.nComprasHoy}ª compra del día`} />
          )}
          {contexto.nComprasMismaCategoria > 1 && (
            <ContextRow icon="🔁" label={`${contexto.nComprasMismaCategoria}ª en ${contexto.categoria} hoy`} />
          )}
          {contexto.velocidadVsPromedio > 1.2 && (
            <ContextRow icon="⚡" label={`Gastando ${Math.round((contexto.velocidadVsPromedio - 1) * 100)}% más rápido que otras semanas`} />
          )}
        </motion.div>

        {/* Timer / Response area */}
        <AnimatePresence mode="wait">
          {fase === 'esperando' && (
            <motion.div
              key="esperando"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-3xl p-5 space-y-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-amber-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">
                    {modo === 'humano'
                      ? `${partnerNombre ?? 'Tu partner'} tiene ${segsLocales}s para responder`
                      : `PACTO IA respondiendo...`
                    }
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {modo === 'humano'
                      ? 'Recibió una notificación ahora mismo'
                      : 'Analizando tus patrones personales'
                    }
                  </p>
                </div>
                <span className="text-2xl font-black text-amber-400 tabular-nums">{segsLocales}</span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-amber-400"
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </div>
            </motion.div>
          )}

          {(fase === 'respondida' || fase === 'timeout' || fase === 'auto') && mensaje && (
            <motion.div
              key="mensaje"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl p-5 space-y-2"
              style={{
                background: fase === 'respondida'
                  ? 'rgba(168,255,62,0.08)'
                  : 'rgba(124,77,255,0.08)',
                border: fase === 'respondida'
                  ? '1px solid rgba(168,255,62,0.25)'
                  : '1px solid rgba(124,77,255,0.25)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle
                  size={15}
                  className={fase === 'respondida' ? 'text-neon-green' : 'text-primary-dark/70'}
                />
                <p className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: fase === 'respondida' ? '#a8ff3e' : '#9c6fff' }}>
                  {fase === 'respondida'
                    ? `${partnerNombre ?? 'Tu partner'} respondió`
                    : modo === 'ia' ? 'PACTO IA dice' : 'Mensaje automático'
                  }
                </p>
              </div>
              <p className="text-sm text-text-muted leading-relaxed">{mensaje}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="px-5 pb-10 pt-2 space-y-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onContinuar}
          className="w-full py-4 rounded-2xl font-bold text-[#0A0A12] text-base flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #a8ff3e, #7fff00)' }}
        >
          Igual voy a comprar <ChevronRight size={18} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onCancelar}
          className="w-full py-4 rounded-2xl font-bold text-white text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
        >
          <Zap size={15} className="text-neon-green" /> Cancelar la compra — buen trabajo
        </motion.button>
      </div>
    </motion.div>
  )
}

function ContextRow({ icon, label, valueClass }: { icon: string; label: string; valueClass?: string }) {
  return (
    <div className="flex items-center gap-3 bg-white/4 rounded-2xl px-4 py-3 border border-white/6">
      <span className="text-base flex-shrink-0">{icon}</span>
      <p className={`text-sm font-semibold ${valueClass ?? 'text-text-muted'}`}>{label}</p>
    </div>
  )
}
