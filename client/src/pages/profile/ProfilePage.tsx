import { useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut, ChevronRight, Target, Bell, BellOff, HelpCircle, Briefcase, RefreshCw, Edit2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useLogout, useProfile } from '../../hooks/useAuth'
import { useActiveMetas, useCreateMeta } from '../../hooks/useTransacciones'
import { useTourStore } from '../../store/tourStore'
import { userApi } from '../../api/endpoints'
import { usePushNotifications } from '../../hooks/usePushNotifications'

import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { AmountInput } from '../../components/ui/AmountInput'
import { Modal } from '../../components/ui/Modal'
import { formatCurrency, getWeekStart, getWeekEnd } from '../../lib/utils'

const HORAS_PRESETS = [10, 20, 30, 40, 48]

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const { data: profile } = useProfile()
  const { data: metas } = useActiveMetas()
  const { mutate: logout, isPending: loggingOut } = useLogout()
  const { mutate: createMeta, isPending: creatingMeta } = useCreateMeta()
  const { resetStudentTour } = useTourStore()
  const push = usePushNotifications()

  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [newBudget, setNewBudget] = useState(0)
  const [showWorkModal, setShowWorkModal] = useState(false)
  const [workIngreso, setWorkIngreso] = useState(0)
  const [workHoras, setWorkHoras] = useState(0)
  const [workHorasInput, setWorkHorasInput] = useState('')
  const [savingWork, setSavingWork] = useState(false)

  const openWorkModal = () => {
    setWorkIngreso(user?.ingresoMensual ?? 0)
    const h = user?.horasTrabajoSemanal ?? 0
    setWorkHoras(h)
    setWorkHorasInput(h > 0 ? String(h) : '')
    setShowWorkModal(true)
  }

  const saveWork = async () => {
    setSavingWork(true)
    try {
      const { data } = await userApi.updateProfile({
        ingresoMensual: workIngreso > 0 ? workIngreso : undefined,
        horasTrabajoSemanal: workHoras > 0 ? workHoras : undefined,
      })
      setUser(data)
      setShowWorkModal(false)
    } finally {
      setSavingWork(false)
    }
  }

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

      {/* Work data */}
      <Card animate>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-surface-elevated border border-border-light flex items-center justify-center">
              <Briefcase size={18} className="text-neon-green" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Datos laborales</p>
              <p className="text-text-muted text-xs">
                {user?.ingresoMensual
                  ? `${formatCurrency(user.ingresoMensual)}/mes · ${user.horasTrabajoSemanal ?? '?'}h/sem`
                  : 'Sin configurar — necesario para la Pausa PULSO'}
              </p>
            </div>
          </div>
          <button
            onClick={openWorkModal}
            className="text-xs font-bold text-neon-green bg-neon-green/10 border border-neon-green/20 px-3 py-1.5 rounded-xl hover:bg-neon-green/20 transition-colors flex items-center gap-1"
          >
            <Edit2 size={11} />
            {user?.ingresoMensual ? 'Editar' : 'Agregar'}
          </button>
        </div>
        {user?.ingresoMensual && user?.horasTrabajoSemanal ? (
          <div className="mt-4 pt-4 border-t border-border-light">
            <p className="text-xs text-text-dim leading-relaxed">
              Tu valor hora aproximado:{' '}
              <span className="text-neon-green font-bold">
                {formatCurrency(Math.round(user.ingresoMensual / (user.horasTrabajoSemanal * 4.33)))}/hora
              </span>
              {' '}— usado en la Pausa PULSO al registrar gastos.
            </p>
          </div>
        ) : null}
      </Card>

      {/* Push notifications toggle */}
      {push.supported && (
        <Card animate>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-surface-elevated border border-border-light flex items-center justify-center">
                {push.subscribed ? <Bell size={18} className="text-neon-green" /> : <BellOff size={18} className="text-text-muted" />}
              </div>
              <div>
                <p className="font-bold text-white text-sm">Notificaciones push</p>
                <p className="text-text-muted text-xs">
                  {push.permission === 'denied'
                    ? 'Bloqueadas — actívalas en ajustes del navegador'
                    : push.subscribed
                    ? 'Activadas — alertas de presupuesto y sesiones'
                    : 'Desactivadas'}
                </p>
              </div>
            </div>
            {push.permission !== 'denied' && (
              <button
                onClick={push.subscribed ? push.unsubscribe : push.subscribe}
                disabled={push.loading}
                className="relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
                style={{ background: push.subscribed ? '#A8FF3E' : 'rgba(255,255,255,0.12)' }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                  style={{ left: push.subscribed ? '26px' : '2px' }}
                />
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Settings items */}
      <Card animate padding="none">
        {[
          { icon: RefreshCw, label: 'Ver tour de nuevo', sub: 'Repasa todas las funciones', onClick: () => resetStudentTour() },
          { icon: HelpCircle, label: 'Ayuda y soporte', sub: 'Preguntas frecuentes', onClick: () => {} },
        ].map(({ icon: Icon, label, sub, onClick }, i) => (
          <button
            key={label}
            onClick={onClick}
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

      {/* Work data modal */}
      <Modal open={showWorkModal} onClose={() => setShowWorkModal(false)} title="Datos laborales">
        <div className="px-5 py-4 space-y-5">
          <AmountInput value={workIngreso} onChange={setWorkIngreso} label="¿Cuánto ganas al mes?" />

          <div>
            <label className="text-sm font-semibold text-white mb-3 block">
              ¿Cuántas horas trabajas por semana?
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {HORAS_PRESETS.map((h) => (
                <button
                  key={h}
                  onClick={() => { setWorkHoras(h); setWorkHorasInput(String(h)) }}
                  className={`px-4 py-2 rounded-2xl text-sm font-bold border-2 transition-all ${
                    workHoras === h
                      ? 'bg-neon-green border-neon-green text-[#0A0A12]'
                      : 'bg-surface-elevated border-border-light text-white hover:border-neon-green/40'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              max={80}
              value={workHorasInput}
              onChange={(e) => {
                setWorkHorasInput(e.target.value)
                const n = parseInt(e.target.value, 10)
                if (!isNaN(n) && n > 0) setWorkHoras(n)
              }}
              placeholder="O escribe las horas exactas..."
              className="w-full bg-surface-elevated border border-border-light rounded-2xl px-4 py-3 text-white placeholder-text-dim focus:outline-none focus:border-neon-green/60 text-sm"
            />
          </div>

          {workIngreso > 0 && workHoras > 0 && (
            <div className="rounded-2xl p-4 text-center"
              style={{ background: 'rgba(168,255,62,0.08)', border: '1px solid rgba(168,255,62,0.25)' }}>
              <p className="text-sm text-text-muted mb-1">Tu valor hora</p>
              <p className="text-2xl font-extrabold text-neon-green">
                {formatCurrency(Math.round(workIngreso / (workHoras * 4.33)))}
                <span className="text-sm font-normal text-text-muted"> /hora</span>
              </p>
            </div>
          )}

          <Button
            onClick={saveWork}
            loading={savingWork}
            disabled={workIngreso <= 0 || workHoras <= 0}
            fullWidth
            size="lg"
          >
            Guardar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
