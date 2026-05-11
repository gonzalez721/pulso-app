import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useAsesorStore } from '../../store/asesorStore'
import { useTourStore } from '../../store/tourStore'

// ── Mini visual mockups ────────────────────────────────────────────────
function StatsMock() {
  const stats = [
    { label: 'Hoy', value: '2', accent: '#A8FF3E' },
    { label: 'Semana', value: '5', accent: '#7C4DFF' },
    { label: 'Completadas', value: '12', accent: '#3B82F6' },
  ]
  return (
    <div className="rounded-3xl p-5"
      style={{ background: 'rgba(168,255,62,0.05)', border: '1px solid rgba(168,255,62,0.15)' }}>
      <p className="text-xs font-bold uppercase tracking-widest mb-4 text-center" style={{ color: 'rgba(168,255,62,0.6)' }}>
        Tu actividad
      </p>
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl p-3 text-center"
            style={{ background: `${s.accent}10`, border: `1px solid ${s.accent}25` }}>
            <p className="text-2xl font-extrabold" style={{ color: s.accent }}>{s.value}</p>
            <p className="text-[10px] font-semibold text-text-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SesionMock() {
  return (
    <div className="rounded-3xl p-5 space-y-3"
      style={{ background: 'rgba(124,77,255,0.06)', border: '1px solid rgba(124,77,255,0.2)' }}>
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(124,77,255,0.7)' }}>
        Próxima sesión
      </p>
      {[
        { name: 'Juan Pérez', time: 'Hoy 3:00 PM', estado: 'programada' },
        { name: 'Ana Rodríguez', time: 'Mañana 10:00 AM', estado: 'programada' },
      ].map((s) => (
        <div key={s.name} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
            style={{ background: 'rgba(124,77,255,0.2)' }}>
            {s.name[0]}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">{s.name}</p>
            <p className="text-xs" style={{ color: 'rgba(124,77,255,0.8)' }}>{s.time}</p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-lg font-semibold"
            style={{ background: 'rgba(168,255,62,0.1)', color: '#A8FF3E' }}>
            ✓
          </span>
        </div>
      ))}
    </div>
  )
}

function DisponibilidadMock() {
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']
  const active = [true, true, false, true, false]
  return (
    <div className="rounded-3xl p-5"
      style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
      <p className="text-xs font-bold uppercase tracking-widest mb-4 text-center" style={{ color: 'rgba(59,130,246,0.7)' }}>
        Tu disponibilidad
      </p>
      <div className="flex justify-center gap-2">
        {days.map((d, i) => (
          <div key={d} className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-semibold text-text-dim">{d}</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: active[i] ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
                border: active[i] ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.08)',
              }}>
              {active[i] && <span className="text-[10px]" style={{ color: '#3B82F6' }}>✓</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HistoriaMock() {
  return (
    <div className="rounded-3xl p-5"
      style={{ background: 'rgba(168,255,62,0.05)', border: '1px solid rgba(168,255,62,0.15)' }}>
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(168,255,62,0.6)' }}>
        Historia de Juan · 3 meses
      </p>
      <div className="space-y-2">
        {[
          { cat: '🍔 Comida', pct: 45, color: '#FF6B6B' },
          { cat: '🚌 Transporte', pct: 25, color: '#A8FF3E' },
          { cat: '📚 Educación', pct: 18, color: '#7C4DFF' },
        ].map((item) => (
          <div key={item.cat}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-muted">{item.cat}</span>
              <span className="font-bold text-white">{item.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: item.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Step definitions ───────────────────────────────────────────────────
const STEPS = [
  {
    emoji: '🎓',
    title: 'Bienvenido al Portal Asesor',
    body: 'Desde aquí acompañas a tus estudiantes en su educación financiera. Ves su historial, agendas sesiones y los guías personalmente.',
    accent: '#A8FF3E',
    visual: null,
  },
  {
    emoji: '📊',
    title: 'Tu dashboard',
    body: 'Ve de un vistazo tus sesiones de hoy, las de esta semana, y cuántas has completado. Tu actividad, siempre visible.',
    accent: '#A8FF3E',
    visual: <StatsMock />,
  },
  {
    emoji: '📅',
    title: 'Gestiona tus sesiones',
    body: 'Ve todas las sesiones programadas con tus estudiantes. Acepta, aplaza o completa cada sesión y deja observaciones detalladas.',
    accent: '#7C4DFF',
    visual: <SesionMock />,
  },
  {
    emoji: '⏰',
    title: 'Tu disponibilidad',
    body: 'Define qué días y horas estás disponible. Los estudiantes solo podrán agendarte cuando tú lo hayas habilitado.',
    accent: '#3B82F6',
    visual: <DisponibilidadMock />,
  },
  {
    emoji: '🔍',
    title: 'Historia de cada estudiante',
    body: 'Accede al historial de gastos, patrones y evolución de cada estudiante antes de cada sesión. Llega siempre preparado.',
    accent: '#A8FF3E',
    visual: <HistoriaMock />,
  },
  {
    emoji: '✅',
    title: '¡Todo listo!',
    body: 'Configura tu disponibilidad como primer paso para que los estudiantes puedan agendarte. Están esperándote.',
    accent: '#A8FF3E',
    visual: null,
  },
]

// ── Main component ─────────────────────────────────────────────────────
export function AsesorTour() {
  const { asesorDone, markAsesorDone } = useTourStore()
  const { asesor, isAuthenticated } = useAsesorStore()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)

  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  if (asesorDone || !isAuthenticated || !asesor) return null

  const go = (n: number) => { setDir(n > step ? 1 : -1); setStep(n) }
  const next = () => { if (isLast) markAsesorDone(); else go(step + 1) }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] flex flex-col"
      style={{ background: 'rgba(8,8,16,0.97)', backdropFilter: 'blur(12px)' }}
    >
      {/* Progress + skip */}
      <div className="flex items-center justify-between px-5 pt-12 pb-2">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <button key={i} onClick={() => go(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? 24 : 6,
                background: i === step ? current.accent : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
        <button
          onClick={markAsesorDone}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <X size={15} className="text-text-muted" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 40 }),
              center: { opacity: 1, x: 0 },
              exit:  (d: number) => ({ opacity: 0, x: d * -40 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex-1 flex flex-col items-center justify-center gap-6"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
              className="text-7xl select-none"
            >
              {current.emoji}
            </motion.div>

            {current.visual && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="w-full max-w-xs"
              >
                {current.visual}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <h2 className="text-2xl font-extrabold font-display text-white mb-3">
                {current.title}
              </h2>
              <p className="text-text-muted leading-relaxed text-sm max-w-xs mx-auto">
                {current.body}
              </p>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-12 space-y-3">
        <button
          onClick={next}
          className="w-full py-4 rounded-2xl font-extrabold text-base transition-all"
          style={{ background: current.accent, color: '#080810' }}
        >
          {isLast ? '¡Empezar a asesorar!' : 'Siguiente →'}
        </button>
        {!isLast && (
          <button onClick={markAsesorDone} className="w-full text-sm text-text-dim text-center py-2">
            Saltar tour
          </button>
        )}
      </div>
    </motion.div>,
    document.body
  )
}
