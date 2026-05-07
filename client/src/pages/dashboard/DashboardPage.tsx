import { motion } from 'framer-motion'
import { Plus, Zap } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { useWeeklySummary, useActiveMetas, useTransacciones } from '../../hooks/useTransacciones'
import { ProgressCircle } from '../../components/ui/ProgressCircle'
import { Card } from '../../components/ui/Card'
import { TransactionItem } from '../../components/ui/TransactionItem'
import { CategoryPill } from '../../components/ui/CategoryPill'
import { formatCurrency, formatDate } from '../../lib/utils'
import { CATEGORY_COLORS } from '../../types'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const { user } = useAuthStore()
  const { setShowAddTransaction } = useUIStore()
  const navigate = useNavigate()

  const { data: summary, isLoading: summaryLoading } = useWeeklySummary()
  const { data: metas } = useActiveMetas()
  const { data: txData } = useTransacciones({ limit: 5 })

  const weeklyMeta = metas?.find((m) => m.tipoMeta === 'SEMANAL')
  const presupuesto = weeklyMeta?.montoObjetivo ?? 700
  const gastado = summary?.total ?? weeklyMeta?.montoGastado ?? 0
  const pct = Math.round((gastado / presupuesto) * 100)
  const remaining = Math.max(presupuesto - gastado, 0)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = user?.nombre.split(' ')[0] ?? ''

  return (
    <div className="px-5 pt-14 pb-6 space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <p className="text-text-muted text-sm font-medium">{greeting} 👋</p>
          <h1 className="text-2xl font-extrabold font-display text-primary-dark">{firstName}</h1>
        </div>
        <button
          onClick={() => navigate('/weekly')}
          className="w-10 h-10 rounded-2xl bg-primary-light flex items-center justify-center hover:bg-accent-peach transition-colors"
        >
          <Zap size={18} className="text-primary-dark" />
        </button>
      </motion.div>

      {/* Budget Card */}
      <Card animate className="bg-primary-dark text-white">
        <div className="flex items-center gap-5">
          <ProgressCircle
            value={gastado}
            max={presupuesto}
            size={120}
            strokeWidth={10}
            label={`${pct}%`}
            sublabel="gastado"
          />
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-wide">Gastado esta semana</p>
              <p className="text-3xl font-extrabold font-display">
                {summaryLoading ? '—' : formatCurrency(gastado)}
              </p>
            </div>
            <div className="h-px bg-white/20" />
            <div>
              <p className="text-white/60 text-xs font-medium">Disponible</p>
              <p className="text-lg font-bold text-accent-peach">{formatCurrency(remaining)}</p>
            </div>
            <div className="text-xs text-white/50 font-medium">
              de {formatCurrency(presupuesto)} semanales
            </div>
          </div>
        </div>

        {/* Category mini-bars */}
        {summary && summary.categoryBreakdown.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/20 space-y-2">
            {summary.categoryBreakdown.slice(0, 4).map((c) => (
              <div key={c.categoria} className="flex items-center gap-2">
                <span className="text-xs text-white/60 w-24 truncate">{c.categoria}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${c.porcentaje}%`,
                      backgroundColor: CATEGORY_COLORS[c.categoria] ?? '#FFD4C8',
                    }}
                  />
                </div>
                <span className="text-xs text-white/70 w-14 text-right font-semibold">
                  {formatCurrency(c.monto)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick categories */}
      {summary && summary.categoryBreakdown.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {summary.categoryBreakdown.map((c) => (
              <CategoryPill key={c.categoria} categoria={c.categoria} size="sm" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent transactions */}
      <Card animate>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-primary-dark font-display">Recientes</h2>
          <button
            onClick={() => navigate('/weekly')}
            className="text-xs text-text-muted font-semibold hover:text-primary-dark"
          >
            Ver todo →
          </button>
        </div>
        {txData?.transacciones.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm">Sin transacciones todavía</p>
          </div>
        ) : (
          <div className="divide-y divide-border-light/50">
            {txData?.transacciones.map((t) => (
              <TransactionItem key={t.id} transaccion={t} />
            ))}
          </div>
        )}
      </Card>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => setShowAddTransaction(true)}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-2xl bg-primary-dark text-white shadow-float flex items-center justify-center z-20"
      >
        <Plus size={26} strokeWidth={2.5} />
      </motion.button>
    </div>
  )
}
