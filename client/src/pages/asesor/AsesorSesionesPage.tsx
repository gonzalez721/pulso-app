import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Copy, Check, Video, CheckCircle, XCircle, Clock, MoreHorizontal } from 'lucide-react'
import { useAsesorSesiones, useUpdateSesionStatus } from '../../hooks/useAsesor'
import { formatDate, formatTime, getInitials } from '../../lib/utils'

const TABS = [
  { key: 'programada', label: 'Próximas',    emoji: '📅' },
  { key: 'completada', label: 'Completadas', emoji: '✅' },
  { key: 'aplazada',   label: 'Aplazadas',   emoji: '⏸️' },
  { key: 'cancelada',  label: 'Canceladas',  emoji: '❌' },
]

const ESTADO_PILL: Record<string, string> = {
  programada: 'bg-neon-green/15 text-neon-green border border-neon-green/20',
  completada: 'bg-white/10 text-text-muted border border-white/10',
  aplazada:   'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  cancelada:  'bg-red-500/15 text-red-400 border border-red-500/20',
}

export function AsesorSesionesPage() {
  const [tab, setTab] = useState('programada')
  const { data: sesiones = [], isLoading } = useAsesorSesiones()
  const navigate = useNavigate()

  const filtered = sesiones
    .filter((s: any) => s.estado === tab)
    .sort((a: any, b: any) => {
      if (tab === 'programada') return new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime()
      return new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
    })

  const counts: Record<string, number> = {}
  for (const s of sesiones as any[]) {
    counts[s.estado] = (counts[s.estado] ?? 0) + 1
  }

  return (
    <div className="px-5 pt-6 pb-6 space-y-4">
      <h1 className="text-2xl font-extrabold font-display text-white">Mis sesiones</h1>

      {/* Tabs — horizontal scroll */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${
              tab === t.key
                ? 'bg-surface-raised text-white border border-border-light shadow'
                : 'bg-surface-elevated/50 text-text-muted border border-transparent hover:text-white'
            }`}
          >
            <span>{t.emoji}</span>
            {t.label}
            {counts[t.key] ? (
              <span className={`rounded-full w-4 h-4 text-[9px] flex items-center justify-center font-black ${
                tab === t.key ? 'bg-neon-green/20 text-neon-green' : 'bg-white/5 text-text-dim'
              }`}>
                {counts[t.key]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[0,1,2].map((i) => <div key={i} className="h-28 bg-surface-raised border border-border-light rounded-3xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-raised border border-border-light rounded-3xl p-8 text-center">
          <p className="text-3xl mb-2">{TABS.find(t => t.key === tab)?.emoji}</p>
          <p className="font-semibold text-sm text-text-muted">Sin sesiones {TABS.find(t => t.key === tab)?.label.toLowerCase()}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((s: any, i: number) => (
              <SesionCard
                key={s.id}
                sesion={s}
                index={i}
                onClick={() => navigate(`/asesor/sesion/${s.id}`)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

function SesionCard({ sesion, index, onClick }: {
  sesion: any; index: number; onClick: () => void
}) {
  const [copied, setCopied]       = useState(false)
  const [showActions, setShowActions] = useState(false)
  const { mutate: updateStatus, isPending } = useUpdateSesionStatus()

  const student = sesion.user

  const copyLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!sesion.linkMeet) return
    navigator.clipboard.writeText(sesion.linkMeet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const changeStatus = (e: React.MouseEvent, estado: 'completada' | 'cancelada' | 'aplazada') => {
    e.stopPropagation()
    setShowActions(false)
    updateStatus({ sesionId: sesion.id, estado })
  }

  const isProgramada = sesion.estado === 'programada'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.04 }}
      className="bg-surface-raised border border-border-light rounded-3xl overflow-hidden"
    >
      {/* Main row */}
      <button
        onClick={onClick}
        className="w-full p-4 flex items-center gap-3 text-left hover:bg-surface-elevated/50 transition-colors"
      >
        <div className="w-11 h-11 rounded-2xl bg-surface-elevated border border-border-light flex items-center justify-center flex-shrink-0 overflow-hidden">
          {student?.fotoUrl
            ? <img src={student.fotoUrl} alt={student.nombre} className="w-full h-full object-cover" />
            : <span className="font-bold text-primary-dark text-sm">{getInitials(student?.nombre ?? 'E')}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-bold text-white text-sm truncate">{student?.nombre ?? '—'}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${ESTADO_PILL[sesion.estado]}`}>
              {sesion.estado}
            </span>
          </div>
          <p className="text-xs text-text-muted truncate">{student?.universidad}</p>
          <p className="text-xs font-semibold text-text-dim mt-0.5">
            {formatDate(sesion.fechaHora, { weekday: 'short', day: 'numeric', month: 'short' })} · {formatTime(sesion.fechaHora)}
          </p>
          {sesion.temasAgenda?.length > 0 && (
            <p className="text-[11px] text-text-dim mt-0.5 truncate opacity-70">
              {sesion.temasAgenda.slice(0, 3).join(' · ')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isProgramada && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowActions((v) => !v) }}
              className="w-7 h-7 rounded-xl bg-surface-elevated border border-border-light flex items-center justify-center hover:border-white/30 transition-colors"
            >
              <MoreHorizontal size={13} className="text-text-muted" />
            </button>
          )}
          <ChevronRight size={15} className="text-text-muted" />
        </div>
      </button>

      {/* Action row — only programada */}
      <AnimatePresence>
        {isProgramada && showActions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border-light px-4 py-3 flex items-center gap-2 bg-surface-elevated/50">
              <p className="text-[11px] text-text-muted font-medium mr-1">Marcar como:</p>
              <button
                onClick={(e) => changeStatus(e, 'completada')}
                disabled={isPending}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neon-green/10 border border-neon-green/20 text-neon-green text-[11px] font-bold hover:bg-neon-green/20 transition-colors disabled:opacity-40"
              >
                <CheckCircle size={11} /> Completada
              </button>
              <button
                onClick={(e) => changeStatus(e, 'aplazada')}
                disabled={isPending}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[11px] font-bold hover:bg-yellow-500/20 transition-colors disabled:opacity-40"
              >
                <Clock size={11} /> Aplazada
              </button>
              <button
                onClick={(e) => changeStatus(e, 'cancelada')}
                disabled={isPending}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold hover:bg-red-500/20 transition-colors disabled:opacity-40"
              >
                <XCircle size={11} /> Cancelada
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meet link bar */}
      {sesion.estado === 'programada' && sesion.linkMeet && (
        <div className="border-t border-border-light px-4 py-2.5 flex items-center gap-2 bg-surface-elevated/30">
          <Video size={12} className="text-neon-green flex-shrink-0" />
          <p className="text-[11px] text-text-muted font-mono flex-1 truncate">{sesion.linkMeet}</p>
          <button
            onClick={copyLink}
            className="flex items-center gap-1 text-[11px] font-bold text-white bg-surface-raised border border-border-light px-2.5 py-1 rounded-lg hover:border-neon-green/40 transition-colors flex-shrink-0"
          >
            {copied ? <Check size={11} className="text-neon-green" /> : <Copy size={11} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      )}
    </motion.div>
  )
}
