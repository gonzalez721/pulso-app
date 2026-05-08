import { motion } from 'framer-motion'
import type { InsightItem } from '../../types'

interface InsightCardProps {
  insight: InsightItem
  index?: number
}

export function InsightCard({ insight, index = 0 }: InsightCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-surface-raised border border-border-light rounded-3xl p-4 flex items-start gap-3 hover:border-primary-dark/30 transition-colors"
    >
      <div className="w-11 h-11 rounded-2xl bg-surface-elevated border border-border-light flex items-center justify-center text-xl flex-shrink-0">
        {insight.icono}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-sm leading-snug">{insight.titulo}</p>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">{insight.descripcion}</p>
      </div>
    </motion.div>
  )
}
