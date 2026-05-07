import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../../../components/ui/Button'
import { CATEGORIAS } from '../../../types'

interface Props {
  onNext: (cats: string[]) => void
  loading?: boolean
}

export function CategoriesStep({ onNext, loading }: Props) {
  const [selected, setSelected] = useState<string[]>(['Comida', 'Transporte'])

  const toggle = (key: string) =>
    setSelected((s) => s.includes(key) ? s.filter((k) => k !== key) : [...s, key])

  return (
    <div className="flex flex-col min-h-screen px-6 pt-4 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h2 className="text-2xl font-extrabold font-display text-primary-dark">
          ¿En qué gastas frecuentemente?
        </h2>
        <p className="text-text-muted mt-1">Selecciona tus categorías principales</p>
      </motion.div>

      <div className="grid grid-cols-3 gap-3 flex-1">
        {CATEGORIAS.map((cat, i) => {
          const isSelected = selected.includes(cat.key)
          return (
            <motion.button
              key={cat.key}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => toggle(cat.key)}
              className={`
                flex flex-col items-center justify-center gap-2 p-4 rounded-3xl border-2 transition-all aspect-square
                ${isSelected
                  ? 'border-primary-dark bg-primary-dark'
                  : 'border-border-light bg-white hover:border-primary-dark/30'
                }
              `}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className={`text-xs font-bold text-center leading-tight ${isSelected ? 'text-white' : 'text-text-dark'}`}>
                {cat.label}
              </span>
            </motion.button>
          )
        })}
      </div>

      <div className="mt-6 space-y-3">
        {loading && (
          <p className="text-center text-sm text-text-muted animate-pulse">
            ✨ Configurando tu perfil con IA...
          </p>
        )}
        <Button
          onClick={() => onNext(selected)}
          disabled={selected.length === 0}
          loading={loading}
          fullWidth
          size="lg"
        >
          ¡Listo, empecemos!
        </Button>
      </div>
    </div>
  )
}
