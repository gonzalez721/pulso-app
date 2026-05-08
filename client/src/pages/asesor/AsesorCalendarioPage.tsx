import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react'
import { useAsesorSesiones } from '../../hooks/useAsesor'
import { formatTime, getInitials } from '../../lib/utils'

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const ESTADO_DOT: Record<string, string> = {
  programada: 'bg-neon-green',
  completada: 'bg-white/40',
  aplazada:   'bg-yellow-400',
  cancelada:  'bg-red-400',
}

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export function AsesorCalendarioPage() {
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState<Date | null>(today)
  const navigate = useNavigate()

  const { data: sesiones = [], isLoading } = useAsesorSesiones()

  // Build a map of dateKey -> sessions[]
  const byDay: Record<string, any[]> = {}
  for (const s of sesiones as any[]) {
    const d = new Date(s.fechaHora)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!byDay[key]) byDay[key] = []
    byDay[key].push(s)
  }

  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

  // Build calendar grid (always 6 rows × 7 cols)
  const year  = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const gridStart = startOfWeekMonday(firstDay)

  const cells: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    cells.push(d)
  }

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  const selectedSesiones = selectedDay
    ? (byDay[dayKey(selectedDay)] ?? []).sort(
        (a: any, b: any) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime()
      )
    : []

  return (
    <div className="px-5 pt-6 pb-6 space-y-5">
      <h1 className="text-2xl font-extrabold font-display text-white">Calendario</h1>

      {/* Month navigator */}
      <div className="bg-surface-raised border border-border-light rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-xl bg-surface-elevated border border-border-light flex items-center justify-center hover:border-white/30 transition-colors"
          >
            <ChevronLeft size={15} className="text-text-muted" />
          </button>
          <h2 className="text-base font-extrabold text-white">
            {MESES[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-xl bg-surface-elevated border border-border-light flex items-center justify-center hover:border-white/30 transition-colors"
          >
            <ChevronRight size={15} className="text-text-muted" />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-border-light">
          {DIAS.map((d) => (
            <div key={d} className="py-2 text-center text-[10px] font-bold text-text-dim uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const isCurrentMonth = cell.getMonth() === month
            const isToday = isSameDay(cell, today)
            const isSelected = selectedDay ? isSameDay(cell, selectedDay) : false
            const daySessions = byDay[dayKey(cell)] ?? []
            const hasProgramada = daySessions.some((s) => s.estado === 'programada')
            const hasAny = daySessions.length > 0

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(cell)}
                className={`relative py-2.5 flex flex-col items-center gap-1 transition-all border-b border-r border-border-light/30 ${
                  isSelected
                    ? 'bg-primary-dark/20'
                    : isCurrentMonth
                      ? 'hover:bg-surface-elevated/50'
                      : 'opacity-30'
                }`}
              >
                <span className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                  isToday && isSelected
                    ? 'bg-primary-dark text-white'
                    : isToday
                      ? 'bg-primary-dark/30 text-primary-dark'
                      : isSelected
                        ? 'bg-white/15 text-white'
                        : isCurrentMonth
                          ? 'text-white'
                          : 'text-text-dim'
                }`}>
                  {cell.getDate()}
                </span>
                {/* Session dots */}
                {hasAny && (
                  <div className="flex gap-0.5 justify-center">
                    {daySessions.slice(0, 3).map((s: any, j: number) => (
                      <span
                        key={j}
                        className={`w-1.5 h-1.5 rounded-full ${ESTADO_DOT[s.estado] ?? 'bg-white/30'}`}
                      />
                    ))}
                    {daySessions.length > 3 && (
                      <span className="text-[8px] text-text-dim font-bold">+{daySessions.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-1">
        {[
          { estado: 'programada', label: 'Programada' },
          { estado: 'completada', label: 'Completada' },
          { estado: 'aplazada',   label: 'Aplazada' },
          { estado: 'cancelada',  label: 'Cancelada' },
        ].map(({ estado, label }) => (
          <div key={estado} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${ESTADO_DOT[estado]}`} />
            <span className="text-[11px] text-text-muted">{label}</span>
          </div>
        ))}
      </div>

      {/* Selected day sessions */}
      <AnimatePresence mode="wait">
        {selectedDay && (
          <motion.div
            key={dayKey(selectedDay)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {selectedDay.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <span className="text-xs text-text-dim">
                {selectedSesiones.length === 0 ? 'Sin sesiones' : `${selectedSesiones.length} sesión${selectedSesiones.length > 1 ? 'es' : ''}`}
              </span>
            </div>

            {isLoading ? (
              <div className="h-20 bg-surface-raised border border-border-light rounded-2xl animate-pulse" />
            ) : selectedSesiones.length === 0 ? (
              <div className="bg-surface-raised border border-border-light rounded-3xl p-6 text-center">
                <p className="text-2xl mb-1">📭</p>
                <p className="text-xs text-text-muted">No hay sesiones este día</p>
              </div>
            ) : (
              selectedSesiones.map((s: any) => (
                <motion.button
                  key={s.id}
                  onClick={() => navigate(`/asesor/sesion/${s.id}`)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="w-full bg-surface-raised border border-border-light rounded-2xl p-4 flex items-center gap-3 hover:bg-surface-elevated transition-colors text-left"
                >
                  {/* Time column */}
                  <div className="flex flex-col items-center gap-0.5 w-12 flex-shrink-0">
                    <Clock size={11} className="text-text-dim" />
                    <span className="text-xs font-bold text-white">{formatTime(s.fechaHora)}</span>
                  </div>

                  {/* Divider */}
                  <div className={`w-0.5 h-10 rounded-full flex-shrink-0 ${ESTADO_DOT[s.estado] ?? 'bg-white/20'}`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-primary-dark/20 flex items-center justify-center text-[9px] font-bold text-primary-dark flex-shrink-0">
                        {getInitials(s.user?.nombre ?? 'E')}
                      </div>
                      <p className="font-bold text-white text-sm truncate">{s.user?.nombre ?? '—'}</p>
                    </div>
                    <p className="text-[11px] text-text-muted mt-0.5 truncate">{s.user?.universidad}</p>
                    {s.temasAgenda?.length > 0 && (
                      <p className="text-[11px] text-text-dim mt-0.5 truncate">
                        {s.temasAgenda.slice(0, 2).join(' · ')}
                      </p>
                    )}
                  </div>

                  {/* Status badge */}
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                    s.estado === 'programada' ? 'bg-neon-green/15 text-neon-green' :
                    s.estado === 'completada' ? 'bg-white/10 text-text-muted' :
                    s.estado === 'aplazada'   ? 'bg-yellow-500/15 text-yellow-400' :
                                                'bg-red-500/15 text-red-400'
                  }`}>
                    {s.estado}
                  </span>

                  <ChevronRight size={13} className="text-text-muted flex-shrink-0" />
                </motion.button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
