import { motion } from 'framer-motion'
import { Button } from '../../../components/ui/Button'

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center gap-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-neon-green/20 rounded-[2.5rem] blur-2xl" />
        <div className="relative w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-primary-dark to-purple-900 flex items-center justify-center shadow-glow">
          <span className="text-5xl">⚡</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-3"
      >
        <h1 className="text-4xl font-extrabold font-display text-white tracking-tight">
          Bienvenido a<br />
          <span className="text-5xl text-neon-green" style={{ textShadow: '0 0 20px rgba(168,255,62,0.4)' }}>PULSO</span>
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
        <p className="text-xs text-text-dim">
          Configuración rápida en 2 minutos ✨
        </p>
      </motion.div>
    </div>
  )
}
