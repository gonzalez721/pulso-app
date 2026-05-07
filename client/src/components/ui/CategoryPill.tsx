import { CATEGORIAS, CATEGORY_COLORS } from '../../types'

interface CategoryPillProps {
  categoria: string
  selected?: boolean
  onClick?: () => void
  size?: 'sm' | 'md'
}

export function CategoryPill({ categoria, selected, onClick, size = 'md' }: CategoryPillProps) {
  const cat = CATEGORIAS.find((c) => c.key === categoria)
  const emoji = cat?.emoji ?? '📦'
  const color = CATEGORY_COLORS[categoria] ?? '#E5E5E5'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 rounded-full font-semibold transition-all
        ${size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'}
        ${selected
          ? 'bg-primary-dark text-white shadow-soft'
          : 'text-text-dark hover:bg-opacity-80'
        }
      `}
      style={!selected ? { backgroundColor: color + '60', border: `1.5px solid ${color}` } : {}}
    >
      <span>{emoji}</span>
      <span>{cat?.label ?? categoria}</span>
    </button>
  )
}
