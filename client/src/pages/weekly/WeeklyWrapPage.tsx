import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useWeeklySummary } from '../../hooks/useTransacciones'
import { useInsights } from '../../hooks/useInsights'
import { InsightCard } from '../../components/ui/InsightCard'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { formatCurrency, getDayLabel, getWeekStart } from '../../lib/utils'
import { CATEGORY_COLORS } from '../../types'
import { useNavigate } from 'react-router-dom'

function addWeeks(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n * 7)
  return d
}

export function WeeklyWrapPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const navigate = useNavigate()

  const weekStart = addWeeks(getWeekStart(), weekOffset)
  const semana = weekStart.toISOString().split('T')[0]

  const { data: summary, isLoading } = useWeeklySummary(semana)
  const { data: insightData, isLoading: insightsLoading, refetch } = useInsights(semana)

  const isCurrentWeek = weekOffset === 0
  const weekLabel = isCurrentWeek
    ? 'Esta semana'
    : weekOffset === -1
    ? 'Semana pasada'
    : `Sem. del ${weekStart.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`

  return (
    <div className="px-5 pt-14 pb-32 space-y-5 relative">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary-dark/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-2xl font-bold font-display text-white">Weekly Wrap</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="w-8 h-8 rounded-xl bg-surface-elevated border border-border-light flex items-center justify-center hover:border-primary-dark/50 transition-colors"
          >
            <ChevronLeft size={16} className="text-white" />
          </button>
          <span className="text-xs font-bold text-text-muted px-2">{weekLabel}</span>
          <button
            onClick={() => setWeekOffset((o) => Math.min(o + 1, 0))}
            disabled={isCurrentWeek}
            className="w-8 h-8 rounded-xl bg-surface-elevated border border-border-light flex items-center justify-center disabled:opacity-30 hover:border-primary-dark/50 transition-colors"
          >
            <ChevronRight size={16} className="text-white" />
          </button>
        </div>
      </motion.div>

      {/* Total spent */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl overflow-hidden text-center py-8"
        style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #2A1A4E 100%)', border: '1px solid rgba(124,77,255,0.3)' }}
      >
        <p className="text-text-muted text-sm font-medium mb-1">Total gastado</p>
        <p className="text-4xl font-extrabold font-display text-white">
          {isLoading ? '—' : formatCurrency(summary?.total ?? 0)}
        </p>
        <p className="text-text-dim text-xs mt-1">{weekLabel}</p>
      </motion.div>

      {/* Day-by-day chart */}
      {summary && (
        <Card animate>
          <h2 className="font-bold text-white font-display mb-4">Gasto por día</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={summary.dailyBreakdown} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="fecha"
                tickFormatter={getDayLabel}
                tick={{ fontSize: 11, fill: '#8B8BA7', fontWeight: 600 }}
              />
              <YAxis tick={{ fontSize: 10, fill: '#8B8BA7' }} />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), 'Gasto']}
                labelFormatter={getDayLabel}
                contentStyle={{ borderRadius: 12, border: '1px solid #2A2A40', backgroundColor: '#1A1A2E', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,.4)' }}
                labelStyle={{ color: '#8B8BA7' }}
              />
              <Bar dataKey="monto" fill="#7C4DFF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Category breakdown */}
      {summary && summary.categoryBreakdown.length > 0 && (
        <Card animate>
          <h2 className="font-bold text-white font-display mb-4">Por categoría</h2>
          <div className="space-y-3">
            {summary.categoryBreakdown.map((c) => (
              <div key={c.categoria} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[c.categoria] ?? '#E5E5E5' }}
                />
                <span className="text-sm font-medium text-white flex-1">{c.categoria}</span>
                <div className="flex-1 h-2 rounded-full bg-surface-elevated">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${c.porcentaje}%`,
                      backgroundColor: CATEGORY_COLORS[c.categoria] ?? '#E5E5E5',
                    }}
                  />
                </div>
                <span className="text-sm font-bold text-white w-16 text-right">
                  {formatCurrency(c.monto)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI Insights */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-white font-display">Insights ✨</h2>
          <button
            onClick={() => refetch()}
            disabled={insightsLoading}
            className="w-8 h-8 rounded-xl bg-surface-elevated border border-border-light flex items-center justify-center disabled:opacity-40 hover:border-primary-dark/50 transition-colors"
          >
            <RefreshCw size={14} className={`text-text-muted ${insightsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {insightsLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 bg-surface-raised border border-border-light rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {(insightData?.insights ?? []).map((ins, i) => (
              <InsightCard key={i} insight={ins} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <Button
        onClick={() => navigate('/sessions')}
        variant="secondary"
        fullWidth
        size="lg"
      >
        🗓️ Agendar sesión de revisión
      </Button>
    </div>
  )
}
