import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../../../components/ui/Button'
import { AmountInput } from '../../../components/ui/AmountInput'

const PRESETS = [50000, 100000, 150000, 200000, 300000]

export function BudgetStep({ onNext }: { onNext: (budget: number) => void }) {
  const [budget, setBudget] = useState(0)

  return (
    <div className="flex flex-col min-h-screen px-6 pt-4 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h2 className="text-2xl font-extrabold font-display text-white">
          ¿Cuánto quieres gastar por semana?
        </h2>
        <p className="text-text-muted mt-1">
          Este será tu presupuesto semanal. Puedes cambiarlo después.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        <AmountInput value={budget} onChange={setBudget} label="Mi presupuesto semanal" />

        <div>
          <p className="text-sm font-semibold text-text-muted mb-3">Sugerencias rápidas</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setBudget(p)}
                className={`
                  px-4 py-2 rounded-2xl text-sm font-bold border-2 transition-all
                  ${budget === p
                    ? 'bg-neon-green border-neon-green text-[#0A0A12] shadow-neon'
                    : 'bg-surface-elevated border-border-light text-white hover:border-neon-green/40'
                  }
                `}
              >
                ${p}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface-elevated border border-border-light rounded-2xl p-4"
          style={{ borderColor: 'rgba(168,255,62,0.2)', background: 'rgba(168,255,62,0.05)' }}
        >
          <p className="text-sm text-text-muted font-medium">
            💡 El promedio de un estudiante universitario gasta entre $80.000–$150.000 por semana.
          </p>
        </div>
      </motion.div>

      <Button
        onClick={() => budget > 0 && onNext(budget)}
        disabled={budget <= 0}
        fullWidth
        size="lg"
        className="mt-auto"
      >
        Continuar
      </Button>
    </div>
  )
}
