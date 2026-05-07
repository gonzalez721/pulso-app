import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, ChevronRight, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { useAsesorStore } from '../../store/asesorStore'
import { useAsesorSesiones } from '../../hooks/useAsesor'
import { formatDate, formatTime, getInitials } from '../../lib/utils'
import { useNavigate } from 'react-router-dom'

export function AsesorDashboard() {
  const { asesor } = useAsesorStore()
  const { data: sesiones = [], isLoading } = useAsesorSesiones()
  const navigate = useNavigate()

  const now = new Date()
  const proximas  = sesiones.filter((s: any) => s.estado === 'programada' && new Date(s.fechaHora) >= now)
    .sort((a: any, b: any) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())
  const hoy       = proximas.filter((s: any) => new Date(s.fechaHora).toDateString() === now.toDateString())
  const semana    = proximas.filter((s: any) => new Date(s.fechaHora).toDateString() !== now.toDateString())
  const completadas = sesiones.filter((s: any) => s.estado === 'completada')

  return (
    <div className="px-5 pt-6 pb-6 space-y-5">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-gray-500 text-sm font-medium">
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="text-2xl font-extrabold font-display text-[#2D1B4E]">
          Hola, {asesor?.nombre.split(' ')[0]} 👋
        </h1>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Hoy',        value: hoy.length,        color: 'bg-[#FFD4C8]', text: 'text-[#2D1B4E]' },
          { label: 'Esta semana', value: proximas.length,   color: 'bg-[#F5E6E8]', text: 'text-[#2D1B4E]' },
          { label: 'Completadas',value: completadas.length, color: 'bg-green-100',  text: 'text-green-700' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 }}
            className={`${stat.color} rounded-2xl p-4 text-center`}
          >
            <p className={`text-3xl font-extrabold font-display ${stat.text}`}>{stat.value}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Today's sessions */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Calendar size={14} /> Sesiones de hoy
        </h2>
        {isLoading ? (
          <div className="h-24 bg-white rounded-3xl animate-pulse" />
        ) : hoy.length === 0 ? (
          <div className="bg-white rounded-3xl p-5 text-center text-gray-400">
            <p className="text-2xl mb-1">🎉</p>
            <p className="text-sm font-semibold">Sin sesiones programadas para hoy</p>
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
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Clock size={14} /> Próximas
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
      className={`w-full rounded-3xl p-4 flex items-center gap-4 text-left transition-shadow hover:shadow-md ${highlight ? 'bg-[#2D1B4E] text-white' : 'bg-white'}`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-bold overflow-hidden ${highlight ? 'bg-white/20' : 'bg-[#F5E6E8]'}`}>
        {student?.nombre ? getInitials(student.nombre) : '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-bold truncate ${highlight ? 'text-white' : 'text-[#2D1B4E]'}`}>{student?.nombre ?? '—'}</p>
        <p className={`text-xs truncate ${highlight ? 'text-white/60' : 'text-gray-500'}`}>{student?.universidad}</p>
        <p className={`text-xs font-semibold mt-0.5 ${highlight ? 'text-[#FFD4C8]' : 'text-gray-400'}`}>
          {formatDate(sesion.fechaHora, { weekday: 'short', day: 'numeric', month: 'short' })} · {formatTime(sesion.fechaHora)}
        </p>
      </div>
      <ChevronRight size={16} className={highlight ? 'text-white/60' : 'text-gray-300'} />
    </motion.button>
  )
}
