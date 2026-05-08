import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { AmountInput } from './ui/AmountInput'
import { Input } from './ui/Input'
import { CategoryPill } from './ui/CategoryPill'
import { CATEGORIAS } from '../types'
import { useCreateTransaccion } from '../hooks/useTransacciones'
import { usePactoStatus } from '../hooks/usePacto'
import { PactoPausaOverlay } from './pacto/PactoPausaOverlay'

interface Props {
  open: boolean
  onClose: () => void
}

interface PactoAlertState {
  alertaId:    string
  contexto: {
    monto:                  number
    categoria:              string
    descripcion?:           string
    porcentajePresupuesto:  number
    nComprasHoy:            number
    nComprasMismaCategoria: number
    velocidadVsPromedio:    number
  }
  mensajeAuto: string
}

export function AddTransactionModal({ open, onClose }: Props) {
  const [monto, setMonto] = useState(0)
  const [categoria, setCategoria] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [error, setError] = useState('')
  const [pactoAlerta, setPactoAlerta] = useState<PactoAlertState | null>(null)

  const { mutate, isPending } = useCreateTransaccion()
  const { data: pactoStatus } = usePactoStatus()

  const reset = () => {
    setMonto(0)
    setCategoria('')
    setDescripcion('')
    setError('')
    setPactoAlerta(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = () => {
    if (!monto || monto <= 0) { setError('Ingresa un monto válido'); return }
    if (!categoria) { setError('Selecciona una categoría'); return }

    mutate(
      { monto, categoria, descripcion: descripcion || undefined },
      {
        onSuccess: (data: any) => {
          // Check if PACTO detected a risk purchase
          if (
            data?.pacto?.riesgoDetectado &&
            data.pacto.alertaId &&
            data.pacto.contexto
          ) {
            setPactoAlerta({
              alertaId:    data.pacto.alertaId,
              contexto:    data.pacto.contexto,
              mensajeAuto: data.pacto.mensajeAuto ?? '¡Respira! ¿Realmente necesitas esto ahora?',
            })
            // Keep modal open — overlay will take over visually
          } else {
            handleClose()
          }
        },
        onError: () => setError('Error al guardar. Intenta de nuevo.'),
      }
    )
  }

  return (
    <>
      {/* Normal add-transaction modal — hidden when overlay is active */}
      <Modal open={open && !pactoAlerta} onClose={handleClose} title="Agregar gasto">
        <div className="px-5 py-4 flex flex-col gap-5">
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

          {error && (
            <p className="text-sm text-red-400 font-medium text-center">{error}</p>
          )}

          <Button onClick={handleSubmit} loading={isPending} fullWidth size="lg">
            Guardar gasto
          </Button>
        </div>
      </Modal>

      {/* PACTO Pause Overlay — triggered when server detects a risky purchase */}
      <AnimatePresence>
        {pactoAlerta && (
          <PactoPausaOverlay
            alertaId={pactoAlerta.alertaId}
            contexto={pactoAlerta.contexto}
            mensajeAuto={pactoAlerta.mensajeAuto}
            partnerNombre={pactoStatus?.partnerNombre}
            modo={(pactoStatus?.modo as 'humano' | 'ia') ?? 'ia'}
            onContinuar={handleClose}
            onCancelar={handleClose}
          />
        )}
      </AnimatePresence>
    </>
  )
}
