import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Plus } from 'lucide-react'
import { useSesiones } from '../../hooks/useSesiones'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { formatDate, formatTime, getInitials } from '../../lib/utils'
import { SessionDetailModal } from './SessionDetailModal'
import { BookSessionModal } from './BookSessionModal'
import type { Sesion } from '../../types'

const ESTADO_STYLES = {
  programada: 'bg-green-100 text-green-700',
  completada: 'bg-gray-100 text-gray-600',
  cancelada: 'bg-red-100 text-red-600',
}

export function SessionsPage() {
  const { data: sesiones, isLoading } = useSesiones()
  const [selectedSesion, setSelectedSesion] = useState<Sesion | null>(null)
  const [showBook, setShowBook] = useState(false)

  const upcoming = sesiones?.filter((s) => s.estado === 'programada' && new Date(s.fechaHora) >= new Date()) ?? []
  const past = sesiones?.filter((s) => s.estado !== 'programada' || new Date(s.fechaHora) < new Date()) ?? []

  return (
    <div className="px-5 pt-14 pb-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold font-display text-primary-dark">Sesiones</h1>
        <Button onClick={() => setShowBook(true)} size="sm">
          <Plus size={16} className="mr-1" /> Agendar
        </Button>
      </div>

      {/* Upcoming */}
      <div>
        <h2 className="text-sm font-bold text-text-muted uppercase tracking-wide mb-3">Próximas</h2>
        {isLoading ? (
          <div className="h-28 bg-white rounded-3xl shadow-card animate-pulse" />
        ) : upcoming.length === 0 ? (
          <Card>
            <div className="text-center py-6">
              <Calendar size={32} className="text-text-muted mx-auto mb-2" />
              <p className="font-semibold text-text-dark">Sin sesiones agendadas</p>
              <p className="text-sm text-text-muted mt-1">Agenda una sesión con un asesor financiero</p>
              <Button onClick={() => setShowBook(true)} size="sm" className="mt-4">
                Agendar ahora
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map((s, i) => (
              <SessionCard key={s.id} sesion={s} index={i} onClick={() => setSelectedSesion(s)} />
            ))}
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-wide mb-3">Historial</h2>
          <div className="space-y-3">
            {past.map((s, i) => (
              <SessionCard key={s.id} sesion={s} index={i} onClick={() => setSelectedSesion(s)} />
            ))}
          </div>
        </div>
      )}

      <SessionDetailModal
        sesion={selectedSesion}
        onClose={() => setSelectedSesion(null)}
      />
      <BookSessionModal open={showBook} onClose={() => setShowBook(false)} />
    </div>
  )
}

function SessionCard({ sesion, index, onClick }: { sesion: Sesion; index: number; onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      onClick={onClick}
      className="w-full bg-white rounded-3xl shadow-card p-4 flex items-center gap-4 text-left hover:shadow-float transition-shadow"
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center flex-shrink-0 overflow-hidden">
        {sesion.asesor.fotoUrl ? (
          <img src={sesion.asesor.fotoUrl} alt={sesion.asesor.nombre} className="w-full h-full object-cover" />
        ) : (
          <span className="font-bold text-primary-dark">{getInitials(sesion.asesor.nombre)}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-primary-dark truncate">{sesion.asesor.nombre}</p>
        <p className="text-xs text-text-muted">{sesion.asesor.carrera}</p>
        <p className="text-xs font-semibold text-text-dark mt-1">
          {formatDate(sesion.fechaHora, { weekday: 'short', day: 'numeric', month: 'short' })} · {formatTime(sesion.fechaHora)}
        </p>
      </div>
      <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${ESTADO_STYLES[sesion.estado]}`}>
        {sesion.estado}
      </span>
    </motion.button>
  )
}
