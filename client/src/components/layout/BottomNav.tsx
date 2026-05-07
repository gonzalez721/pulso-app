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
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-border-light safe-bottom">
      <div className="flex items-center max-w-lg mx-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -inset-2 bg-primary-light rounded-xl"
                    />
                  )}
                  <Icon
                    size={22}
                    className={`relative z-10 transition-colors ${
                      isActive ? 'text-primary-dark' : 'text-text-muted'
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] font-semibold transition-colors ${
                    isActive ? 'text-primary-dark' : 'text-text-muted'
                  }`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
