import { Transaccion, CATEGORIAS, CATEGORY_COLORS } from '../../types'
import { formatCurrency, relativeTime } from '../../lib/utils'

interface TransactionItemProps {
  transaccion: Transaccion
  onClick?: () => void
}

export function TransactionItem({ transaccion, onClick }: TransactionItemProps) {
  const cat = CATEGORIAS.find((c) => c.key === transaccion.categoria)
  const emoji = cat?.emoji ?? '📦'
  const color = CATEGORY_COLORS[transaccion.categoria] ?? '#E5E5E5'

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 hover:bg-gray-50 rounded-2xl px-2 transition-colors text-left"
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: color + '50' }}
      >
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text-dark text-sm truncate">
          {transaccion.descripcion ?? transaccion.categoria}
        </p>
        <p className="text-xs text-text-muted mt-0.5">{relativeTime(transaccion.fecha)}</p>
      </div>
      <span className="font-bold text-text-dark text-sm flex-shrink-0">
        -{formatCurrency(transaccion.monto)}
      </span>
    </button>
  )
}
