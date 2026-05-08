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
          ? 'text-[#0A0A12] shadow-neon'
          : 'text-white border border-border-light hover:border-opacity-80'
        }
      `}
      style={selected
        ? { backgroundColor: color, boxShadow: `0 0 12px ${color}60` }
        : { backgroundColor: color + '18', borderColor: color + '50' }
      }
    >
      <span>{emoji}</span>
      <span>{cat?.label ?? categoria}</span>
    </button>
  )
}
