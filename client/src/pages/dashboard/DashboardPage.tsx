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
    <div className="px-5 pt-14 pb-32 space-y-5 relative">
      {/* Background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary-dark/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <p className="text-text-muted text-sm font-medium">{greeting} 👋</p>
          <h1 className="text-2xl font-bold font-display text-white">{firstName}</h1>
        </div>
        <button
          onClick={() => navigate('/weekly')}
          className="w-10 h-10 rounded-2xl bg-surface-raised border border-border-light flex items-center justify-center hover:border-neon-green/50 transition-colors"
        >
          <Zap size={18} className="text-neon-green" />
        </button>
      </motion.div>

      {/* Budget Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #2A1A4E 100%)', border: '1px solid rgba(124,77,255,0.3)' }}
      >
        <div className="p-5">
          <div className="flex items-center gap-5">
            <ProgressCircle
              value={gastado}
              max={presupuesto}
              size={110}
              strokeWidth={8}
              label={`${pct}%`}
              sublabel="gastado"
            />
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-text-muted text-xs font-medium uppercase tracking-wide">Gastado esta semana</p>
                <p className="text-3xl font-bold font-display text-white">
                  {summaryLoading ? '—' : formatCurrency(gastado)}
                </p>
              </div>
              <div className="h-px bg-white/10" />
              <div>
                <p className="text-text-muted text-xs">Disponible</p>
                <p className="text-lg font-bold text-neon-green">{formatCurrency(remaining)}</p>
              </div>
              <p className="text-xs text-text-dim">de {formatCurrency(presupuesto)} semanales</p>
            </div>
          </div>

          {summary && summary.categoryBreakdown.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
              {summary.categoryBreakdown.slice(0, 4).map((c) => (
                <div key={c.categoria} className="flex items-center gap-2">
                  <span className="text-xs text-text-muted w-24 truncate">{c.categoria}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${c.porcentaje}%`, backgroundColor: CATEGORY_COLORS[c.categoria] ?? '#A8FF3E' }}
                    />
                  </div>
                  <span className="text-xs text-text-muted w-14 text-right font-semibold">
                    {formatCurrency(c.monto)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

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
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-white font-display">Recientes</h2>
          <button
            onClick={() => navigate('/weekly')}
            className="text-xs text-neon-green font-semibold hover:brightness-110"
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
        className="fixed bottom-28 right-5 w-14 h-14 rounded-2xl bg-neon-green text-[#0A0A12] shadow-neon flex items-center justify-center z-20 font-bold"
      >
        <Plus size={26} strokeWidth={2.5} />
      </motion.button>
    </div>
  )
}
