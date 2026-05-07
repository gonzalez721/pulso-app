import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../../../components/ui/Button'

const OPTIONS = [
  { key: 'SAVE_MORE', emoji: '🐷', label: 'Ahorrar más', desc: 'Quiero guardar dinero cada semana' },
  { key: 'SPEND_SMARTER', emoji: '🧠', label: 'Gastar con inteligencia', desc: 'Quiero saber en qué gasto mi dinero' },
  { key: 'STOP_IMPULSE', emoji: '🛑', label: 'Parar gastos impulsivos', desc: 'Compro cosas que luego me arrepiento' },
  { key: 'LESS_STRESS', emoji: '😌', label: 'Menos estrés financiero', desc: 'El dinero me genera ansiedad' },
]

export function ObjectiveStep({ onNext }: { onNext: (obj: string) => void }) {
  const [selected, setSelected] = useState('')

  return (
    <div className="flex flex-col min-h-screen px-6 pt-4 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-extrabold font-display text-primary-dark">
          ¿Cuál es tu objetivo principal?
        </h2>
        <p className="text-text-muted mt-1">Esto nos ayuda a personalizar tu experiencia</p>
      </motion.div>

      <div className="flex flex-col gap-3 flex-1">
        {OPTIONS.map((opt, i) => (
          <motion.button
            key={opt.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => setSelected(opt.key)}
            className={`
              w-full flex items-center gap-4 p-4 rounded-3xl border-2 text-left transition-all
              ${selected === opt.key
                ? 'border-primary-dark bg-primary-dark text-white'
                : 'border-border-light bg-white text-text-dark hover:border-primary-dark/30'
              }
            `}
          >
            <span className="text-3xl">{opt.emoji}</span>
            <div>
              <p className={`font-bold ${selected === opt.key ? 'text-white' : 'text-primary-dark'}`}>
                {opt.label}
              </p>
              <p className={`text-sm mt-0.5 ${selected === opt.key ? 'text-white/70' : 'text-text-muted'}`}>
                {opt.desc}
              </p>
            </div>
            {selected === opt.key && (
              <span className="ml-auto text-white text-xl">✓</span>
            )}
          </motion.button>
        ))}
      </div>

      <Button
        onClick={() => selected && onNext(selected)}
        disabled={!selected}
        fullWidth
        size="lg"
        className="mt-6"
      >
        Continuar
      </Button>
    </div>
  )
}
