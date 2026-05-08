import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Copy, Check, Video } from 'lucide-react'
import { useAsesorSesiones } from '../../hooks/useAsesor'
import { formatDate, formatTime, getInitials } from '../../lib/utils'

const TABS = [
  { key: 'programada', label: 'Próximas' },
  { key: 'completada', label: 'Completadas' },
  { key: 'cancelada',  label: 'Canceladas' },
]

const ESTADO_PILL: Record<string, string> = {
  programada: 'bg-neon-green/20 text-neon-green',
  completada: 'bg-white/10 text-text-muted',
  cancelada:  'bg-red-500/20 text-red-400',
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

  return (
    <div className="px-5 pt-6 pb-6 space-y-4">
      <h1 className="text-2xl font-extrabold font-display text-white">Mis sesiones</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-elevated border border-border-light rounded-2xl p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === t.key
                ? 'bg-surface-raised text-white shadow border border-border-light'
                : 'text-text-muted hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[0,1,2].map((i) => <div key={i} className="h-24 bg-surface-raised border border-border-light rounded-3xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-raised border border-border-light rounded-3xl p-8 text-center">
          <p className="text-3xl mb-2">{tab === 'programada' ? '📅' : tab === 'completada' ? '✅' : '❌'}</p>
          <p className="font-semibold text-sm text-text-muted">Sin sesiones {TABS.find(t => t.key === tab)?.label.toLowerCase()}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s: any, i: number) => {
            const student = s.user
            return (
              <SesionCard
                key={s.id}
                sesion={s}
                student={student}
                index={i}
                onClick={() => navigate(`/asesor/sesion/${s.id}`)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function SesionCard({ sesion, student, index, onClick }: {
  sesion: any; student: any; index: number; onClick: () => void
}) {
  const [copied, setCopied] = useState(false)

  const copyLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(sesion.linkMeet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-surface-raised border border-border-light rounded-3xl overflow-hidden"
    >
      {/* Main row */}
      <button
        onClick={onClick}
        className="w-full p-4 flex items-center gap-4 text-left hover:bg-surface-elevated transition-colors"
      >
        <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border-light flex items-center justify-center flex-shrink-0 font-bold text-primary-dark">
          {getInitials(student?.nombre ?? 'E')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-white truncate">{student?.nombre ?? '—'}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${ESTADO_PILL[sesion.estado]}`}>
              {sesion.estado}
            </span>
          </div>
          <p className="text-xs text-text-muted truncate">{student?.universidad}</p>
          <p className="text-xs font-semibold text-text-dim mt-0.5">
            {formatDate(sesion.fechaHora, { weekday: 'short', day: 'numeric', month: 'short' })} · {formatTime(sesion.fechaHora)}
          </p>
          {sesion.temasAgenda?.length > 0 && (
            <p className="text-xs text-text-dim mt-0.5 truncate">
              {sesion.temasAgenda.slice(0, 3).join(' · ')}
            </p>
          )}
        </div>
        <ChevronRight size={16} className="text-text-muted flex-shrink-0" />
      </button>

      {/* Link bar — only for programada sessions */}
      {sesion.estado === 'programada' && sesion.linkMeet && (
        <div className="border-t border-border-light px-4 py-2.5 flex items-center gap-2 bg-surface-elevated">
          <Video size={13} className="text-neon-green flex-shrink-0" />
          <p className="text-[11px] text-text-muted font-mono flex-1 truncate">{sesion.linkMeet}</p>
          <button
            onClick={copyLink}
            className="flex items-center gap-1 text-[11px] font-bold text-white bg-surface-raised border border-border-light px-2.5 py-1 rounded-lg hover:border-neon-green/40 transition-colors flex-shrink-0"
          >
            {copied ? <Check size={12} className="text-neon-green" /> : <Copy size={12} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      )}
    </motion.div>
  )
}
