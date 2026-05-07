import { useState } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { AmountInput } from './ui/AmountInput'
import { Input } from './ui/Input'
import { CategoryPill } from './ui/CategoryPill'
import { CATEGORIAS } from '../types'
import { useCreateTransaccion } from '../hooks/useTransacciones'

interface Props {
  open: boolean
  onClose: () => void
}

export function AddTransactionModal({ open, onClose }: Props) {
  const [monto, setMonto] = useState(0)
  const [categoria, setCategoria] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [error, setError] = useState('')

  const { mutate, isPending } = useCreateTransaccion()

  const reset = () => {
    setMonto(0)
    setCategoria('')
    setDescripcion('')
    setError('')
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
        onSuccess: () => {
          handleClose()
        },
        onError: () => setError('Error al guardar. Intenta de nuevo.'),
      }
    )
  }

  return (
    <Modal open={open} onClose={handleClose} title="Agregar gasto">
      <div className="px-5 py-4 flex flex-col gap-5">
        <AmountInput value={monto} onChange={setMonto} label="¿Cuánto gastaste?" />

        <div>
          <label className="text-sm font-semibold text-text-dark mb-2 block">Categoría</label>
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
          <p className="text-sm text-red-500 font-medium text-center">{error}</p>
        )}

        <Button onClick={handleSubmit} loading={isPending} fullWidth size="lg">
          Guardar gasto
        </Button>
      </div>
    </Modal>
  )
}
