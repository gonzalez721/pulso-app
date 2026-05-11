import { useNavigate } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

/* ─── helpers ─── */
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function Glow({ color, size, top, left, right, bottom, opacity = 0.12 }: any) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size, height: size,
        background: color,
        top, left, right, bottom,
        filter: 'blur(100px)',
        opacity,
        transform: 'translate(-50%, -50%)',
      }}
    />
  )
}

/* ─── Phone mockup (CSS only) ─── */
function PhoneMock() {
  return (
    <div
      className="relative mx-auto select-none"
      style={{
        width: 220,
        background: 'linear-gradient(160deg,#13132b 0%,#0d0d1a 100%)',
        border: '1.5px solid rgba(124,77,255,0.35)',
        borderRadius: 28,
        padding: '22px 16px 20px',
        boxShadow: '0 0 60px rgba(124,77,255,0.15), 0 20px 60px rgba(0,0,0,0.6)',
      }}
    >
      {/* notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 rounded-b-full" style={{ background: 'rgba(255,255,255,0.08)' }} />

      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg,#7C4DFF,#4a00e0)' }}>⚡</div>
          <span className="text-white font-extrabold text-xs tracking-wide font-display">PULSO</span>
        </div>
        <div className="text-xs font-semibold" style={{ color: '#A8FF3E' }}>● Activo</div>
      </div>

      {/* balance */}
      <div className="mb-3">
        <p className="text-xs mb-0.5" style={{ color: 'rgba(139,139,167,0.8)', letterSpacing: '0.1em' }}>SEMANA ACTUAL</p>
        <p className="font-extrabold text-white font-display" style={{ fontSize: 28, lineHeight: 1 }}>$102.000</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(139,139,167,0.7)' }}>de $150.000 presupuestados</p>
      </div>

      {/* progress */}
      <div className="rounded-full overflow-hidden mb-1" style={{ height: 6, background: 'rgba(255,255,255,0.07)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '68%' }}
          transition={{ duration: 1.2, delay: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg,#A8FF3E,#7C4DFF)' }}
        />
      </div>
      <div className="flex justify-between text-xs mb-4" style={{ color: 'rgba(139,139,167,0.6)' }}>
        <span>68% gastado</span>
        <span style={{ color: '#ff4757' }}>⚠ Riesgo</span>
      </div>

      {/* transactions */}
      {[
        { icon: '🍕', label: 'Comida', amount: '$62.000', color: '#FF9B9B' },
        { icon: '🎮', label: 'Entretenimiento', amount: '$28.000', color: '#C8B8E8' },
        { icon: '🚌', label: 'Transporte', amount: '$12.000', color: '#A8FF3E' },
      ].map((t) => (
        <div key={t.label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2">
            <span className="text-sm">{t.icon}</span>
            <span className="text-xs text-white/70">{t.label}</span>
          </div>
          <span className="text-xs font-bold" style={{ color: t.color }}>{t.amount}</span>
        </div>
      ))}

      {/* pause card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="mt-3 rounded-2xl p-3 text-center"
        style={{ background: 'rgba(124,77,255,0.12)', border: '1px solid rgba(124,77,255,0.3)' }}
      >
        <p className="font-extrabold text-xs mb-1 font-display" style={{ color: '#b39ddb', letterSpacing: '0.15em' }}>⏸ PAUSA PULSO</p>
        <p className="text-xs mb-2" style={{ color: 'rgba(139,139,167,0.8)' }}>
          Este pedido <strong style={{ color: '#fff' }}>= 2.3 horas</strong> de trabajo
        </p>
        <div className="flex gap-1.5">
          <div className="flex-1 py-1.5 rounded-xl text-xs font-bold" style={{ background: 'rgba(255,71,87,0.15)', color: '#ff6b78' }}>✕ Cancelar</div>
          <div className="flex-1 py-1.5 rounded-xl text-xs font-bold" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(139,139,167,0.8)' }}>Continuar</div>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Main ─── */
export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#080810', color: '#fff' }}>

      {/* ══════ NAV ══════ */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 py-4"
        style={{ background: 'rgba(8,8,16,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow-glow"
            style={{ background: 'linear-gradient(135deg,#7C4DFF,#4a00e0)' }}>⚡</div>
          <span className="font-extrabold text-sm tracking-widest text-white font-display">PULSO+PACTO</span>
        </div>
        <button
          onClick={() => navigate('/register')}
          className="text-xs font-bold px-4 py-2 rounded-full transition-all"
          style={{ background: 'rgba(168,255,62,0.12)', border: '1px solid rgba(168,255,62,0.3)', color: '#A8FF3E' }}
        >
          Empezar gratis
        </button>
      </nav>

      {/* ══════ HERO ══════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-5 pt-24 pb-16 overflow-hidden text-center">
        <Glow color="#7C4DFF" size="600px" top="20%" left="50%" opacity={0.1} />
        <Glow color="#A8FF3E" size="400px" top="60%" left="80%" opacity={0.06} />
        <Glow color="#7C4DFF" size="300px" top="80%" left="20%" opacity={0.07} />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-xs font-bold tracking-widest uppercase"
          style={{ background: 'rgba(168,255,62,0.08)', border: '1px solid rgba(168,255,62,0.2)', color: '#A8FF3E' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse inline-block" />
          Javeriana Cali · 2026
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="font-extrabold font-display leading-none mb-4"
          style={{ fontSize: 'clamp(44px, 11vw, 88px)', letterSpacing: '-0.03em' }}
        >
          Tus finanzas,<br />
          <span style={{ color: '#A8FF3E', textShadow: '0 0 40px rgba(168,255,62,0.35)' }}>a tu ritmo.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="text-base leading-relaxed max-w-xs mx-auto mb-10"
          style={{ color: '#8B8BA7' }}
        >
          El único servicio que interviene <strong style={{ color: '#fff' }}>en el momento exacto</strong> que vas a gastar de más — no después.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.38 }}
          className="flex flex-col gap-3 w-full max-w-xs mx-auto mb-16"
        >
          <button
            onClick={() => navigate('/register')}
            className="w-full py-4 rounded-2xl font-extrabold text-base transition-all active:scale-[0.97]"
            style={{
              background: '#A8FF3E',
              color: '#080810',
              boxShadow: '0 0 32px rgba(168,255,62,0.35)',
              fontFamily: 'Space Grotesk, sans-serif',
            }}
          >
            Empezar gratis →
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 rounded-2xl font-bold text-sm transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#8B8BA7' }}
          >
            Ya tengo cuenta
          </button>
        </motion.div>

        {/* Phone mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <PhoneMock />
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="mt-12 flex flex-col items-center gap-2"
          style={{ color: 'rgba(139,139,167,0.4)' }}
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="text-lg"
          >↓</motion.div>
          <span className="text-xs tracking-widest uppercase">Descubre cómo</span>
        </motion.div>
      </section>

      {/* ══════ EL PROBLEMA ══════ */}
      <section className="relative px-5 py-20 overflow-hidden">
        <Glow color="#ff4757" size="400px" top="50%" left="50%" opacity={0.06} />

        <FadeUp className="text-center mb-12">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(139,139,167,0.6)' }}>El problema real</p>
          <h2 className="font-extrabold font-display leading-tight" style={{ fontSize: 'clamp(32px, 8vw, 52px)' }}>
            El dinero digital<br />
            <span style={{ color: '#ff4757' }}>no se siente.</span>
          </h2>
          <p className="text-sm mt-4 leading-relaxed mx-auto max-w-xs" style={{ color: '#8B8BA7' }}>
            Validado con 50 estudiantes universitarios en Cali. La barrera no es saber — es actuar en el momento exacto.
          </p>
        </FadeUp>

        {/* Stat cards */}
        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          {[
            { num: '70%', label: 'Se queda sin dinero antes de que termine la semana', color: '#A8FF3E' },
            { num: '56%', label: 'Siente que el dinero digital "no es real"', color: '#7C4DFF' },
            { num: '68%', label: 'Reconsideraría un gasto si un amigo cercano recibiera una alerta', color: '#ff4757' },
          ].map((s, i) => (
            <FadeUp key={s.num} delay={i * 0.1}>
              <div
                className="flex items-center gap-5 rounded-3xl p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <span className="font-extrabold font-display flex-shrink-0" style={{ fontSize: 48, color: s.color, lineHeight: 1 }}>{s.num}</span>
                <p className="text-sm leading-relaxed" style={{ color: '#8B8BA7' }}>{s.label}</p>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.3} className="mt-8">
          <div
            className="max-w-sm mx-auto rounded-3xl p-5"
            style={{ background: 'rgba(255,71,87,0.05)', border: '1px solid rgba(255,71,87,0.15)', borderLeft: '3px solid #ff4757' }}
          >
            <p className="font-bold italic text-white text-base leading-relaxed mb-1">
              "Lo que no nos cuesta, hagámoslo fiesta."
            </p>
            <p className="text-xs" style={{ color: 'rgba(139,139,167,0.6)' }}>— La mentalidad detrás del problema</p>
          </div>
        </FadeUp>
      </section>

      {/* ══════ LA SOLUCIÓN — 3 CAPAS ══════ */}
      <section className="relative px-5 py-20 overflow-hidden">
        <Glow color="#7C4DFF" size="500px" top="30%" left="50%" opacity={0.08} />
        <Glow color="#A8FF3E" size="300px" top="80%" left="20%" opacity={0.06} />

        <FadeUp className="text-center mb-12">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(139,139,167,0.6)' }}>La solución</p>
          <h2 className="font-extrabold font-display leading-tight" style={{ fontSize: 'clamp(30px, 7vw, 48px)' }}>
            Tres capas que actúan<br />
            <span style={{ color: '#A8FF3E' }}>antes, no después.</span>
          </h2>
        </FadeUp>

        <div className="flex flex-col gap-4 max-w-sm mx-auto">

          {/* PULSO */}
          <FadeUp delay={0.05}>
            <div className="rounded-3xl p-6 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg,rgba(124,77,255,0.12) 0%,rgba(124,77,255,0.04) 100%)', border: '1px solid rgba(124,77,255,0.25)' }}>
              <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,#7C4DFF,transparent)' }} />
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl mb-4"
                style={{ background: 'rgba(124,77,255,0.15)', border: '1px solid rgba(124,77,255,0.3)' }}>⚡</div>
              <span className="text-xs font-bold tracking-widest uppercase mb-1 block" style={{ color: '#7C4DFF' }}>Capa digital</span>
              <h3 className="text-xl font-extrabold font-display text-white mb-2">PULSO</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#8B8BA7' }}>
                Registras tus gastos manualmente. Cada vez que digitas uno, PULSO analiza el contexto y activa una <strong style={{ color: '#fff' }}>pausa consciente</strong> si detecta riesgo — mostrándote cuántas horas de trabajo representa ese gasto.
              </p>
            </div>
          </FadeUp>

          {/* PACTO */}
          <FadeUp delay={0.1}>
            <div className="rounded-3xl p-6 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg,rgba(168,255,62,0.08) 0%,rgba(168,255,62,0.02) 100%)', border: '1px solid rgba(168,255,62,0.2)' }}>
              <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,#A8FF3E,transparent)' }} />
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl mb-4"
                style={{ background: 'rgba(168,255,62,0.1)', border: '1px solid rgba(168,255,62,0.25)' }}>🤝</div>
              <span className="text-xs font-bold tracking-widest uppercase mb-1 block" style={{ color: '#A8FF3E' }}>Accountability social</span>
              <h3 className="text-xl font-extrabold font-display text-white mb-2">PACTO</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#8B8BA7' }}>
                Haces un compromiso con un amigo, familiar o con IA. Cuando vas a gastar de más, tu <strong style={{ color: '#fff' }}>partner PACTO</strong> recibe una alerta en tiempo real y tiene <strong style={{ color: '#fff' }}>60 segundos</strong> para escribirte.
              </p>
            </div>
          </FadeUp>

          {/* CONSEJERÍA */}
          <FadeUp delay={0.15}>
            <div className="rounded-3xl p-6 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg,rgba(255,215,100,0.08) 0%,rgba(255,215,100,0.02) 100%)', border: '1px solid rgba(255,215,100,0.2)' }}>
              <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,#ffd764,transparent)' }} />
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl mb-4"
                style={{ background: 'rgba(255,215,100,0.1)', border: '1px solid rgba(255,215,100,0.25)' }}>🎓</div>
              <span className="text-xs font-bold tracking-widest uppercase mb-1 block" style={{ color: '#ffd764' }}>Acompañamiento humano</span>
              <h3 className="text-xl font-extrabold font-display text-white mb-2">CONSEJERÍA</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#8B8BA7' }}>
                Sesiones semanales de 15-20 min con estudiantes de Administración y Economía. Llegan con <strong style={{ color: '#fff' }}>tus datos reales</strong> — no "¿cómo te fue?" sino "veo que tu tercer delivery esta semana activó alerta."
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══════ LA PAUSA — FEATURE HERO ══════ */}
      <section className="relative px-5 py-20 overflow-hidden">
        <Glow color="#ff4757" size="400px" top="50%" left="50%" opacity={0.07} />

        <FadeUp>
          <div
            className="max-w-sm mx-auto rounded-3xl p-6 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#13132b 0%,#0d0d1a 100%)', border: '1px solid rgba(124,77,255,0.3)' }}
          >
            {/* top label */}
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(139,139,167,0.6)' }}>
                Intervención en tiempo real
              </span>
            </div>

            <h2 className="font-extrabold font-display text-white mb-3" style={{ fontSize: 'clamp(26px,6vw,38px)', lineHeight: 1.1 }}>
              El momento<br />
              <span style={{ color: '#ff4757' }}>que lo cambia todo.</span>
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#8B8BA7' }}>
              Otras apps te dicen dónde gastaste — cuando ya es tarde. PULSO+PACTO actúa <strong style={{ color: '#fff' }}>justo antes de confirmar la compra.</strong>
            </p>

            {/* flow steps */}
            <div className="flex flex-col gap-3">
              {[
                { icon: '✍️', text: 'Registras un gasto en la app', color: '#7C4DFF' },
                { icon: '⏸️', text: 'PULSO te muestra cuántas horas de trabajo vale', color: '#ff4757' },
                { icon: '🔔', text: 'Tu partner PACTO recibe alerta — 60 segundos', color: '#A8FF3E' },
                { icon: '🎓', text: 'Tu consejero llega con el contexto completo', color: '#ffd764' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="flex items-start gap-3 p-3 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
                    style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}
                  >{s.icon}</div>
                  <p className="text-sm text-white/80 leading-snug pt-1">{s.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ══════ HORAS DE TRABAJO ══════ */}
      <section className="relative px-5 py-16 overflow-hidden">
        <Glow color="#A8FF3E" size="350px" top="50%" left="50%" opacity={0.06} />

        <FadeUp className="max-w-sm mx-auto text-center">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(139,139,167,0.6)' }}>Nueva función</p>
          <h2 className="font-extrabold font-display mb-4" style={{ fontSize: 'clamp(28px,7vw,42px)', lineHeight: 1.1 }}>
            ¿Cuánto<br />
            <span style={{ color: '#A8FF3E' }}>tuviste que trabajar</span><br />
            para pagarlo?
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: '#8B8BA7' }}>
            Al registrarte, nos cuentas cuánto ganas y cuántas horas trabajas. Así, cada vez que vas a gastar, PULSO te dice exactamente cuánto tiempo de tu vida vale ese gasto.
          </p>
        </FadeUp>

        {/* Example cards */}
        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          {[
            { gasto: '$45.000', item: '🛵 Rappi Delivery', horas: '3.9 horas', desc: 'Si ganas $700k/mes y trabajas 20h/semana' },
            { gasto: '$15.000', item: '☕ Starbucks', horas: '1.3 horas', desc: 'Una visita rápida al café' },
            { gasto: '$80.000', item: '🎵 Salida nocturna', horas: '6.9 horas', desc: 'Un viernes cualquiera' },
          ].map((e, i) => (
            <FadeUp key={e.gasto + i} delay={i * 0.08}>
              <div
                className="rounded-2xl p-4 flex items-center justify-between gap-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div>
                  <p className="text-sm font-bold text-white mb-0.5">{e.item}</p>
                  <p className="text-xs" style={{ color: 'rgba(139,139,167,0.6)' }}>{e.desc}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-extrabold font-display" style={{ color: '#ff4757', fontSize: 22, lineHeight: 1 }}>{e.horas}</p>
                  <p className="text-xs" style={{ color: 'rgba(139,139,167,0.5)' }}>{e.gasto}</p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ══════ TESTIMONIOS ══════ */}
      <section className="relative px-5 py-20 overflow-hidden">
        <Glow color="#7C4DFF" size="400px" top="50%" left="30%" opacity={0.07} />

        <FadeUp className="text-center mb-10">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(139,139,167,0.6)' }}>Lo que dicen los pilotos</p>
          <h2 className="font-extrabold font-display" style={{ fontSize: 'clamp(28px,7vw,40px)' }}>
            Palabras reales,<br />
            <span style={{ color: '#7C4DFF' }}>no marketing.</span>
          </h2>
        </FadeUp>

        <div className="flex flex-col gap-4 max-w-sm mx-auto">
          {[
            {
              quote: '"Me da pena hablar de plata con mi familia porque sienten que soy irresponsable, pero acá pude hablar tranquila."',
              who: 'Usuaria piloto, Prototipo 1',
              color: '#A8FF3E',
            },
            {
              quote: '"Tener acceso al historial de gastos antes de la sesión transforma completamente la conversación. El consejero llega con contexto real."',
              who: 'Asesor financiero',
              color: '#7C4DFF',
            },
            {
              quote: '"La pausa con contexto específico funciona mucho mejor que solo decirte \'¡cuidado!\'. Cuando ves \'tu tercer delivery esta semana\', ahí sí lo piensas."',
              who: 'Usuario piloto, Prototipo 2',
              color: '#ffd764',
            },
          ].map((t, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <div
                className="rounded-3xl p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.07)`, borderLeft: `3px solid ${t.color}` }}
              >
                <p className="text-sm leading-relaxed text-white/90 mb-3 italic">{t.quote}</p>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(139,139,167,0.5)' }}>— {t.who}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ══════ CÓMO EMPEZAR ══════ */}
      <section className="relative px-5 py-16 overflow-hidden">
        <FadeUp className="text-center mb-10">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(139,139,167,0.6)' }}>En 3 pasos</p>
          <h2 className="font-extrabold font-display" style={{ fontSize: 'clamp(28px,7vw,40px)' }}>
            Empezar es<br />
            <span style={{ color: '#A8FF3E' }}>muy simple.</span>
          </h2>
        </FadeUp>

        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          {[
            { n: '01', title: 'Crea tu cuenta', desc: 'Regístrate con tu correo y configura tu presupuesto semanal en 2 minutos.', color: '#7C4DFF' },
            { n: '02', title: 'Invita a tu partner', desc: 'Manda un link por WhatsApp a alguien de confianza. Ellos solo ven tus alertas.', color: '#A8FF3E' },
            { n: '03', title: 'Registra y toma consciencia', desc: 'Cada gasto que digitas activa la pausa PULSO. Tú decides con más información.', color: '#ffd764' },
          ].map((s, i) => (
            <FadeUp key={s.n} delay={i * 0.1}>
              <div
                className="rounded-3xl p-5 flex gap-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <span className="font-extrabold font-display flex-shrink-0" style={{ fontSize: 36, color: s.color, lineHeight: 1, opacity: 0.5 }}>{s.n}</span>
                <div>
                  <h4 className="font-extrabold text-white text-base mb-1 font-display">{s.title}</h4>
                  <p className="text-sm leading-relaxed" style={{ color: '#8B8BA7' }}>{s.desc}</p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ══════ CTA FINAL ══════ */}
      <section className="relative px-5 py-24 overflow-hidden text-center">
        <Glow color="#7C4DFF" size="500px" top="50%" left="50%" opacity={0.12} />
        <Glow color="#A8FF3E" size="300px" top="50%" left="50%" opacity={0.05} />

        <FadeUp>
          <div
            className="max-w-sm mx-auto rounded-3xl p-8 relative overflow-hidden"
            style={{ background: 'rgba(124,77,255,0.08)', border: '1px solid rgba(124,77,255,0.25)' }}
          >
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-glow"
              style={{ background: 'linear-gradient(135deg,#7C4DFF,#4a00e0)' }}
            >⚡</div>

            <h2 className="font-extrabold font-display text-white mb-3" style={{ fontSize: 'clamp(26px,7vw,38px)', lineHeight: 1.1 }}>
              ¿Listo para tomar<br />
              <span style={{ color: '#A8FF3E' }}>el control?</span>
            </h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: '#8B8BA7' }}>
              Gratis. Sin tarjeta de crédito. Solo consciencia financiera real.
            </p>

            <button
              onClick={() => navigate('/register')}
              className="w-full py-4 rounded-2xl font-extrabold text-base transition-all active:scale-[0.97] mb-3"
              style={{
                background: '#A8FF3E',
                color: '#080810',
                boxShadow: '0 0 32px rgba(168,255,62,0.3)',
                fontFamily: 'Space Grotesk, sans-serif',
              }}
            >
              Crear cuenta gratis →
            </button>

            <button
              onClick={() => navigate('/asesor/login')}
              className="w-full py-3 rounded-2xl font-semibold text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#8B8BA7' }}
            >
              🎓 Soy asesor financiero
            </button>
          </div>
        </FadeUp>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="px-5 py-8 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs"
            style={{ background: 'linear-gradient(135deg,#7C4DFF,#4a00e0)' }}>⚡</div>
          <span className="font-extrabold text-xs tracking-widest text-white font-display">PULSO+PACTO</span>
        </div>
        <p className="text-xs mb-1" style={{ color: 'rgba(139,139,167,0.4)' }}>
          Pontificia Universidad Javeriana Cali · Dream Team · 2026
        </p>
        <p className="text-xs" style={{ color: 'rgba(139,139,167,0.25)' }}>pulsopacto.online</p>
      </footer>

    </div>
  )
}
