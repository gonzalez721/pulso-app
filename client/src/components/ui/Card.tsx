import { HTMLAttributes, forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  animate?: boolean
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ animate = false, padding = 'md', className = '', children, ...props }, ref) => {
    const paddings = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' }
    const base = `bg-white rounded-3xl shadow-card ${paddings[padding]} ${className}`

    if (animate) {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={base}
          {...(props as HTMLMotionProps<'div'>)}
        >
          {children}
        </motion.div>
      )
    }

    return (
      <div ref={ref} className={base} {...props}>
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
