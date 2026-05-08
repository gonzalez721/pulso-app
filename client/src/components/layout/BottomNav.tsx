import { NavLink } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, CalendarDays, User } from 'lucide-react'
import { motion } from 'framer-motion'

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/weekly', icon: TrendingUp, label: 'Semana' },
  { to: '/sessions', icon: CalendarDays, label: 'Sesiones' },
  { to: '/profile', icon: User, label: 'Perfil' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 safe-bottom">
      <div className="max-w-lg mx-auto px-4 pb-4">
        <div className="flex items-center bg-surface-raised border border-border-light rounded-3xl px-2 py-2 shadow-glow">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className="flex-1 flex flex-col items-center gap-1 transition-colors"
            >
              {({ isActive }) => (
                <div className="relative flex flex-col items-center gap-1 w-full py-2">
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-primary-dark/20 rounded-2xl"
                    />
                  )}
                  <Icon
                    size={20}
                    className={`relative z-10 transition-colors ${
                      isActive ? 'text-neon-green' : 'text-text-muted'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-semibold relative z-10 transition-colors ${
                      isActive ? 'text-neon-green' : 'text-text-muted'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
