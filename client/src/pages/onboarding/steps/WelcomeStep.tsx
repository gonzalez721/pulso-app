import { motion } from 'framer-motion'
import { Button } from '../../../components/ui/Button'

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center gap-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="w-28 h-28 rounded-[2.5rem] bg-primary-dark flex items-center justify-center shadow-float"
      >
        <span className="text-5xl">💸</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-3"
      >
        <h1 className="text-4xl font-extrabold font-display text-primary-dark tracking-tight">
          Bienvenido a<br />
          <span className="text-5xl">PULSO</span>
        </h1>
        <p className="text-text-muted text-lg leading-relaxed max-w-xs">
          Tu acompañante financiero universitario. Controla tus gastos, cumple tus metas.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-xs space-y-3"
      >
        <Button onClick={onNext} fullWidth size="lg">
          Empezar →
        </Button>
        <p className="text-xs text-text-muted">
          Configuración rápida en 2 minutos ✨
        </p>
      </motion.div>
    </div>
  )
}
