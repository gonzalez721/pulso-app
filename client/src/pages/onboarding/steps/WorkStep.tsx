import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../../../components/ui/Button'
import { AmountInput } from '../../../components/ui/AmountInput'

const HORAS_PRESETS = [10, 20, 30, 40, 48]

export interface WorkStepData {
  ingresoMensual: number
  horasTrabajoSemanal: number
}

export function WorkStep({ onNext }: { onNext: (data: WorkStepData) => void }) {
  const [ingreso, setIngreso] = useState(0)
  const [horas, setHoras] = useState(0)
  const [horasInput, setHorasInput] = useState('')

  const valorHora =
    horas > 0 && ingreso > 0
      ? Math.round(ingreso / (horas * 4.33))
      : null

  const isValid = ingreso > 0 && horas > 0

  const handleHorasInput = (val: string) => {
    setHorasInput(val)
    const n = parseInt(val, 10)
    if (!isNaN(n) && n > 0) setHoras(n)
    else if (val === '') setHoras(0)
  }

  const handlePreset = (h: number) => {
    setHoras(h)
    setHorasInput(String(h))
  }

  return (
    <div className="flex flex-col min-h-screen px-6 pt-4 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h2 className="text-2xl font-extrabold font-display text-white">
          ¿Cuánto ganas y cuánto trabajas?
        </h2>
        <p className="text-text-muted mt-2 text-sm leading-relaxed">
          Con esto te decimos cuántas horas de trabajo cuesta cada gasto — la herramienta más poderosa para crear consciencia real.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        <AmountInput value={ingreso} onChange={setIngreso} label="¿Cuánto ganas al mes?" />

        <div>
          <label className="text-sm font-semibold text-white mb-3 block">
            ¿Cuántas horas trabajas por semana?
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {HORAS_PRESETS.map((h) => (
              <button
                key={h}
                onClick={() => handlePreset(h)}
                className={`
                  px-4 py-2 rounded-2xl text-sm font-bold border-2 transition-all
                  ${horas === h
                    ? 'bg-neon-green border-neon-green text-[#0A0A12] shadow-neon'
                    : 'bg-surface-elevated border-border-light text-white hover:border-neon-green/40'
                  }
                `}
              >
                {h}h
              </button>
            ))}
          </div>
          <input
            type="number"
            min={1}
            max={80}
            value={horasInput}
            onChange={(e) => handleHorasInput(e.target.value)}
            placeholder="O escribe las horas exactas..."
            className="w-full bg-surface-elevated border border-border-light rounded-2xl px-4 py-3 text-white placeholder-text-dim focus:outline-none focus:border-neon-green/60 text-sm"
          />
        </div>

        {valorHora !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-4"
            style={{ background: 'rgba(168,255,62,0.08)', border: '1px solid rgba(168,255,62,0.25)' }}
          >
            <p className="text-sm text-text-muted font-medium mb-1">Tu valor por hora aproximado</p>
            <p className="text-2xl font-extrabold text-neon-green">
              ${valorHora.toLocaleString('es-CO')}
              <span className="text-base font-normal text-text-muted"> /hora</span>
            </p>
            <p className="text-xs text-text-dim mt-1">
              Cada vez que registres un gasto, te diremos cuántas horas de trabajo representa.
            </p>
          </motion.div>
        )}

        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-sm text-text-muted">
            🔒 Esta información es privada. Solo se usa para mostrarte el costo real de tus gastos.
          </p>
        </div>
      </motion.div>

      <div className="mt-auto space-y-3 pt-6">
        <Button
          onClick={() => isValid && onNext({ ingresoMensual: ingreso, horasTrabajoSemanal: horas })}
          disabled={!isValid}
          fullWidth
          size="lg"
        >
          Continuar
        </Button>
        <button
          onClick={() => onNext({ ingresoMensual: 0, horasTrabajoSemanal: 0 })}
          className="w-full text-sm text-text-dim text-center py-2 hover:text-text-muted transition-colors"
        >
          Prefiero no compartir esto →
        </button>
      </div>
    </div>
  )
}
