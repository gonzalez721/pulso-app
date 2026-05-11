import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Clock, Edit2, LogOut, RefreshCw, Bell, BellOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAsesorStore } from '../../store/asesorStore'
import { useAsesorLogout } from '../../hooks/useAsesor'
import { useTourStore } from '../../store/tourStore'
import { asesorEndpoints } from '../../api/asesorClient'
import { usePushNotifications } from '../../hooks/usePushNotifications'
import { getInitials } from '../../lib/utils'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'

function EditModal({
  open, onClose, asesor, onSaved,
}: {
  open: boolean
  onClose: () => void
  asesor: { nombre: string; bio?: string; carrera: string; semestre: number }
  onSaved: (updated: any) => void
}) {
  const [nombre, setNombre] = useState(asesor.nombre)
  const [bio, setBio] = useState(asesor.bio ?? '')
  const [carrera, setCarrera] = useState(asesor.carrera)
  const [semestre, setSemestre] = useState(String(asesor.semestre))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    if (!nombre.trim()) { setError('El nombre es requerido'); return }
    setLoading(true)
    try {
      const { data } = await asesorEndpoints.updateMe({
        nombre: nombre.trim(),
        bio: bio.trim() || undefined,
        carrera: carrera.trim() || undefined,
        semestre: semestre ? Number(semestre) : undefined,
      })
      onSaved(data)
      onClose()
    } catch {
      setError('Error al guardar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const field = (label: string, value: string, onChange: (v: string) => void, opts?: { textarea?: boolean; type?: string }) => (
    <div>
      <label className="text-sm font-semibold text-white mb-2 block">{label}</label>
      {opts?.textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full bg-surface-elevated border border-border-light rounded-2xl px-4 py-3 text-white placeholder-text-dim focus:outline-none focus:border-neon-green/60 text-sm resize-none"
        />
      ) : (
        <input
          type={opts?.type ?? 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-surface-elevated border border-border-light rounded-2xl px-4 py-3 text-white placeholder-text-dim focus:outline-none focus:border-neon-green/60 text-sm"
        />
      )}
    </div>
  )

  return (
    <Modal open={open} onClose={onClose} title="Editar perfil">
      <div className="px-5 py-4 space-y-4">
        {field('Nombre completo', nombre, setNombre)}
        {field('Carrera', carrera, setCarrera)}
        {field('Semestre', semestre, setSemestre, { type: 'number' })}
        {field('Bio (opcional)', bio, setBio, { textarea: true })}
        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        <Button onClick={save} loading={loading} fullWidth size="lg">Guardar cambios</Button>
      </div>
    </Modal>
  )
}

export function AsesorPerfilPage() {
  const navigate = useNavigate()
  const { asesor, setAsesor } = useAsesorStore()
  const logout = useAsesorLogout()
  const { resetAsesorTour } = useTourStore()
  const [showEdit, setShowEdit] = useState(false)
  const push = usePushNotifications({ role: 'asesor' })

  if (!asesor) return null
  const initials = getInitials(asesor.nombre)

  const handleSaved = (updated: any) => {
    setAsesor({ ...asesor, ...updated })
  }

  return (
    <div className="px-5 pt-6 pb-28 space-y-5">
      {/* Background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary-dark/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold font-display text-white">Perfil</h1>
      </motion.div>

      {/* Avatar card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-dark to-purple-900 flex items-center justify-center flex-shrink-0 shadow-glow">
            {asesor.fotoUrl
              ? <img src={asesor.fotoUrl} className="w-full h-full object-cover rounded-2xl" alt="" />
              : <span className="text-2xl font-extrabold text-white">{initials}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-white text-lg truncate">{asesor.nombre}</p>
            <p className="text-sm text-text-muted truncate">{asesor.email}</p>
            <p className="text-xs text-text-dim mt-0.5">
              {asesor.carrera}{asesor.semestre ? ` · Sem. ${asesor.semestre}` : ''}
            </p>
          </div>
          <button
            onClick={() => setShowEdit(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: 'rgba(168,255,62,0.08)', border: '1px solid rgba(168,255,62,0.2)' }}
          >
            <Edit2 size={15} className="text-neon-green" />
          </button>
        </div>

        {asesor.bio && (
          <div className="mt-4 pt-4 border-t border-border-light">
            <p className="text-sm text-text-muted leading-relaxed">{asesor.bio}</p>
          </div>
        )}
      </motion.div>

      {/* Push notifications toggle */}
      {push.supported && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-3xl p-5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
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
                    ? 'Activadas — recordatorios de sesiones'
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
        </motion.div>
      )}

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-3xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {[
          {
            icon: Clock, label: 'Mi disponibilidad', sub: 'Configura tus horarios de atención',
            onClick: () => navigate('/asesor/disponibilidad'),
          },
          {
            icon: RefreshCw, label: 'Ver tour de nuevo', sub: 'Repasa las funciones de la plataforma',
            onClick: () => resetAsesorTour(),
          },
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
      </motion.div>

      {/* App info */}
      <div className="text-center space-y-1">
        <p className="text-xs text-text-muted font-medium">PULSO Portal Asesor v1.0.0</p>
        <p className="text-xs text-text-dim">Acompañamiento Financiero Universitario</p>
      </div>

      <button
        onClick={logout}
        className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
        style={{ background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.2)', color: '#ff6b78' }}
      >
        <LogOut size={16} />
        Cerrar sesión
      </button>

      <EditModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        asesor={asesor}
        onSaved={handleSaved}
      />
    </div>
  )
}
