import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Save, Clock, Info } from 'lucide-react'
import { useAsesorMe, useUpdateDisponibilidad } from '../../hooks/useAsesor'
import { Button } from '../../components/ui/Button'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const
type Dia = typeof DIAS[number]

// Generate time slots from 07:00 to 20:00, every 30 min
const ALL_HORAS: string[] = []
for (let h = 7; h <= 19; h++) {
  ALL_HORAS.push(`${String(h).padStart(2, '0')}:00`)
  ALL_HORAS.push(`${String(h).padStart(2, '0')}:30`)
}
ALL_HORAS.push('20:00')

type Schedule = Record<Dia, Set<string>>

function buildSchedule(raw: Array<{ dia: string; horas: string[] }>): Schedule {
  const s: Schedule = {} as Schedule
  for (const dia of DIAS) s[dia] = new Set()
  for (const entry of raw) {
    if (DIAS.includes(entry.dia as Dia)) {
      s[entry.dia as Dia] = new Set(entry.horas)
    }
  }
  return s
}

function scheduleToArray(s: Schedule): Array<{ dia: string; horas: string[] }> {
  return DIAS
    .filter((dia) => s[dia].size > 0)
    .map((dia) => ({ dia, horas: Array.from(s[dia]).sort() }))
}

const PRESET_MAÑANA = ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30']
const PRESET_TARDE = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30']
const PRESET_NOCHE = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00']

export function AsesorDisponibilidadPage() {
  const { data: profile, isLoading } = useAsesorMe()
  const { mutate: save, isPending, isSuccess } = useUpdateDisponibilidad()

  const [schedule, setSchedule] = useState<Schedule>(() => buildSchedule([]))
  const [activeDay, setActiveDay] = useState<Dia>('Lunes')
  const [saved, setSaved] = useState(false)

  // Init from server data
  useEffect(() => {
    if (profile?.disponibilidad) {
      setSchedule(buildSchedule(profile.disponibilidad as Array<{ dia: string; horas: string[] }>))
    }
  }, [profile])

  useEffect(() => {
    if (isSuccess) {
      setSaved(true)
      const t = setTimeout(() => setSaved(false), 3000)
      return () => clearTimeout(t)
    }
  }, [isSuccess])

  const toggleHora = (hora: string) => {
    setSchedule((prev) => {
      const next = { ...prev, [activeDay]: new Set(prev[activeDay]) }
      if (next[activeDay].has(hora)) next[activeDay].delete(hora)
      else next[activeDay].add(hora)
      return next
    })
  }

  const togglePreset = (horas: string[]) => {
    setSchedule((prev) => {
      const next = { ...prev, [activeDay]: new Set(prev[activeDay]) }
      const allPresent = horas.every((h) => next[activeDay].has(h))
      if (allPresent) horas.forEach((h) => next[activeDay].delete(h))
      else horas.forEach((h) => next[activeDay].add(h))
      return next
    })
  }

  const clearDay = () => {
    setSchedule((prev) => ({ ...prev, [activeDay]: new Set() }))
  }

  const handleSave = () => {
    save(scheduleToArray(schedule))
  }

  const totalSlots = DIAS.reduce((s, d) => s + schedule[d].size, 0)

  if (isLoading) {
    return (
      <div className="px-5 pt-6 pb-24 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 bg-surface-raised border border-border-light rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="px-5 pt-6 pb-32 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-extrabold font-display text-white">Mi disponibilidad</h1>
        <p className="text-sm text-text-muted mt-1">
          Elige los días y horas en que los estudiantes pueden agendarte
        </p>
      </motion.div>

      {/* Info banner if no slots */}
      <AnimatePresence>
        {totalSlots === 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex gap-3"
          >
            <Info size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-300 font-medium">
              Aún no tienes horarios configurados. Los estudiantes no podrán agendarte hasta que definas tu disponibilidad.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary chips */}
      {totalSlots > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2">
          {DIAS.filter((d) => schedule[d].size > 0).map((dia) => (
            <span
              key={dia}
              className="px-3 py-1 rounded-xl text-xs font-bold border"
              style={{ background: 'rgba(168,255,62,0.08)', borderColor: 'rgba(168,255,62,0.25)', color: '#A8FF3E' }}
            >
              {dia.slice(0, 2)} · {schedule[dia].size} slots
            </span>
          ))}
        </motion.div>
      )}

      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {DIAS.map((dia) => {
          const count = schedule[dia].size
          const isActive = activeDay === dia
          return (
            <button
              key={dia}
              onClick={() => setActiveDay(dia)}
              className={`flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all ${
                isActive
                  ? 'bg-primary-dark border-primary-dark text-white shadow-glow'
                  : count > 0
                  ? 'bg-surface-raised border-neon-green/30 text-white'
                  : 'bg-surface-raised border-border-light text-text-muted'
              }`}
            >
              <span>{dia.slice(0, 2)}</span>
              {count > 0 && (
                <span
                  className={`text-[9px] font-extrabold mt-0.5 ${isActive ? 'text-neon-green' : 'text-neon-green/70'}`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Time grid for active day */}
      <motion.div
        key={activeDay}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-4"
      >
        {/* Quick presets */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Selección rápida</p>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: '☀️ Mañana', horas: PRESET_MAÑANA },
              { label: '🌤 Tarde', horas: PRESET_TARDE },
              { label: '🌙 Noche', horas: PRESET_NOCHE },
            ].map(({ label, horas }) => {
              const allActive = horas.every((h) => schedule[activeDay].has(h))
              return (
                <button
                  key={label}
                  onClick={() => togglePreset(horas)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    allActive
                      ? 'bg-primary-dark/30 border-primary-dark text-white'
                      : 'bg-surface-elevated border-border-light text-text-muted hover:border-primary-dark/50 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              )
            })}
            {schedule[activeDay].size > 0 && (
              <button
                onClick={clearDay}
                className="px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold transition-all hover:bg-red-500/20"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Individual time slots */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
            {activeDay} — {schedule[activeDay].size === 0 ? 'ningún horario' : `${schedule[activeDay].size} horario${schedule[activeDay].size === 1 ? '' : 's'}`}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {ALL_HORAS.map((hora) => {
              const active = schedule[activeDay].has(hora)
              return (
                <button
                  key={hora}
                  onClick={() => toggleHora(hora)}
                  className={`relative h-11 rounded-2xl flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    active
                      ? 'bg-primary-dark border-primary-dark text-white shadow-glow scale-[1.03]'
                      : 'bg-surface-elevated border-border-light text-text-muted hover:border-primary-dark/50 hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId={`slot-check-${hora}`}
                      className="absolute top-1 right-1.5"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <Check size={9} className="text-neon-green" />
                    </motion.div>
                  )}
                  <Clock size={11} className={`mr-1 flex-shrink-0 ${active ? 'text-neon-green' : 'text-text-dim'}`} />
                  {hora}
                </button>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Save button (sticky) */}
      <div className="fixed bottom-24 left-0 right-0 max-w-lg mx-auto px-5 z-20">
        <Button
          onClick={handleSave}
          loading={isPending}
          fullWidth
          size="lg"
          className={saved ? '!bg-neon-green !text-[#0A0A12]' : ''}
        >
          {saved ? (
            <span className="flex items-center gap-2"><Check size={18} /> ¡Guardado!</span>
          ) : (
            <span className="flex items-center gap-2"><Save size={18} /> Guardar disponibilidad</span>
          )}
        </Button>
      </div>
    </div>
  )
}
