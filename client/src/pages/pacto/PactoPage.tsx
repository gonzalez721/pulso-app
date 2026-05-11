import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Share2, Plus, Trash2, Edit2, Trophy, Zap, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import { usePactoPartners, useCreatePartner, useUpdatePartner, useDeletePartner, usePactoDashboard } from '../../hooks/usePacto'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { formatCurrency } from '../../lib/utils'
import type { PactoPartnerItem, PactoStats } from '../../api/endpoints'

function getInitials(n: string) {
  return n.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function Avatar({ fotoUrl, nombre, size = 40 }: { fotoUrl?: string | null; nombre: string; size?: number }) {
  return (
    <div className="rounded-2xl bg-surface-elevated border border-border-light flex items-center justify-center overflow-hidden flex-shrink-0"
      style={{ width: size, height: size }}>
      {fotoUrl
        ? <img src={fotoUrl} className="w-full h-full object-cover" alt={nombre} />
        : <span className="font-extrabold text-primary-dark" style={{ fontSize: size * 0.32 }}>{getInitials(nombre)}</span>}
    </div>
  )
}

// ── Add / Edit partner modal ──────────────────────────────────────────────────

function PartnerModal({ open, onClose, existing }: {
  open: boolean; onClose: () => void
  existing?: PactoPartnerItem
}) {
  const [nombre, setNombre] = useState(existing?.nombre ?? '')
  const [telefono, setTelefono] = useState(existing?.telefono ?? '')
  const { mutate: create, isPending: creating } = useCreatePartner()
  const { mutate: update, isPending: updating } = useUpdatePartner()

  const handleOpen = () => {
    setNombre(existing?.nombre ?? '')
    setTelefono(existing?.telefono ?? '')
  }

  const save = () => {
    if (!nombre.trim()) return
    if (existing) {
      update({ partnerId: existing.id, nombre: nombre.trim(), telefono: telefono.trim() || undefined }, { onSuccess: onClose })
    } else {
      create({ nombre: nombre.trim(), telefono: telefono.trim() || undefined }, { onSuccess: onClose })
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={existing ? 'Editar partner' : 'Agregar partner PACTO'}>
      <div className="px-5 py-4 space-y-4">
        <div>
          <label className="text-sm font-semibold text-white mb-2 block">Nombre</label>
          <input autoFocus type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
            placeholder="¿Cómo se llama?"
            className="w-full bg-surface-elevated border border-border-light rounded-2xl px-4 py-3 text-white placeholder-text-dim focus:outline-none focus:border-neon-green/60 text-sm" />
        </div>
        <div>
          <label className="text-sm font-semibold text-white mb-2 block">Teléfono (opcional)</label>
          <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)}
            placeholder="+57 300 000 0000"
            className="w-full bg-surface-elevated border border-border-light rounded-2xl px-4 py-3 text-white placeholder-text-dim focus:outline-none focus:border-neon-green/60 text-sm" />
        </div>
        <div className="rounded-2xl p-3 text-xs text-text-muted leading-relaxed"
          style={{ background: 'rgba(124,77,255,0.06)', border: '1px solid rgba(124,77,255,0.15)' }}>
          🔒 Solo verá tus alertas y estadísticas semanales. Nunca el saldo exacto ni contraseña.
        </div>
        <Button onClick={save} loading={creating || updating} disabled={!nombre.trim()} fullWidth size="lg">
          {existing ? 'Guardar cambios' : 'Generar link de invitación'}
        </Button>
      </div>
    </Modal>
  )
}

// ── Partner card (invite status + link) ──────────────────────────────────────

function PartnerCard({ partner }: { partner: PactoPartnerItem }) {
  const { mutate: remove, isPending: removing } = useDeletePartner()
  const [showEdit, setShowEdit] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showLink, setShowLink] = useState(false)

  const link = `${window.location.origin}/pacto/${partner.token}`

  const share = () => {
    const msg = encodeURIComponent(
      `Hola ${partner.nombre} 👋 Te invito a ser mi partner PACTO en PULSO. Vamos a competir a ver quién controla mejor sus gastos. Regístrate aquí: ${link}`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const copy = () => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-dark/20 flex items-center justify-center flex-shrink-0">
            <span className="text-base">{partner.estado === 'aceptado' ? '✅' : '⏳'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm">{partner.nombre}</p>
            <p className="text-[11px] text-text-dim">
              {partner.estado === 'aceptado' ? 'Conectado' : 'Esperando registro'}
              {partner.telefono ? ` · ${partner.telefono}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowEdit(true)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10">
              <Edit2 size={12} className="text-text-muted" />
            </button>
            <button onClick={() => remove(partner.id)} disabled={removing} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10">
              <Trash2 size={12} className="text-red-400/60 hover:text-red-400" />
            </button>
          </div>
        </div>

        {partner.estado === 'pendiente' && (
          <div className="border-t border-white/5 px-4 py-3 flex gap-2">
            <button onClick={share}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold"
              style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', color: '#25D366' }}>
              <Share2 size={11} /> WhatsApp
            </button>
            <button onClick={copy}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: copied ? '#A8FF3E' : '#fff' }}>
              {copied ? <><Check size={11} /> Copiado</> : <><Copy size={11} /> Copiar link</>}
            </button>
          </div>
        )}
      </div>

      <PartnerModal open={showEdit} onClose={() => setShowEdit(false)} existing={partner} />
    </>
  )
}

// ── Competition card (one per accepted partner) ───────────────────────────────

function CompetitionCard({ me, competition }: {
  me: PactoStats
  competition: { partnerNombreInvite: string; partner: PactoStats }
}) {
  const [expanded, setExpanded] = useState(false)
  const partner = competition.partner
  const displayName = competition.partnerNombreInvite || partner.nombre

  const meScore = me.pct ?? (me.budget > 0 ? 101 : me.spent)
  const partnerScore = partner.pct ?? (partner.budget > 0 ? 101 : partner.spent)
  const meWinning = meScore <= partnerScore
  const tied = meScore === partnerScore

  const allCategories = Array.from(new Set([...Object.keys(me.byCategory), ...Object.keys(partner.byCategory)]))
    .sort((a, b) => (me.byCategory[b] ?? 0) + (partner.byCategory[b] ?? 0) - ((me.byCategory[a] ?? 0) + (partner.byCategory[a] ?? 0)))

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>

      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={14} className={tied ? 'text-text-muted' : meWinning ? 'text-neon-green' : 'text-yellow-400'} />
          <span className="text-xs font-black text-white">
            {tied ? 'Empate' : meWinning ? 'Tú vas ganando 🏆' : `${displayName} va ganando`}
          </span>
          <span className="ml-auto text-[10px] text-text-dim">vs {displayName}</span>
        </div>

        {/* Side by side */}
        <div className="grid grid-cols-2 gap-2">
          {[{ u: me, isMe: true, name: 'Tú', winning: meWinning || tied },
            { u: partner, isMe: false, name: displayName, winning: !meWinning || tied }
          ].map(({ u, name, winning }) => (
            <div key={name} className="rounded-2xl p-3"
              style={{
                background: winning && !tied ? 'rgba(168,255,62,0.06)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${winning && !tied ? 'rgba(168,255,62,0.18)' : 'rgba(255,255,255,0.07)'}`,
              }}>
              <p className="text-[11px] text-text-muted font-semibold mb-1 truncate">{name}</p>
              <p className="text-xl font-extrabold text-white">{formatCurrency(u.spent)}</p>
              {u.budget > 0 ? (
                <>
                  <div className="mt-1.5 h-1 bg-surface-elevated rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${Math.min(u.pct ?? 0, 100)}%`,
                      background: (u.pct ?? 0) >= 100 ? '#FF4757' : (u.pct ?? 0) >= 80 ? '#FFB800' : '#A8FF3E',
                    }} />
                  </div>
                  <p className={`text-[10px] font-bold mt-0.5 ${(u.pct ?? 0) >= 100 ? 'text-red-400' : (u.pct ?? 0) >= 80 ? 'text-yellow-400' : 'text-neon-green'}`}>
                    {u.pct ?? 0}%
                  </p>
                </>
              ) : (
                <p className="text-[10px] text-text-dim mt-0.5">{u.txCount} gastos</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Categories (collapsible) */}
      {allCategories.length > 0 && (
        <>
          <button onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-2.5 border-t border-white/5 text-xs font-semibold text-text-muted hover:text-white transition-colors">
            <span>Categorías</span>
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="px-5 pb-4 space-y-2.5">
                  {allCategories.slice(0, 6).map((cat) => {
                    const myAmt = me.byCategory[cat] ?? 0
                    const pAmt = partner.byCategory[cat] ?? 0
                    const max = Math.max(myAmt, pAmt, 1)
                    return (
                      <div key={cat}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[11px] text-text-muted font-semibold">{cat}</span>
                          <div className="flex gap-2 text-[10px] font-bold">
                            <span className="text-neon-green/80">{formatCurrency(myAmt)}</span>
                            <span className="text-text-dim">·</span>
                            <span style={{ color: 'rgba(168,144,255,0.8)' }}>{formatCurrency(pAmt)}</span>
                          </div>
                        </div>
                        <div className="flex gap-0.5 h-1">
                          <div className="flex-1 bg-surface-elevated rounded-l overflow-hidden">
                            <div className="h-full bg-neon-green/60 rounded-l ml-auto transition-all" style={{ width: `${(myAmt / max) * 100}%` }} />
                          </div>
                          <div className="flex-1 bg-surface-elevated rounded-r overflow-hidden">
                            <div className="h-full rounded-r transition-all" style={{ width: `${(pAmt / max) * 100}%`, background: 'rgba(168,144,255,0.6)' }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div className="flex gap-4 pt-1">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-neon-green/60" /><span className="text-[10px] text-text-muted">Tú</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: 'rgba(168,144,255,0.6)' }} /><span className="text-[10px] text-text-muted">{displayName}</span></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function PactoPage() {
  const { data: pactoData, isLoading: loadingPartners } = usePactoPartners()
  const { data: dashboard, isLoading: loadingDash } = usePactoDashboard()
  const [showAdd, setShowAdd] = useState(false)

  const partners = pactoData?.partners ?? []
  const asInvited = pactoData?.asInvited ?? []
  const competitions = dashboard?.competitions ?? []
  const me = dashboard?.me

  return (
    <div className="px-5 pt-6 pb-28 space-y-5 relative">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary-dark/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={22} style={{ color: '#A890FF' }} />
          <div>
            <h1 className="text-2xl font-extrabold font-display text-white leading-none">PACTO</h1>
            <p className="text-text-muted text-xs mt-0.5">Responsabilidad financiera en grupo</p>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all"
          style={{ background: 'rgba(124,77,255,0.15)', border: '1px solid rgba(124,77,255,0.35)', color: '#A890FF' }}>
          <Plus size={13} /> Agregar
        </button>
      </motion.div>

      {/* As invited banners */}
      {asInvited.length > 0 && (
        <div className="space-y-2">
          {asInvited.map((inv) => (
            <div key={inv.id} className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: 'rgba(168,255,62,0.06)', border: '1px solid rgba(168,255,62,0.15)' }}>
              <span className="text-lg">🤝</span>
              <div>
                <p className="text-sm font-bold text-white">{inv.inviterNombre} te agregó como partner</p>
                <p className="text-xs text-text-muted">{inv.estado === 'aceptado' ? '✅ Conectados' : 'Pendiente'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Partners list */}
      {loadingPartners ? (
        <div className="space-y-2">
          {[0, 1].map((i) => <div key={i} className="h-16 bg-surface-raised border border-border-light rounded-2xl animate-pulse" />)}
        </div>
      ) : partners.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
            <span>Mis partners</span>
            <span className="rounded-full px-1.5 py-0.5 text-[9px] font-black bg-primary-dark/20 text-primary-dark">{partners.length}</span>
          </p>
          {partners.map((p) => <PartnerCard key={p.id} partner={p} />)}
        </div>
      ) : (
        <div className="rounded-3xl p-6 text-center space-y-3"
          style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #2A1A4E 100%)', border: '1px solid rgba(124,77,255,0.2)' }}>
          <p className="text-3xl">🤝</p>
          <p className="font-extrabold text-white">Agrega tu primer partner</p>
          <p className="text-text-muted text-xs leading-relaxed">
            Invita amigos o familiares. Van a ver tus alertas de gasto y podrán competir contigo a ver quién controla mejor su presupuesto.
          </p>
          <button onClick={() => setShowAdd(true)}
            className="mt-1 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all"
            style={{ background: 'rgba(124,77,255,0.2)', border: '1px solid rgba(124,77,255,0.4)', color: '#A890FF' }}>
            + Invitar a alguien
          </button>
        </div>
      )}

      {/* Competition dashboard */}
      {competitions.length > 0 && me && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap size={13} className="text-neon-green" />
            <p className="text-xs font-black uppercase tracking-widest text-text-muted">Competencia semanal</p>
          </div>
          {competitions.map((comp) => (
            <CompetitionCard key={comp.partnerId} me={me} competition={comp} />
          ))}
        </div>
      )}

      {/* Pending partners — waiting */}
      {!loadingDash && partners.length > 0 && competitions.length === 0 && (
        <div className="rounded-3xl p-5 text-center space-y-2"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-2xl">⏳</p>
          <p className="font-bold text-white text-sm">Esperando que tus partners se registren</p>
          <p className="text-text-muted text-xs">La competencia aparece cuando alguien acepta la invitación.</p>
        </div>
      )}

      <PartnerModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  )
}
