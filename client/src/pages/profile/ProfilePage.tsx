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
    <div className="px-5 pt-14 pb-6 space-y-5">
      <h1 className="text-2xl font-extrabold font-display text-primary-dark">Perfil</h1>

      {/* Avatar + name */}
      <Card animate>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-dark flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-extrabold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-primary-dark text-lg truncate">{user?.nombre}</p>
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
          className="bg-primary-light rounded-3xl p-4"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <p className="text-xs font-bold text-primary-dark/60 uppercase tracking-wide mb-1">Tu perfil financiero</p>
              <p className="text-sm text-primary-dark leading-relaxed">{profile.perfil.resumenIA}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Weekly budget */}
      <Card animate>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-light flex items-center justify-center">
              <Target size={18} className="text-primary-dark" />
            </div>
            <div>
              <p className="font-bold text-primary-dark text-sm">Presupuesto semanal</p>
              <p className="text-text-muted text-xs">
                {weeklyMeta ? formatCurrency(weeklyMeta.montoObjetivo) + ' / semana' : 'Sin configurar'}
              </p>
            </div>
          </div>
          <button
            onClick={() => { setNewBudget(weeklyMeta?.montoObjetivo ?? 0); setShowBudgetModal(true) }}
            className="text-xs font-bold text-primary-dark bg-primary-light px-3 py-1.5 rounded-xl hover:bg-accent-peach transition-colors"
          >
            Editar
          </button>
        </div>

        {weeklyMeta && (
          <div className="mt-4 pt-4 border-t border-border-light">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-muted">Gastado esta semana</span>
              <span className="font-bold text-text-dark">{formatCurrency(weeklyMeta.montoGastado)}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min((weeklyMeta.montoGastado / weeklyMeta.montoObjetivo) * 100, 100)}%`,
                  backgroundColor: weeklyMeta.montoGastado > weeklyMeta.montoObjetivo ? '#FF9B9B' : '#2D1B4E',
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
            className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${i > 0 ? 'border-t border-border-light' : ''}`}
          >
            <div className="w-10 h-10 rounded-2xl bg-primary-light flex items-center justify-center">
              <Icon size={18} className="text-primary-dark" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-text-dark text-sm">{label}</p>
              <p className="text-xs text-text-muted">{sub}</p>
            </div>
            <ChevronRight size={16} className="text-text-muted" />
          </button>
        ))}
      </Card>

      {/* App info */}
      <div className="text-center space-y-1">
        <p className="text-xs text-text-muted font-medium">PULSO v1.0.0</p>
        <p className="text-xs text-text-muted">Acompañamiento Financiero Universitario</p>
      </div>

      <Button
        variant="ghost"
        fullWidth
        loading={loggingOut}
        onClick={() => logout()}
        className="text-red-500 hover:bg-red-50"
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
