import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../../../components/ui/Button'

const OPTIONS = [
  { key: 'impulse_spending', emoji: '🛒', label: 'Gastos impulsivos', desc: 'Compro sin pensar' },
  { key: 'tracking', emoji: '📊', label: 'Llevar registro', desc: 'No sé cuánto gasto' },
  { key: 'saving', emoji: '💰', label: 'Ahorrar consistente', desc: 'No logro ahorrar' },
  { key: 'food', emoji: '🍕', label: 'Gasto en comida', desc: 'Como mucho fuera de casa' },
  { key: 'entertainment', emoji: '🎮', label: 'Entretenimiento', desc: 'Suscripciones y salidas' },
  { key: 'anxiety', emoji: '😰', label: 'Ansiedad financiera', desc: 'El dinero me estresa' },
]

export function HabitsStep({ onNext }: { onNext: (difs: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([])

  const toggle = (key: string) =>
    setSelected((s) => s.includes(key) ? s.filter((k) => k !== key) : [...s, key])

  return (
    <div className="flex flex-col min-h-screen px-6 pt-4 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h2 className="text-2xl font-extrabold font-display text-primary-dark">
          ¿Con qué luchas más?
        </h2>
        <p className="text-text-muted mt-1">Selecciona todo lo que aplique</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {OPTIONS.map((opt, i) => {
          const isSelected = selected.includes(opt.key)
          return (
            <motion.button
              key={opt.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => toggle(opt.key)}
              className={`
                flex flex-col items-start p-4 rounded-3xl border-2 text-left transition-all
                ${isSelected
                  ? 'border-primary-dark bg-primary-dark text-white'
                  : 'border-border-light bg-white text-text-dark hover:border-primary-dark/30'
                }
              `}
            >
              <span className="text-2xl mb-2">{opt.emoji}</span>
              <p className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-primary-dark'}`}>
                {opt.label}
              </p>
              <p className={`text-xs mt-0.5 ${isSelected ? 'text-white/70' : 'text-text-muted'}`}>
                {opt.desc}
              </p>
            </motion.button>
          )
        })}
      </div>

      <Button
        onClick={() => onNext(selected)}
        fullWidth
        size="lg"
        className="mt-6"
      >
        {selected.length === 0 ? 'Omitir' : 'Continuar'}
      </Button>
    </div>
  )
}
