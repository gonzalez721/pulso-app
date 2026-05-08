import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Send, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { pactoEndpoints } from '../../api/pactoClient'

type Fase = 'cargando' | 'respondiendo' | 'enviando' | 'exito' | 'ya_respondida' | 'expirada' | 'error'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const MENSAJES_RAPIDOS = [
  '¿Lo necesitás de verdad ahora? 🤔',
  'Recuerda tu meta de ahorro 💪',
  '¡Tenés que poder! Aguantá el impulso 🙌',
  'Pregúntate: ¿lo usarás en una semana?',
  'Esto puede esperar, tú también puedes',
]

export function PactoResponderPage() {
  const [searchParams] = useSearchParams()
  const alertaId = searchParams.get('alertaId') ?? ''

  const [fase, setFase] = useState<Fase>('cargando')
  const [alertaData, setAlertaData] = useState<any>(null)
  const [mensaje, setMensaje] = useState('')
  const [segsRestantes, setSegsRestantes] = useState(60)
  const [errorMsg, setErrorMsg] = useState('')

  // Load alerta status
  useEffect(() => {
    if (!alertaId) { setFase('error'); setErrorMsg('ID de alerta inválido'); return }

    pactoEndpoints.getAlertaStatus(alertaId)
      .then(r => {
        const data = r.data
        setAlertaData(data)
        if (data.estado === 'respondida') {
          setFase('ya_respondida')
        } else if (data.estado === 'timeout' || data.estado === 'auto') {
          setFase('expirada')
        } else {
          setSegsRestantes(data.segundosRestantes ?? 60)
          setFase('respondiendo')
        }
      })
      .catch(() => {
        setFase('error')
        setErrorMsg('No se encontró la alerta')
      })
  }, [alertaId])

  // Countdown
  useEffect(() => {
    if (fase !== 'respondiendo') return
    if (segsRestantes <= 0) { setFase('expirada'); return }

    const t = setInterval(() => {
      setSegsRestantes(s => {
        if (s <= 1) { setFase('expirada'); clearInterval(t); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [fase, segsRestantes])

  const handleEnviar = async () => {
    if (!mensaje.trim()) return
    setFase('enviando')
    try {
      await pactoEndpoints.responderAlerta(alertaId, mensaje.trim())
      setFase('exito')
    } catch (err: any) {
      if (err?.response?.status === 409 || err?.response?.status === 410) {
        setFase('expirada')
      } else {
        setFase('error')
        setErrorMsg('Error al enviar el mensaje')
      }
    }
  }

  const ctx = alertaData?.contexto ?? {}
  const progressPct = (segsRestantes / 60) * 100

  return (
    <div
      className="min-h-screen flex flex-col px-5 py-12"
      style={{ background: 'linear-gradient(160deg, #07070f 0%, #1a0a2e 100%)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-xl bg-primary-dark/20 border border-primary-dark/30 flex items-center justify-center">
          <Shield size={15} className="text-primary-dark" />
        </div>
        <p className="text-sm font-extrabold text-white/60 uppercase tracking-widest">PULSO PACTO</p>
      </div>

      <AnimatePresence mode="wait">

        {/* Loading */}
        {fase === 'cargando' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-primary-dark/30 border-t-primary-dark rounded-full animate-spin" />
              <p className="text-text-muted text-sm">Cargando...</p>
            </div>
          </motion.div>
        )}

        {/* Main respond form */}
        {fase === 'respondiendo' && (
          <motion.div
            key="respondiendo"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col gap-5"
          >
            {/* Context card */}
            <div
              className="rounded-3xl p-5 space-y-3"
              style={{ background: 'rgba(124,77,255,0.1)', border: '1px solid rgba(124,77,255,0.25)' }}
            >
              <p className="text-xs font-bold text-primary-dark/60 uppercase tracking-wider">Tu amigo/a va a gastar</p>
              <p className="text-3xl font-black text-white">{fmt(ctx.monto ?? 0)}</p>
              <p className="text-sm text-text-muted">
                {ctx.categoria ?? '—'}{ctx.descripcion ? ` · ${ctx.descripcion}` : ''}
              </p>

              {/* Context pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {ctx.porcentajePresupuesto > 0 && (
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                    ctx.porcentajePresupuesto >= 90
                      ? 'text-red-400 border-red-400/25 bg-red-400/8'
                      : ctx.porcentajePresupuesto >= 70
                      ? 'text-amber-400 border-amber-400/25 bg-amber-400/8'
                      : 'text-text-muted border-white/10 bg-white/4'
                  }`}>
                    {ctx.porcentajePresupuesto}% del presupuesto
                  </span>
                )}
                {ctx.nComprasHoy > 1 && (
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full border text-text-muted border-white/10 bg-white/4">
                    {ctx.nComprasHoy}ª compra hoy
                  </span>
                )}
                {ctx.velocidadVsPromedio > 1.2 && (
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full border text-amber-400 border-amber-400/25 bg-amber-400/8">
                    ⚡ Gasto acelerado
                  </span>
                )}
              </div>
            </div>

            {/* Timer */}
            <div
              className="rounded-3xl px-5 py-4 space-y-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-amber-400" />
                  <p className="text-sm font-bold text-white">Tiempo restante</p>
                </div>
                <span className="text-2xl font-black text-amber-400 tabular-nums">{segsRestantes}s</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-amber-400"
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </div>
            </div>

            {/* Quick messages */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-white/50 uppercase tracking-wider px-1">Mensajes rápidos</p>
              <div className="flex flex-wrap gap-2">
                {MENSAJES_RAPIDOS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMensaje(m)}
                    className={`text-xs font-medium px-3 py-2 rounded-2xl border transition-all ${
                      mensaje === m
                        ? 'border-primary-dark/60 bg-primary-dark/15 text-white'
                        : 'border-white/10 bg-white/4 text-text-muted hover:bg-white/8'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Text area */}
            <textarea
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              placeholder="O escribe tu propio mensaje..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm placeholder:text-text-muted outline-none focus:border-primary-dark/60 transition-colors resize-none"
            />

            {/* Send */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleEnviar}
              disabled={!mensaje.trim()}
              className="w-full py-4 rounded-2xl font-bold text-[#0A0A12] text-base flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #a8ff3e, #7fff00)' }}
            >
              <Send size={16} />
              Enviar mensaje
            </motion.button>
          </motion.div>
        )}

        {/* Sending */}
        {fase === 'enviando' && (
          <motion.div key="enviando" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-primary-dark/30 border-t-primary-dark rounded-full animate-spin" />
              <p className="text-text-muted text-sm">Enviando mensaje...</p>
            </div>
          </motion.div>
        )}

        {/* Success */}
        {fase === 'exito' && (
          <motion.div
            key="exito"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="flex-1 flex flex-col items-center justify-center gap-5 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 350, damping: 18 }}
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: 'rgba(168,255,62,0.12)', border: '1px solid rgba(168,255,62,0.3)' }}
            >
              <CheckCircle2 size={36} className="text-neon-green" />
            </motion.div>
            <div>
              <p className="text-2xl font-black text-white">¡Mensaje enviado!</p>
              <p className="text-sm text-text-muted mt-2 max-w-xs leading-relaxed">
                Tu mensaje apareció en la pantalla de tu amigo/a. Gracias por ser su red de apoyo 💚
              </p>
            </div>
            <div
              className="rounded-2xl px-5 py-4 max-w-xs"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <p className="text-sm text-white italic">"{mensaje}"</p>
            </div>
            <p className="text-xs text-text-muted">Podés cerrar esta página 🙌</p>
          </motion.div>
        )}

        {/* Already responded */}
        {fase === 'ya_respondida' && (
          <motion.div
            key="respondida"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center gap-4 text-center"
          >
            <div className="w-16 h-16 rounded-3xl bg-neon-green/10 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} className="text-neon-green" />
            </div>
            <p className="text-xl font-extrabold text-white">Esta alerta ya fue respondida</p>
            <p className="text-sm text-text-muted max-w-xs">
              {alertaData?.mensajePartner
                ? `El mensaje "${alertaData.mensajePartner}" ya fue enviado.`
                : 'Ya hubo una respuesta a esta alerta.'}
            </p>
          </motion.div>
        )}

        {/* Expired */}
        {fase === 'expirada' && (
          <motion.div
            key="expirada"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center gap-4 text-center"
          >
            <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mx-auto">
              <Clock size={28} className="text-text-muted" />
            </div>
            <p className="text-xl font-extrabold text-white">Ventana expirada</p>
            <p className="text-sm text-text-muted max-w-xs">
              Los 60 segundos para responder ya pasaron. Tu amigo/a recibió un mensaje automático.
            </p>
          </motion.div>
        )}

        {/* Error */}
        {fase === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center gap-4 text-center"
          >
            <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto">
              <XCircle size={28} className="text-red-400" />
            </div>
            <p className="text-xl font-extrabold text-white">Algo salió mal</p>
            <p className="text-sm text-text-muted">{errorMsg}</p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
