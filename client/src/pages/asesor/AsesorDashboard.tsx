import { motion } from 'framer-motion'
import { Calendar, Clock, ChevronRight } from 'lucide-react'
import { useAsesorStore } from '../../store/asesorStore'
import { useAsesorSesiones } from '../../hooks/useAsesor'
import { formatDate, formatTime, getInitials } from '../../lib/utils'
import { useNavigate } from 'react-router-dom'

export function AsesorDashboard() {
  const { asesor } = useAsesorStore()
  const { data: sesiones = [], isLoading } = useAsesorSesiones()
  const navigate = useNavigate()

  const now = new Date()
  const proximas    = sesiones.filter((s: any) => s.estado === 'programada' && new Date(s.fechaHora) >= now)
    .sort((a: any, b: any) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())
  const hoy         = proximas.filter((s: any) => new Date(s.fechaHora).toDateString() === now.toDateString())
  const semana      = proximas.filter((s: any) => new Date(s.fechaHora).toDateString() !== now.toDateString())
  const completadas = sesiones.filter((s: any) => s.estado === 'completada')

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="px-5 pt-6 pb-6 space-y-5">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-text-muted text-sm font-medium capitalize">
          {now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="text-2xl font-extrabold font-display text-white">
          {greeting}, {asesor?.nombre.split(' ')[0]} 👋
        </h1>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Hoy',         value: hoy.length,        accent: '#A8FF3E' },
          { label: 'Esta semana', value: proximas.length,   accent: '#7C4DFF' },
          { label: 'Completadas', value: completadas.length, accent: '#3B82F6' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 }}
            className="bg-surface-raised border border-border-light rounded-2xl p-4 text-center"
            style={{ borderColor: stat.accent + '30' }}
          >
            <p className="text-3xl font-extrabold font-display text-white" style={{ color: stat.accent }}>{stat.value}</p>
            <p className="text-[10px] font-semibold text-text-muted mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Today's sessions */}
      <div>
        <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
          <Calendar size={12} /> Sesiones de hoy
        </h2>
        {isLoading ? (
          <div className="h-24 bg-surface-raised border border-border-light rounded-3xl animate-pulse" />
        ) : hoy.length === 0 ? (
          <div className="bg-surface-raised border border-border-light rounded-3xl p-5 text-center">
            <p className="text-2xl mb-1">🎉</p>
            <p className="text-sm font-semibold text-text-muted">Sin sesiones programadas para hoy</p>
          </div>
        ) : (
          <div className="space-y-3">
            {hoy.map((s: any, i: number) => (
              <SesionCard key={s.id} sesion={s} index={i} onClick={() => navigate(`/asesor/sesion/${s.id}`)} highlight />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming this week */}
      {semana.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
            <Clock size={12} /> Próximas
          </h2>
          <div className="space-y-3">
            {semana.slice(0, 5).map((s: any, i: number) => (
              <SesionCard key={s.id} sesion={s} index={i} onClick={() => navigate(`/asesor/sesion/${s.id}`)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SesionCard({ sesion, index, onClick, highlight }: { sesion: any; index: number; onClick: () => void; highlight?: boolean }) {
  const student = sesion.user
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={onClick}
      className={`w-full rounded-3xl p-4 flex items-center gap-4 text-left transition-all hover:scale-[1.01] ${
        highlight
          ? 'bg-gradient-to-r from-[#1A1A2E] to-[#2A1A4E] border border-primary-dark/40 shadow-glow'
          : 'bg-surface-raised border border-border-light hover:border-border-light/80'
      }`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-base font-bold overflow-hidden ${
        highlight ? 'bg-primary-dark/30 text-white' : 'bg-surface-elevated text-primary-dark border border-border-light'
      }`}>
        {student?.nombre ? getInitials(student.nombre) : '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white truncate">{student?.nombre ?? '—'}</p>
        <p className="text-xs text-text-muted truncate">{student?.universidad}</p>
        <p className={`text-xs font-semibold mt-0.5 ${highlight ? 'text-neon-green' : 'text-text-muted'}`}>
          {formatDate(sesion.fechaHora, { weekday: 'short', day: 'numeric', month: 'short' })} · {formatTime(sesion.fechaHora)}
        </p>
      </div>
      <ChevronRight size={16} className="text-text-muted flex-shrink-0" />
    </motion.button>
  )
}
