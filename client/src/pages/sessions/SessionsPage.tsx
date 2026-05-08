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
  programada: 'bg-neon-green/20 text-neon-green',
  completada: 'bg-white/10 text-text-muted',
  cancelada:  'bg-red-500/20 text-red-400',
}

export function SessionsPage() {
  const { data: sesiones, isLoading } = useSesiones()
  const [selectedSesion, setSelectedSesion] = useState<Sesion | null>(null)
  const [showBook, setShowBook] = useState(false)

  const upcoming = sesiones?.filter((s) => s.estado === 'programada' && new Date(s.fechaHora) >= new Date()) ?? []
  const past = sesiones?.filter((s) => s.estado !== 'programada' || new Date(s.fechaHora) < new Date()) ?? []

  return (
    <div className="px-5 pt-14 pb-32 space-y-5 relative">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary-dark/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-2xl font-bold font-display text-white">Sesiones</h1>
        <Button onClick={() => setShowBook(true)} size="sm">
          <Plus size={16} className="mr-1" /> Agendar
        </Button>
      </motion.div>

      {/* Upcoming */}
      <div>
        <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Próximas</h2>
        {isLoading ? (
          <div className="h-28 bg-surface-raised rounded-3xl border border-border-light animate-pulse" />
        ) : upcoming.length === 0 ? (
          <Card>
            <div className="text-center py-6">
              <Calendar size={32} className="text-text-muted mx-auto mb-2" />
              <p className="font-semibold text-white">Sin sesiones agendadas</p>
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
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Historial</h2>
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
      className="w-full bg-surface-raised border border-border-light rounded-3xl p-4 flex items-center gap-4 text-left hover:border-primary-dark/40 transition-all"
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-2xl bg-surface-elevated flex items-center justify-center flex-shrink-0 overflow-hidden border border-border-light">
        {sesion.asesor.fotoUrl ? (
          <img src={sesion.asesor.fotoUrl} alt={sesion.asesor.nombre} className="w-full h-full object-cover" />
        ) : (
          <span className="font-bold text-primary-dark">{getInitials(sesion.asesor.nombre)}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white truncate">{sesion.asesor.nombre}</p>
        <p className="text-xs text-text-muted">{sesion.asesor.carrera}</p>
        <p className="text-xs font-semibold text-text-muted mt-1">
          {formatDate(sesion.fechaHora, { weekday: 'short', day: 'numeric', month: 'short' })} · {formatTime(sesion.fechaHora)}
        </p>
      </div>
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${ESTADO_STYLES[sesion.estado]}`}>
        {sesion.estado}
      </span>
    </motion.button>
  )
}
