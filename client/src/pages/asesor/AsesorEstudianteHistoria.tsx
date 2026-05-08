import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ClipboardList, TrendingUp, CheckCircle2,
  AlertCircle, ChevronDown, ChevronUp, BookOpen,
  Target, Brain, Calendar, FileText, User,
} from 'lucide-react'
import { useEstudianteHistoria, useSaveObservacion } from '../../hooks/useAsesor'
import { formatDate, formatTime, getInitials } from '../../lib/utils'

const OBJETIVO_LABEL: Record<string, string> = {
  SAVE_MORE:      '💰 Ahorrar más',
  SPEND_SMARTER:  '🧠 Gastar mejor',
  STOP_IMPULSE:   '🛑 Frenar compras impulsivas',
  LESS_STRESS:    '😌 Reducir estrés financiero',
}

const ESTADO_STYLE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  completada: { bg: 'bg-neon-green/10',    text: 'text-neon-green',   dot: 'bg-neon-green',   label: 'Completada' },
  programada: { bg: 'bg-primary-dark/10',  text: 'text-primary-dark', dot: 'bg-primary-dark', label: 'Programada' },
  aplazada:   { bg: 'bg-yellow-500/10',    text: 'text-yellow-400',   dot: 'bg-yellow-400',   label: 'Aplazada'   },
  cancelada:  { bg: 'bg-red-500/10',       text: 'text-red-400',      dot: 'bg-red-400',      label: 'Cancelada'  },
}

export function AsesorEstudianteHistoria() {
  const { userId } = useParams<{ userId: string }>()
  const navigate   = useNavigate()
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading } = useEstudianteHistoria(userId ?? null)

  if (isLoading) {
    return (
      <div className="px-5 pt-12 pb-8 space-y-4">
        <div className="h-8 w-48 bg-surface-raised rounded-xl animate-pulse" />
        {[0,1,2].map((i) => (
          <div key={i} className="h-36 bg-surface-raised border border-border-light rounded-3xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data?.student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-4xl mb-2">🔍</p>
          <p className="text-text-muted font-semibold">Estudiante no encontrado</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-neon-green text-sm font-bold">← Volver</button>
        </div>
      </div>
    )
  }

  const { student, sesiones, resumen } = data
  const sorted = [...sesiones].sort((a: any, b: any) => {
    const ta = new Date(a.fechaHora).getTime()
    const tb = new Date(b.fechaHora).getTime()
    return order === 'desc' ? tb - ta : ta - tb
  })

  const conNotas = sesiones.filter((s: any) => s.observaciones)

  return (
    <div className="pb-10">
      {/* ── Header ── */}
      <div
        className="px-5 pt-12 pb-6"
        style={{ background: 'linear-gradient(160deg, #0d0d1a 0%, #1a1040 100%)', borderBottom: '1px solid rgba(124,77,255,0.2)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-text-muted text-sm mb-5 hover:text-white transition-colors"
        >
          <ArrowLeft size={15} /> Volver
        </button>

        {/* Student identity */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-primary-dark/30 border border-primary-dark/40 flex items-center justify-center text-2xl font-extrabold text-primary-dark flex-shrink-0">
            {getInitials(student.nombre)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl font-extrabold text-white">{student.nombre}</h1>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-text-muted border border-white/10">
                Historia Clínica
              </span>
            </div>
            <p className="text-text-muted text-sm">{student.universidad}{student.semestre ? ` · Sem. ${student.semestre}` : ''}</p>
            <p className="text-text-dim text-xs mt-0.5">{student.email}</p>
            {student.perfil?.objetivo && (
              <p className="text-xs text-primary-dark font-semibold mt-1.5">
                {OBJETIVO_LABEL[student.perfil.objetivo] ?? student.perfil.objetivo}
              </p>
            )}
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-2">
          <KpiMini label="Sesiones" value={resumen.totalSesiones} icon="📅" />
          <KpiMini label="Completadas" value={resumen.sesionesCompletadas} icon="✅" />
          <KpiMini label="Con notas" value={resumen.sesionesConNotas} icon="📝" />
          <KpiMini label="Compromisos" value={resumen.totalCompromisos} icon="🎯" />
        </div>
      </div>

      <div className="px-5 mt-5 space-y-5">

        {/* ── AI Profile ── */}
        {student.perfil?.resumenIA && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-5 space-y-1"
            style={{ background: 'linear-gradient(135deg, #1a1040 0%, #0d0d1a 100%)', border: '1px solid rgba(124,77,255,0.2)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Brain size={15} className="text-primary-dark" />
              <p className="text-xs font-bold text-primary-dark uppercase tracking-wider">Perfil Financiero (IA)</p>
            </div>
            <p className="text-sm text-text-muted leading-relaxed">{student.perfil.resumenIA}</p>
            {student.perfil.dificultadesReportadas?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {student.perfil.dificultadesReportadas.map((d: string) => (
                  <span key={d} className="text-[11px] px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-semibold">
                    {d}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Recurrent patterns ── */}
        {resumen.patronesRecurrentes?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-surface-raised border border-border-light rounded-3xl p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={15} className="text-amber-400" />
              <h3 className="font-bold text-white text-sm">Patrones recurrentes</h3>
              <span className="ml-auto text-[10px] text-text-dim">Frecuencia en sesiones</span>
            </div>
            <div className="space-y-2">
              {resumen.patronesRecurrentes.map(({ patron, veces }: any) => (
                <div key={patron} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{patron}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="flex gap-0.5">
                      {Array.from({ length: Math.min(veces, 5) }).map((_, i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-amber-400" />
                      ))}
                    </div>
                    <span className="text-[11px] text-amber-400 font-bold">×{veces}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Recurrent topics ── */}
        {resumen.temasRecurrentes?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-surface-raised border border-border-light rounded-3xl p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={15} className="text-neon-green" />
              <h3 className="font-bold text-white text-sm">Temas más trabajados</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {resumen.temasRecurrentes.map(({ tema, veces }: any) => (
                <span key={tema} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-2xl bg-neon-green/10 border border-neon-green/20 text-neon-green font-semibold">
                  {tema}
                  {veces > 1 && <span className="text-[10px] opacity-70">×{veces}</span>}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Timeline ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-white flex items-center gap-2">
              <ClipboardList size={16} className="text-primary-dark" />
              Historial de sesiones
            </h2>
            <button
              onClick={() => setOrder((o) => o === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-white transition-colors bg-surface-elevated border border-border-light rounded-xl px-3 py-1.5 font-semibold"
            >
              <Calendar size={11} />
              {order === 'desc' ? 'Más reciente' : 'Más antigua'}
            </button>
          </div>

          {sorted.length === 0 ? (
            <div className="bg-surface-raised border border-border-light rounded-3xl p-8 text-center">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm text-text-muted">No hay sesiones registradas</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-primary-dark/40 via-white/10 to-transparent" />

              <div className="space-y-4 pl-14">
                {sorted.map((sesion: any, idx: number) => {
                  const style   = ESTADO_STYLE[sesion.estado] ?? ESTADO_STYLE.programada
                  const obs     = sesion.observaciones
                  const isOpen  = expandedId === sesion.id
                  const isFirst = idx === 0

                  return (
                    <motion.div
                      key={sesion.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="relative"
                    >
                      {/* Timeline dot */}
                      <div className={`absolute -left-9 top-5 w-3.5 h-3.5 rounded-full border-2 border-[#0A0A12] ${style.dot} ${isFirst ? 'scale-125' : ''}`} />

                      <div className={`bg-surface-raised border rounded-3xl overflow-hidden transition-all ${
                        isFirst && sesion.estado === 'programada'
                          ? 'border-primary-dark/30'
                          : 'border-border-light'
                      }`}>
                        {/* Header row */}
                        <button
                          onClick={() => setExpandedId(isOpen ? null : sesion.id)}
                          className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-surface-elevated/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                                {style.label}
                              </span>
                              {isFirst && sesion.estado === 'programada' && (
                                <span className="text-[10px] font-bold text-primary-dark bg-primary-dark/10 px-2 py-0.5 rounded-full border border-primary-dark/20">
                                  Próxima
                                </span>
                              )}
                              {obs && (
                                <span className="text-[10px] font-bold text-neon-green/70 flex items-center gap-0.5">
                                  <FileText size={9} /> Notas
                                </span>
                              )}
                            </div>
                            <p className="font-bold text-white text-sm">
                              {formatDate(sesion.fechaHora, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">
                              {formatTime(sesion.fechaHora)} · {sesion.duracionMin} min
                            </p>
                            {sesion.temasAgenda?.length > 0 && (
                              <p className="text-[11px] text-text-dim mt-1 truncate">
                                Agenda: {sesion.temasAgenda.join(' · ')}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Link
                              to={`/asesor/sesion/${sesion.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] font-bold text-primary-dark/70 hover:text-primary-dark transition-colors px-2 py-1 rounded-lg hover:bg-primary-dark/10"
                            >
                              Abrir
                            </Link>
                            {obs || sesion.estado !== 'cancelada' ? (
                              isOpen
                                ? <ChevronUp size={14} className="text-text-muted" />
                                : <ChevronDown size={14} className="text-text-muted" />
                            ) : null}
                          </div>
                        </button>

                        {/* Notes detail */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-border-light px-5 py-4 space-y-4">
                                {obs ? (
                                  <>
                                    {obs.notasImportantes && (
                                      <div className="bg-surface-elevated border border-border-light rounded-2xl p-4">
                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                          <FileText size={10} /> Notas del asesor
                                        </p>
                                        <p className="text-sm text-text-muted leading-relaxed">{obs.notasImportantes}</p>
                                      </div>
                                    )}

                                    {obs.temasDiscutidos?.length > 0 && (
                                      <NoteSection
                                        title="Temas discutidos"
                                        items={obs.temasDiscutidos}
                                        color="text-neon-green"
                                        dotColor="bg-neon-green/60"
                                      />
                                    )}

                                    {obs.patronesIdentificados?.length > 0 && (
                                      <NoteSection
                                        title="Patrones identificados"
                                        items={obs.patronesIdentificados}
                                        color="text-amber-400"
                                        dotColor="bg-amber-400/60"
                                      />
                                    )}

                                    {obs.compromisosProximaSemana?.length > 0 && (
                                      <NoteSection
                                        title="Compromisos asignados"
                                        items={obs.compromisosProximaSemana}
                                        color="text-primary-dark"
                                        dotColor="bg-primary-dark/60"
                                      />
                                    )}
                                  </>
                                ) : (
                                  <div className="text-center py-4">
                                    <p className="text-text-dim text-sm mb-3">Sin notas para esta sesión</p>
                                    {sesion.estado !== 'cancelada' && (
                                      <Link
                                        to={`/asesor/sesion/${sesion.id}`}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-dark border border-primary-dark/30 bg-primary-dark/10 px-4 py-2 rounded-xl hover:bg-primary-dark/20 transition-colors"
                                      >
                                        <FileText size={12} /> Agregar notas
                                      </Link>
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function KpiMini({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center">
      <p className="text-base mb-0.5">{icon}</p>
      <p className="text-lg font-extrabold text-white leading-none">{value}</p>
      <p className="text-[9px] font-bold text-text-dim mt-0.5 uppercase tracking-wide">{label}</p>
    </div>
  )
}

function NoteSection({ title, items, color, dotColor }: {
  title: string; items: string[]; color: string; dotColor: string
}) {
  return (
    <div>
      <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${color}`}>{title}</p>
      <div className="space-y-1.5">
        {items.map((item: string) => (
          <div key={item} className="flex items-start gap-2">
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
            <p className="text-sm text-text-muted leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
