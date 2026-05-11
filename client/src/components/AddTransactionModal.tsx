import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { AmountInput } from './ui/AmountInput'
import { Input } from './ui/Input'
import { CategoryPill } from './ui/CategoryPill'
import { PactoAlertaModal } from './PactoAlertaModal'
import { CATEGORIAS } from '../types'
import { useCreateTransaccion } from '../hooks/useTransacciones'
import { usePactoPartner } from '../hooks/usePacto'
import { useAuthStore } from '../store/authStore'

interface Props {
  open: boolean
  onClose: () => void
}

function calcHoras(monto: number, ingresoMensual: number, horasSemanales: number): number | null {
  if (!ingresoMensual || !horasSemanales || monto <= 0) return null
  const valorHora = ingresoMensual / (horasSemanales * 4.33)
  const horas = monto / valorHora
  return Math.max(0.1, Math.round(horas * 10) / 10)
}

function formatHoras(h: number): string {
  if (h < 1) {
    const mins = Math.round(h * 60)
    return `${mins} ${mins === 1 ? 'minuto' : 'minutos'}`
  }
  const entero = Math.floor(h)
  const decimal = h - entero
  if (decimal === 0) return `${entero} ${entero === 1 ? 'hora' : 'horas'}`
  const mins = Math.round(decimal * 60)
  return `${entero}h ${mins}min`
}

export function AddTransactionModal({ open, onClose }: Props) {
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const [monto, setMonto] = useState(0)
  const [categoria, setCategoria] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [error, setError] = useState('')

  // PACTO pause state
  const [showPacto, setShowPacto] = useState(false)
  const [pactoRiesgo, setPactoRiesgo] = useState<{ nivel: 'medio' | 'alto'; razonesRiesgo: string[]; alertaId?: string } | null>(null)

  const { mutate, isPending } = useCreateTransaccion()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const { data: pactoData } = usePactoPartner()
  const partner = pactoData?.partner

  const horas = calcHoras(monto, user?.ingresoMensual ?? 0, user?.horasTrabajoSemanal ?? 0)

  const reset = () => {
    setStep('form')
    setMonto(0)
    setCategoria('')
    setDescripcion('')
    setError('')
    setShowPacto(false)
    setPactoRiesgo(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleNext = () => {
    if (!monto || monto <= 0) { setError('Ingresa un monto válido'); return }
    if (!categoria) { setError('Selecciona una categoría'); return }
    setError('')
    setStep('confirm')
  }

  const handleConfirm = () => {
    mutate(
      { monto, categoria, descripcion: descripcion || undefined },
      {
        onSuccess: (data: any) => {
          const riesgo = data?.riesgo
          if (riesgo && (riesgo.nivel === 'medio' || riesgo.nivel === 'alto')) {
            // Show PACTO pause screen before closing
            setPactoRiesgo(riesgo)
            setShowPacto(true)
          } else {
            handleClose()
          }
        },
        onError: () => { setStep('form'); setError('Error al guardar. Intenta de nuevo.') },
      }
    )
  }

  const catInfo = CATEGORIAS.find((c) => c.key === categoria)

  return (
    <>
      <Modal
        open={open && !showPacto}
        onClose={handleClose}
        title={step === 'form' ? 'Agregar gasto' : '⏸ Pausa PULSO'}
      >
        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="px-5 py-4 flex flex-col gap-5"
            >
              <AmountInput value={monto} onChange={setMonto} label="¿Cuánto gastaste?" />

              <div>
                <label className="text-sm font-semibold text-white mb-2 block">Categoría</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIAS.map((c) => (
                    <CategoryPill
                      key={c.key}
                      categoria={c.key}
                      selected={categoria === c.key}
                      onClick={() => setCategoria(c.key)}
                    />
                  ))}
                </div>
              </div>

              <Input
                label="Descripción (opcional)"
                placeholder="¿En qué lo gastaste?"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />

              {error && <p className="text-sm text-red-400 font-medium text-center">{error}</p>}

              <Button onClick={handleNext} fullWidth size="lg">
                Continuar →
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="px-5 py-4 flex flex-col gap-4"
            >
              {/* Monto principal */}
              <div className="text-center py-2">
                <p className="text-text-muted text-sm mb-1">Estás por registrar</p>
                <p className="text-4xl font-extrabold text-white">
                  ${monto.toLocaleString('es-CO')}
                </p>
                <p className="text-text-muted text-sm mt-1">
                  {catInfo ? `${catInfo.emoji} ${catInfo.label}` : categoria}
                  {descripcion ? ` · ${descripcion}` : ''}
                </p>
              </div>

              {/* Horas de trabajo */}
              {horas !== null ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl p-5 text-center"
                  style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.3)' }}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,71,87,0.7)' }}>
                    Costo en tiempo de trabajo
                  </p>
                  <p className="text-3xl font-extrabold" style={{ color: '#ff4757' }}>
                    {formatHoras(horas)}
                  </p>
                  <p className="text-sm text-text-muted mt-2 leading-relaxed">
                    Tuviste que trabajar ese tiempo para poder pagar esto.<br />
                    <span className="text-text-dim">¿Vale la pena?</span>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl p-4 text-center space-y-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <p className="text-sm text-text-muted leading-relaxed">
                    ¿Vale la pena este gasto en este momento?
                  </p>
                  <button
                    onClick={() => { handleClose(); navigate('/profile') }}
                    className="text-xs font-bold px-4 py-2 rounded-xl transition-all"
                    style={{ background: 'rgba(168,255,62,0.1)', border: '1px solid rgba(168,255,62,0.25)', color: '#A8FF3E' }}
                  >
                    Completar perfil laboral →
                  </button>
                  <p className="text-xs text-text-dim">
                    Necesitas ingresar tu salario para ver cuántas horas cuesta cada gasto.
                  </p>
                </motion.div>
              )}

              {error && <p className="text-sm text-red-400 font-medium text-center">{error}</p>}

              {/* Botones de decisión */}
              <div className="flex flex-col gap-3 mt-1">
                <Button onClick={handleConfirm} loading={isPending} fullWidth size="lg">
                  ✓ Sí, registrar gasto
                </Button>
                <button
                  onClick={() => setStep('form')}
                  disabled={isPending}
                  className="w-full py-3 rounded-2xl text-sm font-semibold transition-all"
                  style={{
                    background: 'rgba(255,71,87,0.06)',
                    border: '1px solid rgba(255,71,87,0.2)',
                    color: '#ff6b78',
                  }}
                >
                  ✕ Cancelar, no vale la pena
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>

      {/* PACTO pause screen — shown after transaction is saved */}
      <PactoAlertaModal
        open={showPacto}
        riesgo={pactoRiesgo}
        monto={monto}
        categoria={categoria}
        partnerNombre={partner?.nombre ?? null}
        onContinue={handleClose}
        onCancel={handleClose}
      />
    </>
  )
}
