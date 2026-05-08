import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, BookOpen, ArrowRight } from 'lucide-react'

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0A0A12] flex flex-col items-center justify-center px-5 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary-dark/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-neon-green/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary-dark/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm space-y-10 relative z-10"
      >
        {/* Logo + título */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 18, delay: 0.1 }}
            className="relative inline-block"
          >
            <div className="absolute inset-0 bg-neon-green/20 rounded-[2rem] blur-2xl" />
            <div className="relative w-20 h-20 rounded-[2rem] bg-gradient-to-br from-primary-dark to-purple-900 flex items-center justify-center shadow-glow mx-auto">
              <span className="text-4xl">⚡</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1
              className="text-5xl font-extrabold font-display text-white tracking-tight"
              style={{ textShadow: '0 0 40px rgba(124,77,255,0.3)' }}
            >
              PULSO
            </h1>
            <p className="text-text-muted mt-2 text-sm font-medium">
              Acompañamiento financiero universitario
            </p>
            <div className="inline-flex items-center gap-1.5 bg-neon-green/10 border border-neon-green/25 rounded-full px-3 py-1 mt-3">
              <GraduationCap size={12} className="text-neon-green" />
              <span className="text-[11px] font-bold text-neon-green">Solo correos .edu.co</span>
            </div>
          </motion.div>
        </div>

        {/* Tarjetas de rol */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest text-center">
            ¿Cómo quieres entrar?
          </p>

          {/* Estudiante */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/login')}
            className="w-full group relative overflow-hidden rounded-3xl border border-neon-green/25 bg-surface-raised p-5 text-left transition-all hover:border-neon-green/50 hover:shadow-neon"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-neon-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center flex-shrink-0">
                <BookOpen size={24} className="text-neon-green" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-white text-lg font-display">Soy estudiante</p>
                <p className="text-text-muted text-sm mt-0.5">Controla tus gastos y cumple tus metas</p>
              </div>
              <ArrowRight size={18} className="text-neon-green flex-shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>

          {/* Mentor */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/asesor/login')}
            className="w-full group relative overflow-hidden rounded-3xl border border-primary-dark/30 bg-surface-raised p-5 text-left transition-all hover:border-primary-dark/60 hover:shadow-glow"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-dark/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-dark/15 border border-primary-dark/25 flex items-center justify-center flex-shrink-0">
                <GraduationCap size={24} className="text-primary-dark" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-white text-lg font-display">Soy mentor</p>
                <p className="text-text-muted text-sm mt-0.5">Acompaña a estudiantes en su bienestar financiero</p>
              </div>
              <ArrowRight size={18} className="text-primary-dark flex-shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-text-dim"
        >
          ¿Primera vez?{' '}
          <button onClick={() => navigate('/register')} className="text-neon-green font-bold hover:brightness-110 transition-all">
            Crea tu cuenta gratis
          </button>
        </motion.p>
      </motion.div>
    </div>
  )
}
