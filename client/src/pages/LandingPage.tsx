import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, BookOpen, ArrowRight } from 'lucide-react'

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0A0A12] flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary-dark/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-neon-green/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary-dark/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 flex flex-col gap-7">

        {/* Logo + título */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 18 }}
            className="relative inline-block mb-4"
          >
            <div className="absolute inset-0 bg-neon-green/20 rounded-[2rem] blur-2xl" />
            <div className="relative w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary-dark to-purple-900 flex items-center justify-center shadow-glow mx-auto">
              <span className="text-3xl">⚡</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h1 className="text-4xl font-extrabold font-display text-white tracking-tight"
              style={{ textShadow: '0 0 40px rgba(124,77,255,0.3)' }}>
              PULSO
            </h1>
            <p className="text-text-muted mt-1 text-sm">Acompañamiento financiero universitario</p>
            <div className="inline-flex items-center gap-1.5 bg-neon-green/10 border border-neon-green/25 rounded-full px-3 py-1 mt-2">
              <GraduationCap size={11} className="text-neon-green" />
              <span className="text-[11px] font-bold text-neon-green">Solo correos .edu.co</span>
            </div>
          </motion.div>
        </div>

        {/* Selección de rol */}
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest text-center">
            ¿Cómo quieres entrar?
          </p>

          {/* --- ESTUDIANTE --- */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <button
              onClick={() => navigate('/login')}
              className="w-full group relative overflow-hidden rounded-3xl border border-neon-green/25 bg-surface-raised p-5 text-left transition-all active:scale-[0.98] hover:border-neon-green/50"
              style={{ boxShadow: '0 0 0 0 rgba(168,255,62,0)' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={22} className="text-neon-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-white text-lg font-display leading-tight">Soy estudiante</p>
                  <p className="text-text-muted text-sm mt-0.5">Controla tus gastos y cumple metas</p>
                </div>
                <ArrowRight size={18} className="text-neon-green flex-shrink-0" />
              </div>
            </button>
            <button
              onClick={() => navigate('/register')}
              className="w-full mt-1.5 text-center text-xs text-neon-green/70 font-semibold hover:text-neon-green transition-colors py-1"
            >
              ¿Sin cuenta? Regístrate como estudiante →
            </button>
          </motion.div>

          {/* Divisor */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-border-light" />
            <span className="text-xs text-text-dim font-medium">o</span>
            <div className="flex-1 h-px bg-border-light" />
          </div>

          {/* --- MENTOR --- */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <button
              onClick={() => navigate('/asesor/login')}
              className="w-full group relative overflow-hidden rounded-3xl border border-primary-dark/30 bg-surface-raised p-5 text-left transition-all active:scale-[0.98] hover:border-primary-dark/60"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary-dark/15 border border-primary-dark/25 flex items-center justify-center flex-shrink-0">
                  <GraduationCap size={22} className="text-primary-dark" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-white text-lg font-display leading-tight">Soy mentor</p>
                  <p className="text-text-muted text-sm mt-0.5">Acompaña a estudiantes en sus finanzas</p>
                </div>
                <ArrowRight size={18} className="text-primary-dark flex-shrink-0" />
              </div>
            </button>
            <button
              onClick={() => navigate('/asesor/register')}
              className="w-full mt-1.5 text-center text-xs text-primary-dark/70 font-semibold hover:text-primary-dark transition-colors py-1"
            >
              ¿Sin cuenta? Regístrate como mentor →
            </button>
          </motion.div>
        </div>

      </div>
    </div>
  )
}
