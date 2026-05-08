import { useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut, ChevronRight, Target, Bell, HelpCircle } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useLogout, useProfile } from '../../hooks/useAuth'
import { useActiveMetas, useCreateMeta } from '../../hooks/useTransacciones'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { AmountInput } from '../../components/ui/AmountInput'
import { Modal } from '../../components/ui/Modal'
import { formatCurrency, getWeekStart, getWeekEnd } from '../../lib/utils'

export function ProfilePage() {
  const { user } = useAuthStore()
  const { data: profile } = useProfile()
  const { data: metas } = useActiveMetas()
  const { mutate: logout, isPending: loggingOut } = useLogout()
  const { mutate: createMeta, isPending: creatingMeta } = useCreateMeta()
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [newBudget, setNewBudget] = useState(0)

  const weeklyMeta = metas?.find((m) => m.tipoMeta === 'SEMANAL')
  const initials = user?.nombre.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()

  const handleUpdateBudget = () => {
    if (newBudget <= 0) return
    const start = getWeekStart()
    const end = getWeekEnd(start)
    createMeta(
      {
        tipoMeta: 'SEMANAL',
        montoObjetivo: newBudget,
        fechaInicio: start.toISOString(),
        fechaFin: end.toISOString(),
      },
      { onSuccess: () => setShowBudgetModal(false) }
    )
  }

  return (
    <div className="px-5 pt-14 pb-32 space-y-5 relative">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary-dark/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold font-display text-white">Perfil</h1>
      </motion.div>

      {/* Avatar + name */}
      <Card animate>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-dark to-purple-900 flex items-center justify-center flex-shrink-0 shadow-glow">
            <span className="text-2xl font-extrabold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-white text-lg truncate">{user?.nombre}</p>
            <p className="text-sm text-text-muted truncate">{user?.email}</p>
            {user?.universidad && (
              <p className="text-xs text-text-muted mt-0.5">{user.universidad}{user.semestre ? ` · Sem. ${user.semestre}` : ''}</p>
            )}
          </div>
        </div>
      </Card>

      {/* AI Summary */}
      {profile?.perfil?.resumenIA && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-surface-elevated border border-border-light rounded-3xl p-4"
          style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #2A1A4E 100%)', border: '1px solid rgba(124,77,255,0.2)' }}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <p className="text-xs font-bold text-primary-dark/80 uppercase tracking-wide mb-1">Tu perfil financiero</p>
              <p className="text-sm text-text-muted leading-relaxed">{profile.perfil.resumenIA}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Weekly budget */}
      <Card animate>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-surface-elevated border border-border-light flex items-center justify-center">
              <Target size={18} className="text-neon-green" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Presupuesto semanal</p>
              <p className="text-text-muted text-xs">
                {weeklyMeta ? formatCurrency(weeklyMeta.montoObjetivo) + ' / semana' : 'Sin configurar'}
              </p>
            </div>
          </div>
          <button
            onClick={() => { setNewBudget(weeklyMeta?.montoObjetivo ?? 0); setShowBudgetModal(true) }}
            className="text-xs font-bold text-neon-green bg-neon-green/10 border border-neon-green/20 px-3 py-1.5 rounded-xl hover:bg-neon-green/20 transition-colors"
          >
            Editar
          </button>
        </div>

        {weeklyMeta && (
          <div className="mt-4 pt-4 border-t border-border-light">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-muted">Gastado esta semana</span>
              <span className="font-bold text-white">{formatCurrency(weeklyMeta.montoGastado)}</span>
            </div>
            <div className="h-2 bg-surface-elevated rounded-full">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min((weeklyMeta.montoGastado / weeklyMeta.montoObjetivo) * 100, 100)}%`,
                  backgroundColor: weeklyMeta.montoGastado > weeklyMeta.montoObjetivo ? '#FF6B6B' : '#A8FF3E',
                }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Settings items */}
      <Card animate padding="none">
        {[
          { icon: Bell, label: 'Notificaciones', sub: 'Recordatorios y alertas' },
          { icon: HelpCircle, label: 'Ayuda y soporte', sub: 'Preguntas frecuentes' },
        ].map(({ icon: Icon, label, sub }, i) => (
          <button
            key={label}
            className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-surface-elevated transition-colors ${i > 0 ? 'border-t border-border-light' : ''}`}
          >
            <div className="w-10 h-10 rounded-2xl bg-surface-elevated border border-border-light flex items-center justify-center">
              <Icon size={18} className="text-text-muted" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-white text-sm">{label}</p>
              <p className="text-xs text-text-muted">{sub}</p>
            </div>
            <ChevronRight size={16} className="text-text-muted" />
          </button>
        ))}
      </Card>

      {/* App info */}
      <div className="text-center space-y-1">
        <p className="text-xs text-text-muted font-medium">PULSO v1.0.0</p>
        <p className="text-xs text-text-dim">Acompañamiento Financiero Universitario</p>
      </div>

      <Button
        variant="ghost"
        fullWidth
        loading={loggingOut}
        onClick={() => logout()}
        className="text-red-400 hover:bg-red-500/10 border border-red-500/20"
      >
        <LogOut size={16} className="mr-2" /> Cerrar sesión
      </Button>

      {/* Budget modal */}
      <Modal open={showBudgetModal} onClose={() => setShowBudgetModal(false)} title="Presupuesto semanal">
        <div className="px-5 py-4 space-y-4">
          <AmountInput value={newBudget} onChange={setNewBudget} label="Nuevo presupuesto semanal" />
          <Button onClick={handleUpdateBudget} loading={creatingMeta} disabled={newBudget <= 0} fullWidth size="lg">
            Guardar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
