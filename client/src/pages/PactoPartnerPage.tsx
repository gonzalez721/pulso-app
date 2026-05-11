import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Shield, Clock } from 'lucide-react'
import { pactoApi } from '../api/endpoints'

interface PartnerInfo {
  nombre: string
  userNombre: string
  userFotoUrl?: string
}

interface Alerta {
  id: string
  monto: number
  categoria: string
  descripcion?: string
  nivelRiesgo: string
  razonesRiesgo: string[]
  mensajeIA?: string
  estado: string
  createdAt: string
  expiresAt: string
}

function formatMonto(n: number) {
  return '$' + n.toLocaleString('es-CO')
}

function timeAgo(dateStr: string) {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (secs < 60) return 'hace un momento'
  if (secs < 3600) return `hace ${Math.floor(secs / 60)} min`
  return `hace ${Math.floor(secs / 3600)} h`
}

function AlertaCard({
  alerta,
  token,
  userNombre,
  onResponded,
}: {
  alerta: Alerta
  token: string
  userNombre: string
  onResponded: (id: string, decision: 'aprobado' | 'rechazado', msg?: string) => void
}) {
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState<'aprobado' | 'rechazado' | null>(null)
  const [responded, setResponded] = useState(
    alerta.estado !== 'pendiente' ? alerta.estado : null,
  )

  const respond = async (decision: 'aprobado' | 'rechazado') => {
    setLoading(decision)
    try {
      await pactoApi.responderAlerta(token, alerta.id, { decision, mensaje: mensaje || undefined })
      setResponded(decision)
      onResponded(alerta.id, decision, mensaje || undefined)
    } catch {
      // ignore
    } finally {
      setLoading(null)
    }
  }

  const isExpired = new Date(alerta.expiresAt) < new Date()

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{
              background: alerta.nivelRiesgo === 'alto' ? 'rgba(255,71,87,0.15)' : 'rgba(255,165,0,0.15)',
              color: alerta.nivelRiesgo === 'alto' ? '#FF6B78' : '#FFB800',
              border: `1px solid ${alerta.nivelRiesgo === 'alto' ? 'rgba(255,71,87,0.3)' : 'rgba(255,165,0,0.3)'}`,
            }}
          >
            {alerta.nivelRiesgo === 'alto' ? '🔴 Riesgo alto' : '🟡 Riesgo medio'}
          </span>
          <span className="text-[11px] text-text-dim">{timeAgo(alerta.createdAt)}</span>
        </div>

        <p className="text-3xl font-extrabold text-white">{formatMonto(alerta.monto)}</p>
        <p className="text-text-muted text-sm mt-0.5">
          {alerta.categoria}{alerta.descripcion ? ` · ${alerta.descripcion}` : ''}
        </p>
      </div>

      {/* Risk reasons */}
      {alerta.razonesRiesgo.length > 0 && (
        <div className="px-5 pb-3 space-y-1.5">
          {alerta.razonesRiesgo.map((r, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-sm"
              style={{ color: 'rgba(255,165,0,0.85)' }}
            >
              <span className="flex-shrink-0 mt-0.5">⚠️</span>
              <span className="leading-snug">{r}</span>
            </div>
          ))}
        </div>
      )}

      {/* AI message */}
      {alerta.mensajeIA && (
        <div
          className="mx-5 mb-4 rounded-2xl px-4 py-3"
          style={{ background: 'rgba(124,77,255,0.08)', border: '1px solid rgba(124,77,255,0.2)' }}
        >
          <p className="text-xs font-bold text-primary-dark/80 uppercase tracking-wide mb-1">PACTO dice</p>
          <p className="text-sm text-white leading-relaxed">{alerta.mensajeIA}</p>
        </div>
      )}

      {/* Response area */}
      {responded ? (
        <div
          className="mx-5 mb-5 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{
            background: responded === 'aprobado' ? 'rgba(168,255,62,0.08)' : 'rgba(255,71,87,0.08)',
            border: `1px solid ${responded === 'aprobado' ? 'rgba(168,255,62,0.25)' : 'rgba(255,71,87,0.25)'}`,
          }}
        >
          {responded === 'aprobado'
            ? <CheckCircle size={18} className="text-neon-green flex-shrink-0" />
            : <XCircle size={18} className="text-red-400 flex-shrink-0" />
          }
          <p className="text-sm font-semibold text-white">
            {responded === 'aprobado' ? 'Aprobaste este gasto' : 'Frenaste este gasto'}
          </p>
        </div>
      ) : isExpired ? (
        <div className="mx-5 mb-5 flex items-center gap-2 text-text-dim text-sm">
          <Clock size={14} />
          <span>Esta alerta expiró</span>
        </div>
      ) : (
        <div className="px-5 pb-5 space-y-3">
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder={`Dile algo a ${userNombre}… (opcional)`}
            rows={2}
            className="w-full bg-surface-elevated border border-border-light rounded-2xl px-4 py-3 text-white placeholder-text-dim focus:outline-none focus:border-primary-dark/60 text-sm resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => respond('aprobado')}
              disabled={loading !== null}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
              style={{ background: 'rgba(168,255,62,0.12)', border: '1px solid rgba(168,255,62,0.3)', color: '#A8FF3E' }}
            >
              {loading === 'aprobado' ? '…' : <><CheckCircle size={15} /> Aprobar</>}
            </button>
            <button
              onClick={() => respond('rechazado')}
              disabled={loading !== null}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
              style={{ background: 'rgba(255,71,87,0.12)', border: '1px solid rgba(255,71,87,0.3)', color: '#FF6B78' }}
            >
              {loading === 'rechazado' ? '…' : <><XCircle size={15} /> Frenar</>}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export function PactoPartnerPage() {
  const { token } = useParams<{ token: string }>()
  const [info, setInfo] = useState<PartnerInfo | null>(null)
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    const load = async () => {
      try {
        const [infoRes, alertasRes] = await Promise.all([
          pactoApi.getPartnerPage(token),
          pactoApi.getPartnerAlertas(token),
        ])
        setInfo(infoRes.data.partner)
        setAlertas(alertasRes.data.alertas)
      } catch {
        setError('Este link de PACTO no es válido o fue desactivado.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const handleResponded = (id: string, decision: 'aprobado' | 'rechazado') => {
    setAlertas((prev) =>
      prev.map((a) => a.id === id ? { ...a, estado: decision } : a)
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A12' }}>
        <div className="w-8 h-8 rounded-full border-2 border-primary-dark border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error || !info) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#0A0A12' }}>
        <p className="text-4xl mb-4">🔒</p>
        <p className="text-white font-bold text-lg mb-2">Link inválido</p>
        <p className="text-text-muted text-sm">{error}</p>
      </div>
    )
  }

  const pendingCount = alertas.filter((a) => a.estado === 'pendiente').length

  return (
    <div className="min-h-screen pb-16" style={{ background: '#0A0A12' }}>
      {/* Background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-dark/8 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md mx-auto px-5 pt-12 space-y-6 relative">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield size={24} style={{ color: '#A890FF' }} />
            <span className="text-2xl font-extrabold text-white" style={{ fontFamily: 'system-ui' }}>PACTO</span>
          </div>

          {/* User avatar */}
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-elevated border border-border-light flex items-center justify-center overflow-hidden">
              {info.userFotoUrl ? (
                <img src={info.userFotoUrl} className="w-full h-full object-cover" alt="" />
              ) : (
                <span className="text-xl font-extrabold text-primary-dark">
                  {info.userNombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="text-white font-bold">{info.userNombre}</p>
              <p className="text-text-muted text-sm">te eligió como su partner PACTO 🤝</p>
            </div>
          </div>

          <div
            className="rounded-2xl px-4 py-3 text-sm text-text-muted text-left leading-relaxed"
            style={{ background: 'rgba(124,77,255,0.06)', border: '1px solid rgba(124,77,255,0.15)' }}
          >
            Cuando {info.userNombre} esté por hacer un gasto de riesgo, recibirás una alerta aquí para que puedas opinar. Tu respuesta aparecerá en su pantalla en tiempo real.
          </div>
        </motion.div>

        {/* Alertas */}
        <div className="space-y-4">
          {alertas.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">👀</p>
              <p className="font-semibold text-white">Sin alertas por ahora</p>
              <p className="text-text-muted text-sm mt-1">
                Cuando {info.userNombre} tenga un gasto de riesgo, aparecerá aquí.
              </p>
            </div>
          ) : (
            <>
              {pendingCount > 0 && (
                <div
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
                  style={{ background: 'rgba(255,165,0,0.08)', border: '1px solid rgba(255,165,0,0.2)' }}
                >
                  <span className="text-yellow-400 text-sm font-bold">
                    {pendingCount} alerta{pendingCount > 1 ? 's' : ''} esperando tu respuesta
                  </span>
                </div>
              )}
              <AnimatePresence>
                {alertas.map((a) => (
                  <AlertaCard
                    key={a.id}
                    alerta={a}
                    token={token!}
                    userNombre={info.userNombre}
                    onResponded={handleResponded}
                  />
                ))}
              </AnimatePresence>
            </>
          )}
        </div>

        <p className="text-center text-xs text-text-dim pb-4">
          Powered by <span className="font-bold text-text-muted">PULSO</span> · Acompañamiento Financiero Universitario
        </p>
      </div>
    </div>
  )
}
