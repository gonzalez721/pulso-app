import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, LogOut, GraduationCap } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAsesorStore } from '../../store/asesorStore'
import { useAsesorLogout } from '../../hooks/useAsesor'
import { getInitials } from '../../lib/utils'

export function AsesorLayout() {
  const { asesor } = useAsesorStore()
  const logout = useAsesorLogout()

  return (
    <div className="min-h-screen bg-[#F4F1F9] flex flex-col max-w-lg mx-auto relative">
      {/* Top bar */}
      <header className="bg-[#2D1B4E] text-white px-5 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden">
            {asesor?.fotoUrl
              ? <img src={asesor.fotoUrl} className="w-full h-full object-cover" alt="" />
              : <span className="text-sm font-bold">{getInitials(asesor?.nombre ?? 'A')}</span>
            }
          </div>
          <div>
            <p className="text-xs text-white/60 font-medium">Portal Asesor</p>
            <p className="text-sm font-bold leading-tight">{asesor?.nombre ?? '...'}</p>
          </div>
        </div>
        <button onClick={logout} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <LogOut size={14} />
        </button>
      </header>

      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-gray-200 z-30">
        <div className="flex">
          {[
            { to: '/asesor/dashboard', icon: LayoutDashboard, label: 'Inicio' },
            { to: '/asesor/sesiones',  icon: CalendarDays,    label: 'Sesiones' },
          ].map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors">
              {({ isActive }) => (
                <>
                  <div className="relative">
                    {isActive && (
                      <motion.div layoutId="asesor-nav" className="absolute -inset-2 bg-[#F5E6E8] rounded-xl" />
                    )}
                    <Icon size={22} className={`relative z-10 ${isActive ? 'text-[#2D1B4E]' : 'text-gray-400'}`} />
                  </div>
                  <span className={`text-[10px] font-semibold ${isActive ? 'text-[#2D1B4E]' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
