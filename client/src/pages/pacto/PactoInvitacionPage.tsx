import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Bell, CheckCircle2, XCircle } from 'lucide-react'
import { pactoEndpoints, suscribirPush } from '../../api/pactoClient'

type Fase = 'cargando' | 'invitacion' | 'aceptando' | 'exito' | 'error' | 'ya_activo'

export function PactoInvitacionPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [fase, setFase] = useState<Fase>('cargando')
  const [userName, setUserName] = useState('')
  const [vapidKey, setVapidKey] = useState('')
  const [partnerNombre, setPartnerNombre] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [pushGranted, setPushGranted] = useState(false)

  // Load invite info
  useEffect(() => {
    if (!token) { setFase('error'); setErrorMsg('Link inválido'); return }

    pactoEndpoints.getInviteInfo(token)
      .then(r => {
        setUserName(r.data.userName)
        setVapidKey(r.data.vapidPublicKey)
        setFase('invitacion')
      })
      .catch(err => {
        if (err?.response?.data?.yaActivo) {
          setFase('ya_activo')
        } else {
          setFase('error')
          setErrorMsg(err?.response?.data?.error ?? 'No se encontró la invitación')
        }
      })
  }, [token])

  const handleSolicitarPush = async () => {
    if (!('Notification' in window)) { setPushGranted(true); return }
    const perm = await Notification.requestPermission()
    setPushGranted(perm === 'granted')
  }

  const handleAceptar = async () => {
    if (!partnerNombre.trim()) return
    setFase('aceptando')

    let pushSub: PushSubscription | null = null
    try {
      pushSub = await suscribirPush(vapidKey)
    } catch (_) { /* push optional */ }

    try {
      await pactoEndpoints.acceptInvite(token, partnerNombre.trim(), pushSub)
      setFase('exito')
    } catch (err: any) {
      setFase('error')
      setErrorMsg(err?.response?.data?.error ?? 'Error al aceptar la invitación')
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'linear-gradient(160deg, #07070f 0%, #1a0a2e 100%)' }}
    >
      <AnimatePresence mode="wait">

        {/* Loading */}
        {fase === 'cargando' && (
          <motion.div key="cargando" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-3xl bg-primary-dark/20 flex items-center justify-center">
              <Shield size={26} className="text-primary-dark animate-pulse" />
            </div>
            <p className="text-text-muted text-sm">Cargando invitación...</p>
          </motion.div>
        )}

        {/* Error */}
        {(fase === 'error' || fase === 'ya_activo') && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto">
              <XCircle size={28} className="text-red-400" />
            </div>
            <p className="font-extrabold text-white text-xl">
              {fase === 'ya_activo' ? 'Este PACTO ya está activo' : 'Invitación no válida'}
            </p>
            <p className="text-sm text-text-muted">
              {fase === 'ya_activo'
                ? 'Este link ya fue usado. Si crees que es un error, pídele a tu amigo/a que te envíe uno nuevo.'
                : errorMsg
              }
            </p>
          </motion.div>
        )}

        {/* Invitation form */}
        {fase === 'invitacion' && (
          <motion.div
            key="invitacion"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm space-y-6"
          >
            {/* Header */}
            <div className="text-center space-y-3">
              <div
                className="w-18 h-18 rounded-3xl mx-auto flex items-center justify-center"
                style={{
                  width: 72, height: 72,
                  background: 'rgba(124,77,255,0.15)',
                  border: '1px solid rgba(124,77,255,0.35)',
                }}
              >
                <Shield size={30} className="text-primary-dark" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{userName}</p>
                <p className="text-base text-text-muted mt-1">te invita al PACTO</p>
              </div>
            </div>

            {/* What it means */}
            <div
              className="rounded-3xl p-4 space-y-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Tu rol como partner</p>
              {[
                { icon: '🔔', text: `Cuando ${userName} detecte una compra de riesgo, recibirás una notificación` },
                { icon: '⏱️', text: 'Tendrás 60 segundos para escribirle un mensaje de apoyo' },
                { icon: '💬', text: 'Tu mensaje aparecerá en su pantalla antes de que confirme la compra' },
                { icon: '🔒', text: 'Solo verás sus alertas, nada más de su aplicación' },
              ].map(({ icon, text }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-base flex-shrink-0">{icon}</span>
                  <p className="text-sm text-text-muted leading-snug">{text}</p>
                </div>
              ))}
            </div>

            {/* Name input */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-white block">¿Cuál es tu nombre?</label>
              <input
                type="text"
                value={partnerNombre}
                onChange={e => setPartnerNombre(e.target.value)}
                placeholder="Tu nombre"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-base placeholder:text-text-muted outline-none focus:border-primary-dark/60 transition-colors"
                autoFocus
              />
            </div>

            {/* Push permission */}
            {!pushGranted && (
              <button
                onClick={handleSolicitarPush}
                className="w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white hover:bg-white/8 transition-colors"
              >
                <Bell size={16} className="text-amber-400" />
                Activar notificaciones push
              </button>
            )}
            {pushGranted && (
              <div className="flex items-center gap-2 py-2 px-1">
                <CheckCircle2 size={15} className="text-neon-green flex-shrink-0" />
                <p className="text-sm text-neon-green font-medium">Notificaciones activadas ✓</p>
              </div>
            )}

            {/* Accept button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAceptar}
              disabled={!partnerNombre.trim()}
              className="w-full py-4 rounded-2xl font-bold text-[#0A0A12] text-base disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #a8ff3e, #7fff00)' }}
            >
              Ser partner de {userName}
            </motion.button>

            <p className="text-xs text-text-muted text-center leading-relaxed">
              Al aceptar confirmas que apoyarás a {userName} en sus decisiones financieras.
            </p>
          </motion.div>
        )}

        {/* Accepting spinner */}
        {fase === 'aceptando' && (
          <motion.div
            key="aceptando"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-14 h-14 rounded-3xl bg-primary-dark/20 flex items-center justify-center">
              <div className="w-7 h-7 border-2 border-primary-dark/30 border-t-primary-dark rounded-full animate-spin" />
            </div>
            <p className="text-text-muted text-sm">Activando PACTO...</p>
          </motion.div>
        )}

        {/* Success */}
        {fase === 'exito' && (
          <motion.div
            key="exito"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="w-full max-w-sm text-center space-y-5"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 350, damping: 18 }}
              className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center"
              style={{ background: 'rgba(168,255,62,0.12)', border: '1px solid rgba(168,255,62,0.3)' }}
            >
              <CheckCircle2 size={36} className="text-neon-green" />
            </motion.div>

            <div>
              <p className="text-2xl font-black text-white">¡PACTO activado!</p>
              <p className="text-base text-text-muted mt-2">
                Ahora eres el partner de <span className="text-white font-semibold">{userName}</span>.
              </p>
            </div>

            <div
              className="rounded-3xl p-4 space-y-2 text-left"
              style={{ background: 'rgba(168,255,62,0.06)', border: '1px solid rgba(168,255,62,0.2)' }}
            >
              <p className="text-xs font-bold text-neon-green uppercase tracking-wider">¿Qué pasa ahora?</p>
              <p className="text-sm text-text-muted leading-relaxed">
                Cuando {userName} haga una compra de riesgo, recibirás una notificación push. Tendrás 60 segundos para escribirle algo. ¡Ese mensaje puede marcar la diferencia!
              </p>
            </div>

            <p className="text-xs text-text-muted">
              Ya podés cerrar esta página 🙌
            </p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
