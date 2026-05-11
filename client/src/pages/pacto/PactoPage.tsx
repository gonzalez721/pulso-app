import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Share2, Plus, Trash2, Edit2, Trophy, TrendingDown, TrendingUp, Zap } from 'lucide-react'
import { usePactoPartner, useUpsertPartner, useDeletePartner, usePactoDashboard } from '../../hooks/usePacto'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { formatCurrency } from '../../lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(nombre: string) {
  return nombre.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

function Avatar({ fotoUrl, nombre, size = 48 }: { fotoUrl?: string; nombre: string; size?: number }) {
  return (
    <div
      className="rounded-2xl bg-surface-elevated border border-border-light flex items-center justify-center overflow-hidden flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {fotoUrl
        ? <img src={fotoUrl} className="w-full h-full object-cover" alt={nombre} />
        : <span className="font-extrabold text-primary-dark" style={{ fontSize: size * 0.3 }}>{getInitials(nombre)}</span>
      }
    </div>
  )
}

// ── Setup / invite form ───────────────────────────────────────────────────────

function SetupCard() {
  const { data, isLoading } = usePactoPartner()
  const { mutate: upsert, isPending: saving } = useUpsertPartner()
  const { mutate: remove, isPending: removing } = useDeletePartner()
  const [showModal, setShowModal] = useState(false)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [copied, setCopied] = useState(false)

  if (isLoading) return <div className="h-40 bg-surface-raised border border-border-light rounded-3xl animate-pulse" />

  const partner = data?.partner
  const asInvited = data?.asInvited

  const partnerLink = partner ? `${window.location.origin}/pacto/${partner.token}` : null

  const openAdd = () => {
    setNombre(partner?.nombre ?? '')
    setTelefono(partner?.telefono ?? '')
    setShowModal(true)
  }

  const save = () => {
    if (!nombre.trim()) return
    upsert({ nombre: nombre.trim(), telefono: telefono.trim() || undefined }, {
      onSuccess: () => setShowModal(false),
    })
  }

  const shareWhatsApp = () => {
    if (!partnerLink || !partner) return
    const msg = encodeURIComponent(
      `Hola ${partner.nombre} 👋 Te invito a ser mi partner PACTO en PULSO. Cuando haga gastos de riesgo te voy a notificar y podremos competir juntos. Regístrate aquí: ${partnerLink}`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const copyLink = () => {
    if (!partnerLink) return
    navigator.clipboard.writeText(partnerLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div
        className="rounded-3xl p-5 space-y-4"
        style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #2A1A4E 100%)', border: '1px solid rgba(124,77,255,0.25)' }}
      >
        {asInvited && (
          <div className="rounded-2xl px-4 py-3 text-sm text-white"
            style={{ background: 'rgba(168,255,62,0.08)', border: '1px solid rgba(168,255,62,0.2)' }}>
            🤝 <span className="font-bold">{asInvited.inviterNombre}</span> te agregó como partner PACTO
            {asInvited.estado === 'aceptado' ? ' — ¡están conectados!' : ''}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="font-extrabold text-white text-base">Tu partner PACTO</p>
            <p className="text-text-muted text-xs mt-0.5">
              {partner
                ? partner.estado === 'aceptado'
                  ? '✅ Conectados — compitiendo juntos'
                  : `⏳ Invitación pendiente para ${partner.nombre}`
                : 'Invita a un amigo para competir'}
            </p>
          </div>
          {partner ? (
            <button onClick={openAdd} className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Edit2 size={13} className="text-text-muted" />
            </button>
          ) : (
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-bold transition-all"
              style={{ background: 'rgba(124,77,255,0.15)', border: '1px solid rgba(124,77,255,0.4)', color: '#A890FF' }}
            >
              <Plus size={14} /> Invitar
            </button>
          )}
        </div>

        {partner && (
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-9 h-9 rounded-xl bg-primary-dark/25 flex items-center justify-center flex-shrink-0">
                <span className="text-base">🤝</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">{partner.nombre}</p>
                {partner.telefono && <p className="text-xs text-text-muted">{partner.telefono}</p>}
              </div>
              <button onClick={() => remove()} disabled={removing} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10">
                <Trash2 size={13} className="text-red-400/50 hover:text-red-400" />
              </button>
            </div>

            {partner.estado === 'pendiente' && (
              <div className="flex gap-2">
                <button onClick={shareWhatsApp}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold"
                  style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', color: '#25D366' }}>
                  <Share2 size={12} /> Invitar por WhatsApp
                </button>
                <button onClick={copyLink}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: copied ? '#A8FF3E' : '#fff' }}>
                  {copied ? '¡Copiado!' : 'Copiar link'}
                </button>
              </div>
            )}
          </div>
        )}

        {!partner && (
          <p className="text-xs text-text-dim leading-relaxed">
            Tu partner recibe una notificación cuando haces un gasto de riesgo y pueden verse las estadísticas de gasto mutuamente. ¡Compitan a ver quién controla mejor su presupuesto!
          </p>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={partner ? 'Editar partner' : 'Invitar a PACTO'}>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-white mb-2 block">Nombre de tu amigo / familiar</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
              placeholder="¿Cómo se llama?" autoFocus
              className="w-full bg-surface-elevated border border-border-light rounded-2xl px-4 py-3 text-white placeholder-text-dim focus:outline-none focus:border-neon-green/60 text-sm" />
          </div>
          <div>
            <label className="text-sm font-semibold text-white mb-2 block">Teléfono (opcional, para WhatsApp)</label>
            <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)}
              placeholder="+57 300 000 0000"
              className="w-full bg-surface-elevated border border-border-light rounded-2xl px-4 py-3 text-white placeholder-text-dim focus:outline-none focus:border-neon-green/60 text-sm" />
          </div>
          <div className="rounded-2xl p-4 text-xs text-text-muted leading-relaxed"
            style={{ background: 'rgba(124,77,255,0.06)', border: '1px solid rgba(124,77,255,0.15)' }}>
            🔒 Tu partner solo ve tus alertas de gasto y estadísticas semanales. Nunca ve tu saldo exacto ni contraseña.
          </div>
          <Button onClick={save} loading={saving} disabled={!nombre.trim()} fullWidth size="lg">
            {partner ? 'Guardar cambios' : 'Generar link de invitación'}
          </Button>
        </div>
      </Modal>
    </>
  )
}

// ── Competitive dashboard ─────────────────────────────────────────────────────

function CompetitionDashboard() {
  const { data, isLoading } = usePactoDashboard()

  if (isLoading) return (
    <div className="space-y-3">
      {[0,1,2].map(i => <div key={i} className="h-28 bg-surface-raised border border-border-light rounded-3xl animate-pulse" />)}
    </div>
  )

  if (!data?.connected) return null

  const me = data.me!
  const partner = data.partner!

  // Determine winner (lower % = better budget adherence; if no budget, lower spend)
  const meScore = me.pct ?? (me.budget > 0 ? 101 : 0)
  const partnerScore = partner.pct ?? (partner.budget > 0 ? 101 : 0)
  const meWinning = meScore <= partnerScore

  const allCategories = Array.from(
    new Set([...Object.keys(me.byCategory), ...Object.keys(partner.byCategory)])
  ).sort((a, b) => (me.byCategory[b] ?? 0) + (partner.byCategory[b] ?? 0) - ((me.byCategory[a] ?? 0) + (partner.byCategory[a] ?? 0)))

  return (
    <div className="space-y-4">
      {/* Winner banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl p-5 text-center"
        style={{
          background: meWinning
            ? 'linear-gradient(135deg, rgba(168,255,62,0.12) 0%, rgba(168,255,62,0.04) 100%)'
            : 'linear-gradient(135deg, rgba(255,71,87,0.08) 0%, rgba(255,71,87,0.02) 100%)',
          border: `1px solid ${meWinning ? 'rgba(168,255,62,0.25)' : 'rgba(255,71,87,0.2)'}`,
        }}
      >
        <Trophy size={28} className={meWinning ? 'text-neon-green mx-auto mb-2' : 'text-text-muted mx-auto mb-2'} />
        <p className="font-extrabold text-white text-lg">
          {meScore === partnerScore ? '¡Empate!' : meWinning ? '¡Tú vas ganando! 🏆' : `${partner.nombre} va ganando`}
        </p>
        <p className="text-text-muted text-xs mt-1">
          {meWinning
            ? 'Llevas mejor control del presupuesto esta semana'
            : `${partner.nombre} lleva mejor control esta semana`}
        </p>
      </motion.div>

      {/* Side-by-side cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { data: me, isMe: true },
          { data: partner, isMe: false },
        ].map(({ data: u, isMe }) => {
          const winning = isMe ? meWinning : !meWinning
          const pctNum = u.pct ?? 0
          return (
            <motion.div
              key={isMe ? 'me' : 'partner'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: isMe ? 0 : 0.05 }}
              className="rounded-3xl p-4 space-y-3"
              style={{
                background: winning ? 'rgba(168,255,62,0.05)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${winning ? 'rgba(168,255,62,0.2)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <div className="flex items-center gap-2">
                <Avatar fotoUrl={u.fotoUrl} nombre={u.nombre} size={36} />
                <div className="min-w-0">
                  <p className="font-bold text-white text-xs truncate">{isMe ? 'Tú' : u.nombre}</p>
                  {winning && <span className="text-[9px] font-black text-neon-green">GANANDO</span>}
                </div>
              </div>

              <div>
                <p className="text-2xl font-extrabold text-white">{formatCurrency(u.spent)}</p>
                {u.budget > 0 ? (
                  <>
                    <p className="text-[11px] text-text-muted">de {formatCurrency(u.budget)}</p>
                    <div className="mt-2 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(pctNum, 100)}%`,
                          background: pctNum >= 100 ? '#FF4757' : pctNum >= 80 ? '#FFB800' : '#A8FF3E',
                        }}
                      />
                    </div>
                    <p className={`text-[11px] font-bold mt-1 ${pctNum >= 100 ? 'text-red-400' : pctNum >= 80 ? 'text-yellow-400' : 'text-neon-green'}`}>
                      {pctNum}% del presupuesto
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] text-text-dim">{u.txCount} gasto{u.txCount !== 1 ? 's' : ''} esta semana</p>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Category breakdown */}
      {allCategories.length > 0 && (
        <div className="rounded-3xl p-5 space-y-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-black uppercase tracking-widest text-text-muted">Categorías esta semana</p>
          <div className="space-y-3">
            {allCategories.slice(0, 5).map((cat) => {
              const myAmt = me.byCategory[cat] ?? 0
              const partnerAmt = partner.byCategory[cat] ?? 0
              const max = Math.max(myAmt, partnerAmt, 1)
              return (
                <div key={cat}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-text-muted font-semibold">{cat}</span>
                    <div className="flex gap-3 text-[11px] font-bold">
                      <span className="text-neon-green">{formatCurrency(myAmt)}</span>
                      <span className="text-text-dim">vs</span>
                      <span style={{ color: '#A890FF' }}>{formatCurrency(partnerAmt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 h-1.5">
                    <div className="flex-1 bg-surface-elevated rounded-l-full overflow-hidden">
                      <div className="h-full bg-neon-green/70 rounded-l-full transition-all duration-500"
                        style={{ width: `${(myAmt / max) * 100}%`, marginLeft: 'auto' }} />
                    </div>
                    <div className="flex-1 bg-surface-elevated rounded-r-full overflow-hidden">
                      <div className="h-full rounded-r-full transition-all duration-500"
                        style={{ width: `${(partnerAmt / max) * 100}%`, background: 'rgba(168,144,255,0.7)' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 pt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-neon-green/70" />
              <span className="text-[11px] text-text-muted font-semibold">Tú</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(168,144,255,0.7)' }} />
              <span className="text-[11px] text-text-muted font-semibold">{partner.nombre}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function PactoPage() {
  const { data } = usePactoPartner()
  const { data: dashboard } = usePactoDashboard()

  const isConnected = dashboard?.connected === true

  return (
    <div className="px-5 pt-6 pb-28 space-y-5 relative">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary-dark/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Shield size={22} style={{ color: '#A890FF' }} />
        <div>
          <h1 className="text-2xl font-extrabold font-display text-white leading-none">PACTO</h1>
          <p className="text-text-muted text-xs mt-0.5">Responsabilidad financiera en pareja</p>
        </div>
      </motion.div>

      <SetupCard />

      {isConnected && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-neon-green" />
              <p className="text-xs font-black uppercase tracking-widest text-text-muted">Competencia semanal</p>
            </div>
            <CompetitionDashboard />
          </motion.div>
        </AnimatePresence>
      )}

      {!isConnected && data?.partner && data.partner.estado === 'pendiente' && (
        <div className="rounded-3xl p-6 text-center space-y-2"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-3xl">⏳</p>
          <p className="font-bold text-white text-sm">Esperando que {data.partner.nombre} acepte</p>
          <p className="text-text-muted text-xs leading-relaxed">
            Una vez que abra el link y se registre, podrán ver la competencia aquí.
          </p>
        </div>
      )}
    </div>
  )
}
