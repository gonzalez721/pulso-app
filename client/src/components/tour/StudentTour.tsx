import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useTourStore } from '../../store/tourStore'
import { useUIStore } from '../../store/uiStore'

// ── Mini visual mockups ────────────────────────────────────────────────
function BudgetMock() {
  const r = 36, stroke = 7, circ = 2 * Math.PI * r
  const pct = 0.62
  return (
    <div className="rounded-3xl p-5 flex flex-col items-center gap-3"
      style={{ background: 'rgba(168,255,62,0.06)', border: '1px solid rgba(168,255,62,0.2)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(168,255,62,0.6)' }}>
        Esta semana
      </p>
      <div className="relative" style={{ width: 90, height: 90 }}>
        <svg width={90} height={90} className="rotate-[-90deg]">
          <circle cx={45} cy={45} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
          <circle cx={45} cy={45} r={r} fill="none" stroke="#A8FF3E" strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold text-white">62%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-white font-extrabold">$186.000 gastados</p>
        <p className="text-xs" style={{ color: 'rgba(168,255,62,0.7)' }}>de $300.000 presupuesto</p>
      </div>
    </div>
  )
}

function PausaMock() {
  return (
    <div className="rounded-3xl p-5 text-center"
      style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.3)' }}>
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,71,87,0.7)' }}>
        ⏸ Pausa PULSO
      </p>
      <p className="text-4xl font-extrabold mb-1" style={{ color: '#ff4757' }}>3h 20min</p>
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
        de trabajo para pagar esto
      </p>
      <p className="text-xs mt-3" style={{ color: 'rgba(255,71,87,0.6)' }}>¿Vale la pena?</p>
    </div>
  )
}

function WeeklyMock() {
  const bars = [45, 70, 30, 85, 55, 20, 60]
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
  return (
    <div className="rounded-3xl p-5"
      style={{ background: 'rgba(124,77,255,0.06)', border: '1px solid rgba(124,77,255,0.2)' }}>
      <p className="text-xs font-bold uppercase tracking-widest mb-4 text-center" style={{ color: 'rgba(124,77,255,0.8)' }}>
        Tus gastos esta semana
      </p>
      <div className="flex items-end justify-center gap-2 h-14">
        {bars.map((h, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-6 rounded-t-lg transition-all"
              style={{ height: `${h * 0.56}px`, background: i === 3 ? '#7C4DFF' : 'rgba(124,77,255,0.3)' }} />
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SessionMock() {
  return (
    <div className="rounded-3xl p-5"
      style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg"
          style={{ background: 'rgba(59,130,246,0.15)' }}>🎓</div>
        <div>
          <p className="text-sm font-bold text-white">María González</p>
          <p className="text-xs" style={{ color: 'rgba(59,130,246,0.8)' }}>Asesora Financiera</p>
        </div>
      </div>
      <div className="rounded-2xl px-4 py-2.5 text-center"
        style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <p className="text-sm font-semibold text-white">Martes 14 ene · 4:00 PM</p>
        <p className="text-xs" style={{ color: 'rgba(59,130,246,0.8)' }}>Sesión programada ✓</p>
      </div>
    </div>
  )
}

// ── Step definitions ───────────────────────────────────────────────────
const STEPS = [
  {
    emoji: '👋',
    title: 'Bienvenido a PULSO',
    body: 'Tu plataforma de educación financiera universitaria. En 2 minutos verás todo lo que PULSO puede hacer para transformar tu relación con el dinero.',
    accent: '#A8FF3E',
    visual: null,
    cta: null,
  },
  {
    emoji: '📊',
    title: 'Tu tablero',
    body: 'Ve cuánto has gastado esta semana vs tu presupuesto en tiempo real. El círculo te muestra qué tan cerca estás del límite.',
    accent: '#A8FF3E',
    visual: <BudgetMock />,
    cta: null,
  },
  {
    emoji: '⏸',
    title: 'La Pausa Consciente',
    body: 'Antes de cada gasto, PULSO te muestra cuántas horas de trabajo representa. No es restricción — es claridad.',
    accent: '#FF4757',
    visual: <PausaMock />,
    cta: 'openAddTransaction',
  },
  {
    emoji: '📅',
    title: 'Resumen semanal',
    body: 'Cada semana un análisis de tus patrones: en qué gastas, cuándo, y cómo mejorar. Tus datos trabajan para ti.',
    accent: '#7C4DFF',
    visual: <WeeklyMock />,
    cta: null,
  },
  {
    emoji: '🤝',
    title: 'Tu asesor financiero',
    body: 'Tienes acceso a sesiones 1 a 1 con un asesor que ve tu historial completo y te guía personalmente.',
    accent: '#3B82F6',
    visual: <SessionMock />,
    cta: null,
  },
  {
    emoji: '✅',
    title: '¡Listo para empezar!',
    body: 'Registra tu primer gasto y experimenta la Pausa PULSO. Recuerda: no juzga — solo te ayuda a entender el costo real de tus decisiones.',
    accent: '#A8FF3E',
    visual: null,
    cta: null,
  },
]

// ── Main component ─────────────────────────────────────────────────────
export function StudentTour() {
  const { studentDone, markStudentDone } = useTourStore()
  const { user } = useAuthStore()
  const { setShowAddTransaction } = useUIStore()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)

  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  // Reset step to 0 whenever the tour becomes visible again (e.g. after reset)
  useEffect(() => {
    if (!studentDone) setStep(0)
  }, [studentDone])

  if (studentDone || !user?.onboardingComplete) return null

  const go = (n: number) => {
    setDir(n > step ? 1 : -1)
    setStep(n)
  }

  const next = () => {
    if (isLast) {
      markStudentDone()
    } else {
      go(step + 1)
    }
  }

  const tryFeature = () => {
    if (current.cta === 'openAddTransaction') {
      markStudentDone()
      setShowAddTransaction(true)
    }
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] flex flex-col"
      style={{ background: 'rgba(8,8,16,0.97)', backdropFilter: 'blur(12px)' }}
    >
      {/* Skip */}
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
          onClick={() => markStudentDone()}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <X size={15} className="text-text-muted" />
        </button>
      </div>

      {/* Step content */}
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
            {/* Emoji */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
              className="text-7xl select-none"
            >
              {current.emoji}
            </motion.div>

            {/* Visual mockup */}
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

            {/* Text */}
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

            {/* Try it button */}
            {current.cta && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                onClick={tryFeature}
                className="px-6 py-3 rounded-2xl text-sm font-bold transition-all"
                style={{
                  background: `${current.accent}15`,
                  border: `1px solid ${current.accent}40`,
                  color: current.accent,
                }}
              >
                Probar ahora →
              </motion.button>
            )}
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
          {isLast ? '¡Empezar ahora!' : 'Siguiente →'}
        </button>
        {!isLast && (
          <button
            onClick={() => markStudentDone()}
            className="w-full text-sm text-text-dim text-center py-2"
          >
            Saltar tour
          </button>
        )}
      </div>
    </motion.div>,
    document.body
  )
}
