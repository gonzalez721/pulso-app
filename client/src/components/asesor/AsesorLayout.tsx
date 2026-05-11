import { Outlet, NavLink, Navigate } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, Clock, LogOut, Calendar, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAsesorStore } from '../../store/asesorStore'
import { useAsesorLogout } from '../../hooks/useAsesor'
import { getInitials } from '../../lib/utils'
import { AsesorTour } from '../tour/AsesorTour'

export function AsesorLayout() {
  const { asesor } = useAsesorStore()
  const logout = useAsesorLogout()

  // Guard: if email not verified, redirect to verify-code
  if (asesor && asesor.emailVerified === false) {
    return <Navigate to={`/asesor/verify-code?email=${encodeURIComponent(asesor.email)}`} replace />
  }

  return (
    <div className="min-h-screen bg-[#0A0A12] flex flex-col max-w-lg mx-auto relative">
      {/* Top bar */}
      <header className="bg-surface-raised border-b border-border-light px-5 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-dark to-purple-900 flex items-center justify-center overflow-hidden shadow-glow">
            {asesor?.fotoUrl
              ? <img src={asesor.fotoUrl} className="w-full h-full object-cover" alt="" />
              : <span className="text-sm font-bold text-white">{getInitials(asesor?.nombre ?? 'A')}</span>
            }
          </div>
          <div>
            <p className="text-xs text-text-muted font-medium">Portal Asesor</p>
            <p className="text-sm font-bold text-white leading-tight">{asesor?.nombre ?? '...'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-8 h-8 rounded-xl bg-surface-elevated border border-border-light flex items-center justify-center hover:border-red-500/40 hover:text-red-400 transition-colors"
        >
          <LogOut size={14} className="text-text-muted" />
        </button>
      </header>

      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto z-30 pb-safe">
        <div className="mx-4 mb-4">
          <div className="bg-surface-raised border border-border-light rounded-3xl flex overflow-hidden shadow-glow">
            {[
              { to: '/asesor/dashboard',       icon: LayoutDashboard, label: 'Inicio' },
              { to: '/asesor/sesiones',         icon: CalendarDays,    label: 'Sesiones' },
              { to: '/asesor/calendario',       icon: Calendar,        label: 'Calendario' },
              { to: '/asesor/disponibilidad',   icon: Clock,           label: 'Horario' },
              { to: '/asesor/perfil',           icon: User,            label: 'Perfil' },
            ].map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors relative">
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="asesor-nav-pill"
                        className="absolute inset-1 bg-surface-elevated rounded-2xl"
                        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                      />
                    )}
                    <Icon size={20} className={`relative z-10 transition-colors ${isActive ? 'text-neon-green' : 'text-text-muted'}`} />
                    <span className={`text-[10px] font-bold relative z-10 transition-colors ${isActive ? 'text-neon-green' : 'text-text-muted'}`}>
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      <AsesorTour />
    </div>
  )
}
