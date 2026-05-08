import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  ArrowLeft, Video, AlertTriangle, Info, CheckCircle,
  TrendingUp, DollarSign, Target, Save, ChevronDown, ChevronUp, Plus, X, Copy, Check,
} from 'lucide-react'
import { useAsesorSesiones, useEstudianteStats, useSaveObservacion } from '../../hooks/useAsesor'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { formatCurrency, formatDate, formatTime, getInitials } from '../../lib/utils'
import { CATEGORY_COLORS } from '../../types'

const ALERTA_ICON = {
  danger:  { icon: AlertTriangle, color: 'bg-red-500/10 border-red-500/30 text-red-400' },
  warning: { icon: AlertTriangle, color: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
  info:    { icon: Info,          color: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
}

const MOOD_EMOJI: Record<string, string> = {
  great: '😄', good: '🙂', neutral: '😐', stressed: '😰', bad: '😔',
}

export function AsesorSesionDetail() {
  const { sesionId: id } = useParams<{ sesionId: string }>()
  const navigate = useNavigate()

  const { data: sesiones = [] } = useAsesorSesiones()
  const sesion = sesiones.find((s: any) => s.id === id) as any

  const { data: stats, isLoading: statsLoading } = useEstudianteStats(sesion?.user?.id ?? null)
  const { mutate: saveObs, isPending: saving } = useSaveObservacion()

  const [showObsForm, setShowObsForm]   = useState(false)
  const [temas,         setTemas]       = useState<string[]>(sesion?.observaciones?.temasDiscutidos ?? [])
  const [patrones,      setPatrones]    = useState<string[]>(sesion?.observaciones?.patronesIdentificados ?? [])
  const [compromisos,   setCompromisos] = useState<string[]>(sesion?.observaciones?.compromisosProximaSemana ?? [])
  const [notas,         setNotas]       = useState(sesion?.observaciones?.notasImportantes ?? '')
  const [newTema,       setNewTema]     = useState('')
  const [newPatron,     setNewPatron]   = useState('')
  const [newCompromiso, setNewCompromiso] = useState('')

  const [showStats,  setShowStats]  = useState(true)
  const [showMoods,  setShowMoods]  = useState(false)
  const [showTxs,    setShowTxs]    = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const copyMeetLink = () => {
    if (!sesion?.linkMeet) return
    navigator.clipboard.writeText(sesion.linkMeet)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2500)
  }

  if (!sesion) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A12]">
        <div className="text-center">
          <p className="text-4xl mb-2">🔍</p>
          <p className="font-semibold text-text-muted">Sesión no encontrada</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-sm text-neon-green font-bold">← Volver</button>
        </div>
      </div>
    )
  }

  const student   = sesion.user
  const isPending = sesion.estado === 'programada'
  const isToday   = new Date(sesion.fechaHora).toDateString() === new Date().toDateString()

  const handleSaveObs = () => {
    saveObs({
      sesionId: id!,
      data: { temasDiscutidos: temas, patronesIdentificados: patrones, compromisosProximaSemana: compromisos, notasImportantes: notas || undefined },
    }, { onSuccess: () => setShowObsForm(false) })
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div
        className="px-5 pt-12 pb-6 text-white"
        style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #2A1A4E 100%)', borderBottom: '1px solid rgba(124,77,255,0.2)' }}
      >
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted text-sm mb-4 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Volver
        </button>

        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-bold flex-shrink-0 overflow-hidden">
            {student?.nombre ? getInitials(student.nombre) : '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold text-white">{student?.nombre ?? '—'}</h1>
            <p className="text-text-muted text-sm">{student?.universidad}{student?.semestre ? ` · Sem. ${student.semestre}` : ''}</p>
            <p className="text-text-dim text-xs mt-1">{student?.email}</p>
          </div>
        </div>

        {/* Session time + status */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 bg-white/10 border border-white/10 rounded-2xl px-4 py-2">
            <p className="text-text-dim text-xs">Fecha y hora</p>
            <p className="text-white font-bold text-sm">
              {formatDate(sesion.fechaHora, { weekday: 'long', day: 'numeric', month: 'long' })} · {formatTime(sesion.fechaHora)}
            </p>
          </div>
          <div className={`px-3 py-2 rounded-2xl text-xs font-bold ${
            sesion.estado === 'programada' ? 'bg-neon-green/20 text-neon-green' :
            sesion.estado === 'completada' ? 'bg-white/10 text-text-muted' : 'bg-red-500/20 text-red-400'
          }`}>
            {sesion.estado}
          </div>
        </div>

        {/* Meet link */}
        {sesion.linkMeet && (
          <div className="mt-3 space-y-2">
            <div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-2">
              <p className="text-text-dim text-[10px] font-bold uppercase tracking-wide mb-0.5">Link de la reunión</p>
              <p className="text-white/80 text-xs font-mono break-all leading-relaxed">{sesion.linkMeet}</p>
            </div>
            <div className="flex gap-2">
              <motion.a
                href={sesion.linkMeet}
                target="_blank"
                rel="noopener noreferrer"
                whileTap={{ scale: 0.97 }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-neon-green text-[#0A0A12] hover:brightness-105 transition-all font-bold text-sm shadow-neon"
              >
                <Video size={16} />
                {isToday ? '🟢 Entrar ahora' : 'Abrir reunión'}
              </motion.a>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={copyMeetLink}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 transition-colors font-bold text-sm"
              >
                {linkCopied ? <Check size={16} className="text-neon-green" /> : <Copy size={16} />}
                {linkCopied ? 'Copiado' : 'Copiar'}
              </motion.button>
            </div>
            <p className="text-text-dim text-[10px] text-center">
              Copia el link y envíaselo al estudiante por WhatsApp o email
            </p>
          </div>
        )}

        {/* Agenda topics */}
        {sesion.temasAgenda?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {sesion.temasAgenda.map((t: string) => (
              <span key={t} className="bg-white/10 text-white/70 text-xs font-semibold px-3 py-1 rounded-full border border-white/10">{t}</span>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 mt-5 space-y-4">
        {/* AI Profile summary */}
        {student?.perfil?.resumenIA && (
          <div className="bg-surface-elevated border border-primary-dark/20 rounded-2xl p-4 flex gap-3"
            style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #2A1A4E 100%)' }}
          >
            <span className="text-2xl flex-shrink-0">✨</span>
            <div>
              <p className="text-xs font-bold text-primary-dark/80 uppercase tracking-wide mb-1">Perfil financiero (IA)</p>
              <p className="text-sm text-text-muted leading-relaxed">{student.perfil.resumenIA}</p>
            </div>
          </div>
        )}

        {/* Alerts */}
        {stats?.alertas?.length > 0 && (
          <div className="space-y-2">
            {stats.alertas.map((a: any, i: number) => {
              const cfg = ALERTA_ICON[a.tipo as keyof typeof ALERTA_ICON]
              const Icon = cfg.icon
              return (
                <div key={i} className={`flex items-start gap-2 border rounded-2xl px-4 py-3 ${cfg.color}`}>
                  <Icon size={15} className="mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-semibold">{a.mensaje}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Stats section */}
        <div className="bg-surface-raised border border-border-light rounded-3xl overflow-hidden">
          <button
            onClick={() => setShowStats((v) => !v)}
            className="w-full flex items-center justify-between p-4 hover:bg-surface-elevated transition-colors"
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-neon-green" />
              <span className="font-bold text-white">Estadísticas de gasto</span>
            </div>
            {showStats ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
          </button>

          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {statsLoading ? (
                  <div className="px-4 pb-4 space-y-2">
                    {[0,1,2].map((i) => <div key={i} className="h-10 bg-surface-elevated rounded-xl animate-pulse" />)}
                  </div>
                ) : stats ? (
                  <div className="px-4 pb-5 space-y-5 border-t border-border-light">
                    {/* KPIs */}
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <KpiBox label="Este mes" value={formatCurrency(stats.totalMes)} icon={DollarSign} />
                      <KpiBox
                        label="Presupuesto"
                        value={stats.metaActiva ? formatCurrency(stats.metaActiva.montoObjetivo) + '/sem' : '—'}
                        icon={Target}
                      />
                      <KpiBox
                        label="Avance sem."
                        value={stats.metaActiva
                          ? `${Math.round((stats.metaActiva.montoGastado / stats.metaActiva.montoObjetivo) * 100)}%`
                          : '—'}
                        icon={TrendingUp}
                        danger={stats.metaActiva && stats.metaActiva.montoGastado > stats.metaActiva.montoObjetivo}
                      />
                    </div>

                    {/* Weekly trend */}
                    <div>
                      <p className="text-xs font-bold text-text-muted uppercase tracking-wide mb-3">Últimas 4 semanas</p>
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={stats.semanas} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8B8BA7', fontWeight: 600 }} />
                          <YAxis tick={{ fontSize: 10, fill: '#8B8BA7' }} />
                          <Tooltip
                            formatter={(v: number, name: string) => [formatCurrency(v), name === 'total' ? 'Gasto' : 'Presupuesto']}
                            contentStyle={{ borderRadius: 12, border: '1px solid #2A2A40', backgroundColor: '#1A1A2E', color: '#fff', fontSize: 12 }}
                            labelStyle={{ color: '#8B8BA7' }}
                          />
                          <Bar dataKey="presupuesto" fill="rgba(124,77,255,0.15)" radius={[4,4,0,0]} name="Presupuesto" />
                          <Bar dataKey="total" radius={[4,4,0,0]} name="Gasto">
                            {stats.semanas.map((s: any, i: number) => (
                              <Cell key={i} fill={s.total > s.presupuesto ? '#FF6B6B' : '#A8FF3E'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Category breakdown */}
                    <div>
                      <p className="text-xs font-bold text-text-muted uppercase tracking-wide mb-3">Por categoría (30 días)</p>
                      <div className="space-y-2">
                        {stats.categoryBreakdown.map((c: any) => (
                          <div key={c.categoria} className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[c.categoria] ?? '#E5E5E5' }} />
                            <span className="text-sm text-text-muted flex-1">{c.categoria}</span>
                            <div className="flex-1 h-2 bg-surface-elevated rounded-full">
                              <div className="h-full rounded-full" style={{ width: `${c.porcentaje}%`, backgroundColor: CATEGORY_COLORS[c.categoria] ?? '#E5E5E5' }} />
                            </div>
                            <span className="text-sm font-bold text-white w-16 text-right">{formatCurrency(c.monto)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mood section */}
        <div className="bg-surface-raised border border-border-light rounded-3xl overflow-hidden">
          <button onClick={() => setShowMoods((v) => !v)} className="w-full flex items-center justify-between p-4 hover:bg-surface-elevated transition-colors">
            <span className="font-bold text-white flex items-center gap-2">😊 Estado emocional reciente</span>
            {showMoods ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
          </button>
          <AnimatePresence>
            {showMoods && stats?.moods && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-4 pb-4 border-t border-border-light pt-3">
                  {stats.moods.length === 0 ? (
                    <p className="text-sm text-text-muted text-center py-2">Sin registros de mood</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {stats.moods.map((m: any) => (
                        <div key={m.id} className="flex items-center gap-1.5 bg-surface-elevated border border-border-light rounded-xl px-3 py-1.5">
                          <span>{MOOD_EMOJI[m.mood] ?? '😐'}</span>
                          <span className="text-xs font-semibold text-text-muted">{formatDate(m.fecha)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Recent transactions */}
        <div className="bg-surface-raised border border-border-light rounded-3xl overflow-hidden">
          <button onClick={() => setShowTxs((v) => !v)} className="w-full flex items-center justify-between p-4 hover:bg-surface-elevated transition-colors">
            <span className="font-bold text-white flex items-center gap-2">💳 Últimas transacciones</span>
            {showTxs ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
          </button>
          <AnimatePresence>
            {showTxs && stats?.transaccionesRecientes && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-4 pb-4 space-y-1 border-t border-border-light pt-2">
                  {stats.transaccionesRecientes.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between py-2 border-b border-border-light/50 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-white">{t.descripcion ?? t.categoria}</p>
                        <p className="text-xs text-text-muted">{t.categoria} · {formatDate(t.fecha)}</p>
                      </div>
                      <span className="font-bold text-sm text-red-400">-{formatCurrency(t.monto)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Observations */}
        {sesion.observaciones ? (
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} className="text-neon-green" />
              <h3 className="font-bold text-white">Notas de sesión guardadas</h3>
            </div>
            {sesion.observaciones.notasImportantes && (
              <p className="text-sm text-text-muted mb-3">{sesion.observaciones.notasImportantes}</p>
            )}
            {sesion.observaciones.compromisosProximaSemana.length > 0 && (
              <div className="bg-surface-elevated border border-border-light rounded-2xl p-3">
                <p className="text-xs font-bold text-text-muted uppercase tracking-wide mb-2">Compromisos</p>
                {sesion.observaciones.compromisosProximaSemana.map((c: string) => (
                  <p key={c} className="text-sm text-white">• {c}</p>
                ))}
              </div>
            )}
            <button onClick={() => setShowObsForm(true)} className="mt-3 text-xs text-neon-green font-bold underline">
              Editar notas
            </button>
          </Card>
        ) : isPending ? (
          <Button onClick={() => setShowObsForm(true)} variant="secondary" fullWidth size="lg">
            📝 Registrar notas de sesión
          </Button>
        ) : null}

        {/* Observations form */}
        <AnimatePresence>
          {showObsForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-surface-raised border border-border-light rounded-3xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-lg">Notas de sesión</h3>
                <button onClick={() => setShowObsForm(false)} className="w-7 h-7 rounded-full bg-surface-elevated border border-border-light flex items-center justify-center hover:border-red-500/40 transition-colors">
                  <X size={14} className="text-text-muted" />
                </button>
              </div>

              <TagInput label="Temas discutidos" items={temas} setItems={setTemas} value={newTema} setValue={setNewTema} placeholder="Ej. Presupuesto mensual" />
              <TagInput label="Patrones identificados" items={patrones} setItems={setPatrones} value={newPatron} setValue={setNewPatron} placeholder="Ej. Gasto impulsivo en fin de semana" />
              <TagInput label="Compromisos próxima semana" items={compromisos} setItems={setCompromisos} value={newCompromiso} setValue={setNewCompromiso} placeholder="Ej. Registrar todos los gastos" />

              <div>
                <label className="text-sm font-semibold text-white mb-1.5 block">Notas importantes</label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={3}
                  placeholder="Observaciones generales sobre la sesión..."
                  className="w-full rounded-2xl border border-border-light bg-surface-elevated p-3 text-sm text-white placeholder:text-text-dim resize-none focus:outline-none focus:ring-2 focus:ring-primary-dark/40"
                />
              </div>

              <Button onClick={handleSaveObs} loading={saving} fullWidth size="lg">
                <Save size={16} className="mr-2" /> Guardar y completar sesión
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function KpiBox({ label, value, icon: Icon, danger }: { label: string; value: string; icon: any; danger?: boolean }) {
  return (
    <div className={`rounded-2xl p-3 text-center border ${danger ? 'bg-red-500/10 border-red-500/30' : 'bg-surface-elevated border-border-light'}`}>
      <Icon size={14} className={`mx-auto mb-1 ${danger ? 'text-red-400' : 'text-neon-green'}`} />
      <p className={`text-base font-extrabold font-display ${danger ? 'text-red-400' : 'text-white'}`}>{value}</p>
      <p className="text-[10px] font-semibold text-text-muted mt-0.5">{label}</p>
    </div>
  )
}

function TagInput({
  label, items, setItems, value, setValue, placeholder,
}: {
  label: string; items: string[]; setItems: (v: string[]) => void;
  value: string; setValue: (v: string) => void; placeholder: string;
}) {
  const add = () => {
    const t = value.trim()
    if (t && !items.includes(t)) { setItems([...items, t]); setValue('') }
  }
  return (
    <div>
      <label className="text-sm font-semibold text-white mb-1.5 block">{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="flex-1 h-10 rounded-xl border border-border-light bg-surface-elevated px-3 text-sm text-white placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary-dark/40"
        />
        <button type="button" onClick={add} className="w-10 h-10 rounded-xl bg-primary-dark text-white flex items-center justify-center flex-shrink-0 hover:bg-primary-dark/80 transition-colors">
          <Plus size={16} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="inline-flex items-center gap-1 bg-primary-dark/20 border border-primary-dark/30 text-primary-dark text-xs font-semibold px-2.5 py-1 rounded-full">
            {item}
            <button type="button" onClick={() => setItems(items.filter((i) => i !== item))} className="hover:text-red-400 transition-colors">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}
