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
  programada: 'bg-green-100 text-green-700',
  completada: 'bg-gray-100 text-gray-600',
  cancelada:  'bg-red-100 text-red-600',
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
      <h1 className="text-2xl font-extrabold font-display text-[#2D1B4E]">Mis sesiones</h1>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-2xl p-1 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === t.key ? 'bg-[#2D1B4E] text-white shadow' : 'text-gray-500 hover:text-[#2D1B4E]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[0,1,2].map((i) => <div key={i} className="h-24 bg-white rounded-3xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center text-gray-400">
          <p className="text-3xl mb-2">{tab === 'programada' ? '📅' : tab === 'completada' ? '✅' : '❌'}</p>
          <p className="font-semibold text-sm">Sin sesiones {TABS.find(t => t.key === tab)?.label.toLowerCase()}</p>
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
      className="bg-white rounded-3xl shadow-sm overflow-hidden"
    >
      {/* Main row — tap to go to detail */}
      <button
        onClick={onClick}
        className="w-full p-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="w-12 h-12 rounded-2xl bg-[#F5E6E8] flex items-center justify-center flex-shrink-0 font-bold text-[#2D1B4E]">
          {getInitials(student?.nombre ?? 'E')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-[#2D1B4E] truncate">{student?.nombre ?? '—'}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${ESTADO_PILL[sesion.estado]}`}>
              {sesion.estado}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">{student?.universidad}</p>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">
            {formatDate(sesion.fechaHora, { weekday: 'short', day: 'numeric', month: 'short' })} · {formatTime(sesion.fechaHora)}
          </p>
          {sesion.temasAgenda?.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {sesion.temasAgenda.slice(0, 3).join(' · ')}
            </p>
          )}
        </div>
        <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
      </button>

      {/* Link bar — only for programada sessions */}
      {sesion.estado === 'programada' && sesion.linkMeet && (
        <div className="border-t border-gray-100 px-4 py-2.5 flex items-center gap-2 bg-gray-50">
          <Video size={13} className="text-[#1B873A] flex-shrink-0" />
          <p className="text-[11px] text-gray-500 font-mono flex-1 truncate">{sesion.linkMeet}</p>
          <button
            onClick={copyLink}
            className="flex items-center gap-1 text-[11px] font-bold text-[#2D1B4E] bg-[#F5E6E8] px-2.5 py-1 rounded-lg hover:bg-[#ead4d8] transition-colors flex-shrink-0"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copiado' : 'Copiar link'}
          </button>
        </div>
      )}
    </motion.div>
  )
}
